import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/lib/aiClient";
import { padToBudget } from "@/lib/premiumProducts";
import { applySpendingAlternatives } from "@/lib/groceryAlternatives";
import { grocerySpending, normalizeGroceryTotal, spendingIssues, preferSpendingCandidate, spendingFailureMessage } from "@/lib/grocerySpending";

const GROCERY_SCHEMA = {
  type: "object",
  properties: {
    total_estimated_cost: { type: "number" },
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "string" },
                unit_price: { type: "number" },
                price: { type: "number" },
                normal_price: { type: "number" },
                store: { type: "string" },
                calories_info: { type: "string", description: "Energy density, e.g. '370 kcal/100g'" },
                total_kcal: { type: "number", description: "Total kilocalories in the full purchased quantity (all packs combined)" },
                protein_g: { type: "number", description: "Total grams of protein in the full purchased quantity" },
                carb_g: { type: "number", description: "Total grams of carbohydrates in the full purchased quantity" },
                fat_g: { type: "number", description: "Total grams of fat in the full purchased quantity" },
              },
            },
          },
        },
      },
    },
  },
};

// "aldi,tegut" or "Aldi (Street 1, City), Tegut" → ["Aldi", "Tegut"]
export function allowedStoreNames(stores) {
  const names = String(stores || "").replace(/\([^)]*\)/g, "").split(",")
    .map((s) => s.trim()).filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  return [...new Set(names)];
}

export function groceryParamsFromSearch(search) {
  const params = new URLSearchParams(search);
  const macrosParam = params.get("macros");
  return {
    budget: params.get("budget") || 150,
    stores: params.get("stores") || "",
    diet: params.get("diet") || "balanced",
    calories: params.get("calories") || 2000,
    days: parseInt(params.get("days") || "30", 10),
    people: params.get("people") || 1,
    saleHunt: params.get("saleHunt") === "true",
    bio: params.get("bio") === "true",
    spendMode: params.get("spendMode") || "balanced",
    junkPercent: parseInt(params.get("junkPercent") || "0", 10),
    proteinSnackBudget: parseInt(params.get("proteinSnackBudget") || "0", 10),
    allergies: params.get("allergies") ? params.get("allergies").split(",").filter(Boolean) : [],
    ownedItems: params.get("owned") ? params.get("owned").split(",").filter(Boolean) : [],
    macros: macrosParam
      ? (() => { const [p, c, f] = macrosParam.split(",").map(Number); return { protein: p || 30, carbs: c || 40, fats: f || 30 }; })()
      : null,
    postalCode: params.get("plz") || "",
  };
}

// Bump PROMPT_VERSION whenever the generation prompt changes meaningfully —
// it invalidates both the server-side GroceryCache and the per-user
// sessionStorage cache so users get the improved output on their next visit
// instead of waiting up to 14 days for stale entries to expire.
const PROMPT_VERSION = 15; // v15: enforce Save/Balanced with actual product swaps, separate allowances and validated totals

export function grocerySignature(p, langCode) {
  return JSON.stringify({
    budget: p.budget, stores: p.stores, diet: p.diet, calories: p.calories,
    days: p.days, people: p.people, saleHunt: p.saleHunt, bio: p.bio,
    spendMode: p.spendMode, junkPercent: p.junkPercent, proteinSnackBudget: p.proteinSnackBudget,
    allergies: p.allergies, ownedItems: p.ownedItems, macros: p.macros, postalCode: p.postalCode, lang: langCode,
    v: PROMPT_VERSION,
  });
}

const PREFIX = "bb_grocery_v2_"; // v2: drops lists cached before the budget cap was enforced
export function getCachedGroceries(sig) {
  try { const raw = sessionStorage.getItem(PREFIX + sig); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function setCachedGroceries(sig, data) {
  try { sessionStorage.setItem(PREFIX + sig, JSON.stringify(data)); } catch { /* ignore */ }
}

// --- Server-side shared grocery cache (#1) ---
// Identical configs (budget/stores/diet/calories/days/people/macros/allergies/owned/plz/lang)
// produce identical grocery lists, so the 2nd..Nth user with the same config gets a
// cache hit for ~0 credits instead of ~5. TTL keeps prices from going stale.
const SERVER_CACHE_TTL_DAYS = 14;
async function getCachedGroceryServer(sig) {
  try {
    const records = await base44.entities.GroceryCache.filter({ signature: sig }, "-created_date", 1);
    if (!records || !records.length) return null;
    const rec = records[0];
    const ageMs = Date.now() - new Date(rec.created_date).getTime();
    if (ageMs > SERVER_CACHE_TTL_DAYS * 86400000) return null; // stale — miss
    return rec.payload;
  } catch {
    return null; // any cache error → fall through to a fresh generation
  }
}
function saveCachedGroceryServer(sig, payload, p, langCode) {
  try {
    return base44.entities.GroceryCache.create({
      signature: sig,
      payload,
      postalCode: p.postalCode || "",
      diet: p.diet || "",
      lang: langCode || "",
      budget: Number(p.budget) || 0,
      days: Number(p.days) || 0,
    });
  } catch {
    return Promise.resolve(); // fire-and-forget — never block the user
  }
}

// Builds the budget rule (rule 4) based on the user's spending mode:
//  - "save": spend as little as possible while still covering the days/calories
//  - "maximize": spend the full budget on higher-value / premium groceries
//  - default ("balanced"): stay just under budget, close to it
function spendModeRule(p) {
  const budget = Number(p.budget);
  const snacks = Number(p.proteinSnackBudget) || 0;
  const totalCap = budget + snacks;
  const mode = p.spendMode || "balanced";
  if (mode === "save") {
    return `4. SAVE MODE: Spend as little as possible, not a minimum percentage of the budget. Aim for main groceries at or below €${(Math.floor(budget * 80) / 100).toFixed(2)} (80% of the user's €${budget} maximum). If the cheapest suitable foods genuinely require more to cover the full nutrition, use the minimum necessary up to the absolute €${budget} maximum, never drop meals just to hit a percentage. Use low-cost house brands and seasonal essentials from the selected stores. Buy enough for ${p.days} days at ~${p.calories} kcal/day, but no surplus, premium upgrades or luxury filler. Never cut needed calories or distort prices to meet the saving target. Protein snacks have their own separate €${snacks} allowance and cannot fund main groceries.`;
  }
  if (mode === "maximize") {
    return `4. CRITICAL BUDGET RULE — MAXIMIZE VALUE MODE: The user wants to SPEND THE FULL BUDGET on higher-value groceries. The main grocery budget (excluding Protein Snacks) should be as close to €${budget} as possible — ideally between €${Math.round(budget * 0.95)} and €${budget}, and never over. Use the full budget to UPGRADE quality and variety, NOT to pile up cheap bulk staples: prefer better cuts of meat, fresh fish, organic produce, branded quality goods, nuts, cheese, fresh fruit, and nicer treats. The list should feel like a noticeable step up in quality and variety compared to a budget list, while still covering ${p.days} days at ~${p.calories} kcal/day. If you are well under budget, add more premium / higher-value items (not more of the same cheap staple) until the total is close to €${budget}. The total_estimated_cost MUST reflect the real sum of ALL item prices including protein snacks, and it too must be below the total budget (€${totalCap}).`;
  }
  return `4. BALANCED MODE: Main groceries must cost €${(Math.ceil(budget * 92) / 100).toFixed(2)}–€${budget}, targeting about €${(budget * 0.96).toFixed(2)}. Choose a sensible mix of everyday staples, fresh foods and variety, not exclusively the cheapest products and not luxury groceries. If under target, replace existing ingredients with better everyday-quality equivalents at their real prices, preserving the amount of food needed for ${p.days} days at ~${p.calories} kcal/day. Never inflate prices or add surplus food just to spend money. Protein snacks have a separate €${snacks} allowance; do not count them toward the main spending target. All item prices must add up to the actual total.`;
}

export function buildGroceryPrompt(p, langLabel, knownPricesText = "") {
  const { people, diet, days, budget, calories, stores, saleHunt, bio, junkPercent, proteinSnackBudget, allergies, ownedItems, macros } = p;
  return `Generate a grocery list for ${people} person(s) with a ${diet} diet in Germany, covering exactly ${days} days.

Budget for main groceries: €${p.spendMode === "save" ? (Math.floor(Number(budget) * 80) / 100).toFixed(2) : budget} for ${days} days${p.spendMode === "save" ? ` (saving target; the user's absolute maximum is €${budget})` : ""}.
Calories: ~${calories} kcal/day for all ${people} person(s).
Stores: ${stores || "any German supermarket"}.${allowedStoreNames(stores).length ? `\nSTRICT STORE RULE: every item's "store" MUST be exactly one of: ${allowedStoreNames(stores).join(", ")}. Never use any other store, even if it is cheaper, and only pick products actually sold at these stores. Store names in the examples below are illustrations only.` : ""}
Region: postal code ${p.postalCode || "unknown"} — supermarket prices vary by region in Germany; use local prices for this postal code when available.
Language: ${langLabel}.
${knownPricesText ? `PRICE REFERENCE (prices observed earlier — use them ONLY to price products you choose; this is NOT a shopping list, do not copy it or limit your selection to it):\n${knownPricesText}\n` : ""}
${diet === "half-cooked" || diet === "frozen" ? `DIET MODE: FROZEN FOODS ONLY. ONLY include fully frozen, ready-to-heat meals and frozen convenience products available at German supermarkets — e.g. "iglo Fischstäbchen 400g", "Gut & Günstig Tiefkühl-Pizza Salami 400g", "Apetito Schnitzel gebacken 400g", "Dr. Oetker Steinofen-Pizza Mozzarella 350g", "Aldi Tiefkühl Hähnchen-Nuggets 500g", "McCain Pommes Frites 750g", "Bofrost Spinat-Käse-Tortellini 500g", "iglo Gemüse-Pfanne 750g", "Lidl Fairglobe Bio Edamame 400g". DO NOT include any raw unprocessed ingredients (no raw vegetables, no flour, no raw meat cuts). All items must be sold frozen and require only microwave or oven heating.` : ""}
${macros ? `MACRONUTRIENT TARGETS: The user wants the daily caloric intake to come from approximately ${macros.protein}% protein, ${macros.carbs}% carbohydrates, and ${macros.fats}% fats. Choose products and quantities so the OVERALL grocery list hits this split as closely as possible (e.g. more protein-rich foods like eggs, skyr, chicken, lentils for higher protein; more grains, rice, pasta for higher carbs; more oils, nuts, avocado for higher fats). For EVERY item you MUST fill protein_g, carb_g and fat_g with the total grams of each macronutrient in the full purchased quantity (all packs combined), using realistic German food-composition values. The sum of (protein_g*4 + carb_g*4 + fat_g*9) across all items must roughly equal the sum of total_kcal, and the resulting percentage split (by kcal) must be within ±8 percentage points of the target (${macros.protein}/${macros.carbs}/${macros.fats}).` : ""}
Rules:
1. Use real 2024-2025 German supermarket prices from the listed stores (e.g. Aldi Vollmilch 1L = €0.99, Lidl Eier 10er = €1.99).
2. ${p.spendMode === "save" ? "Pick the cheapest suitable product and selected store for each ingredient." : p.spendMode === "maximize" ? "Pick the cheapest selected store for each item." : "Choose reasonably priced everyday-quality products, mixing house brands with fresh ingredients rather than buying only the cheapest staples."} Include a varied selection (${days >= 14 ? "roughly 15–25" : "roughly 10–18"} distinct products across proteins, grains, vegetables, fruit and dairy) so meals don't repeat — use fewer packs of each item rather than fewer items.
3. The price field = unit price × quantity needed for ${days} days (scale quantities to exactly cover ${days} days, not a full month). Never buy more than 6 packs of the same product — if more of an ingredient is needed, choose a larger pack size (e.g. a 2L milk carton instead of two 1L cartons, a 1kg rice bag instead of two 500g bags) rather than stacking many small packs. Keep every item to a realistic amount a person actually consumes: no single item should provide more than ~25% of one day's calories, and milk in particular is a drink, not a calorie source — a person has at most one glass (~250ml) a day, so never plan more than ~${Math.max(2, Math.ceil(p.people * 0.25 * days))}L of milk total for the whole period; if you need more dairy calories, use yogurt, quark, skyr, or cheese, not more milk.
${spendModeRule(p)}
 5. All text in ${langLabel}, EXCEPT category names which MUST always be in English (e.g. "Dairy", "Vegetables", "Meat", "Bread & Bakery", "Snacks", etc.).
6. For each item, also provide normal_price: the realistic price for the SAME product (or its closest mid-range equivalent, e.g. the REWE Best Bucks / Edeka Eigenmarke version of the same product) at a mid-range German supermarket (REWE or Edeka) for the SAME quantity. This is a genuine price comparison against the budget store, NOT the same store's price. As a realistic guideline, mid-range supermarkets in Germany are typically 10–20% more expensive than hard-discounters (Aldi/Lidl) on the same or equivalent products — so normal_price should usually be HIGHER than price (typically by 10–20% for discounters, closer to 0% for mid-range chains like REWE/Edeka themselves), and should never be lower than price. Many branded goods (e.g. branded chocolate, Coca-Cola, Nutella) cost nearly the same everywhere — for those, normal_price should be at most a few cents above price. Compute each normal_price independently from a realistic mid-range price; do NOT copy the price field. The savings shown to the user is the sum of (normal_price − price), so accurate, honestly-higher normal_prices are essential.
7. CRITICAL: The item name MUST include the full real product name with the brand name as sold in the store (e.g. "Ja! Vollmilch 3,5% 1L", "Milbona Naturjoghurt 500g", "Gut & Günstig Haferflocken 500g", "Tandil Waschmittel Pulver 1,5kg"). Never use generic names like "Milk" or "Oats" — always use the actual branded product name. Set calories_info to the energy density (e.g. "370 kcal/100g"), total_kcal to the total kilocalories of the full purchased quantity, and protein_g/carb_g/fat_g to the total grams of each macronutrient in that same full quantity. The sum of all total_kcal should be close to ${Math.round(calories * days)} kcal — enough food for ${days} days, not more.
${junkPercent > 0 ? `8. JUNK FOOD ALLOWANCE: Up to ${junkPercent}% of daily calories (${Math.round((junkPercent / 100) * calories)} kcal/day) can come from junk food / treats (e.g. chips, chocolate, fast food, sweets, sodas). Include appropriate junk food items in the grocery list that cover this allowance.` : "8. Keep the grocery list clean and healthy — no junk food or treats."}
${saleHunt ? `9. SALE HUNT MODE IS ON: Actively look for items that are currently on sale or promotion at the listed stores. ONLY include a sale item if its sale price is genuinely lower than what you would normally pay elsewhere — never include items just because they are "on sale" if the discounted price is still higher than the cheapest regular alternative. Prioritize items where the sale price represents a real saving versus normal market prices.` : ""}
${bio ? `10. BIO / ORGANIC MODE IS ON: ALL items MUST be certified organic or bio products (e.g. "Alnatura", "Bioland", "demeter", "Bio" label). Prefer organic ranges available at the listed stores. Product names must include the bio/organic brand or label (e.g. "Alnatura Vollmilch 3,5% 1L", "Bio Bio Haferflocken 500g"). Do not include any conventional non-organic products.` : ""}
${allergies.length > 0 ? `11. ALLERGIES / INTOLERANCES: NEVER include any products containing or derived from: ${allergies.join(", ")}. This is critical — exclude any item that contains these ingredients.` : ""}
${ownedItems.length > 0 ? `12. ALREADY OWNED: The user already has these at home, do NOT include them in the grocery list: ${ownedItems.join(", ")}.` : ""}
${proteinSnackBudget > 0 ? `13. ⚠️ MANDATORY PROTEIN SNACKS CATEGORY — DO NOT SKIP: The user has set a dedicated protein snack budget of €${proteinSnackBudget}. You MUST add a category called exactly "Protein Snacks" to the categories array. The total price of all items in this category MUST be as close to €${proteinSnackBudget} as possible (within €1). Include at least 4 real branded protein products sold in Germany (e.g. "Corny Big High Protein Bar Schoko 50g", "Lidl Protein Bar Chocolate 45g", "Aldi Skyr Protein Quark 500g", "dm Protein Shake Pulver Schoko 750g", "Müllermilch Protein Drink 400ml"). This €${proteinSnackBudget} is in ADDITION to the main €${budget} grocery budget — the total budget is €${parseFloat(budget) + proteinSnackBudget}.` : ""}`;
}

// Fetch previously-saved community prices for this region. Returns both the
// reference text block (fed to the LLM) and the deduped count (used to decide
// whether live web search is still needed — see #2).
async function fetchKnownPrices(postalCode, allowedStores) {
  try {
    // Combine the national price pool (postal_code "") with region-specific
    // prices for this PLZ. A sparse region borrows the national baseline so
    // it can cross the no-search threshold sooner — broadening the cheap
    // tier without waiting for dozens of local observations to accumulate.
    const queries = [base44.entities.PriceEstimate.filter({ postal_code: "" }, "-fetched_date", 200)];
    if (postalCode) {
      queries.push(base44.entities.PriceEstimate.filter({ postal_code: postalCode }, "-fetched_date", 200));
    }
    const [nationalRecs, regionalRecs] = await Promise.all(queries);
    // Regional first → it wins dedup (more locally relevant).
    const ordered = postalCode ? [...(regionalRecs || []), ...(nationalRecs || [])] : (nationalRecs || []);
    const seen = new Map();
    ordered.forEach((r) => {
      if (!r.product_name) return;
      if (allowedStores?.length) {
        const s = (r.store || "").toLowerCase();
        if (!allowedStores.some((a) => s.includes(a.toLowerCase().split(" ")[0]))) return;
      }
      const key = r.product_name.toLowerCase();
      if (!seen.has(key)) seen.set(key, r);
    });
    if (!seen.size) return { text: "", count: 0 };
    const text = [...seen.values()].slice(0, 60)
      .map((r) => `- ${r.product_name} — €${Number(r.price || 0).toFixed(2)} @ ${r.store || "?"} (qty: ${r.quantity || "?"}, ${r.fetched_date || "?"})`)
      .join("\n");
    return { text, count: seen.size };
  } catch {
    return { text: "", count: 0 };
  }
}

// Public wrapper — keeps the old string-only return type so existing callers
// (e.g. PlanBuilder) are unaffected.
export async function getKnownPricesText(postalCode, allowedStores) {
  return (await fetchKnownPrices(postalCode, allowedStores)).text;
}

// Save every price found in a generated grocery list to the community database.
// Fire-and-forget: a failure here must never block the user's list.
export function savePriceObservations(groceries, postalCode, diet) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const records = [];
    (groceries?.categories || []).forEach((cat) => {
      (cat.items || []).forEach((item) => {
        if (!item.name || item.price == null) return;
        records.push({
          product_name: item.name,
          postal_code: postalCode || "",
          store: item.store || "",
          price: item.price,
          unit_price: item.unit_price,
          quantity: item.quantity || "",
          normal_price: item.normal_price,
          currency: "eur",
          diet: diet || "",
          source: "ai-web-search",
          fetched_date: today,
        });
      });
    });
    if (records.length) {
      base44.entities.PriceEstimate.bulkCreate(records).catch(() => { /* non-critical */ });
    }
  } catch { /* ignore — community DB is best-effort */ }
}

// #2: once a region has enough community prices on file, skip live web search
// (the prompt already receives them via knownPricesText). Drops a mature
// grocery generation from ~5 credits to ~1.
const WEB_SEARCH_MIN_PRICES = 20;

// Store-own ("house") brands, used to correct items the model assigns to the
// wrong chain (e.g. Lidl's Milbona listed as Aldi).
const HOUSE_BRANDS = [
  [["aldi"], ["gut bio", "milsani", "meine metzgerei", "bellasan", "bon-ri", "golden seafood", "lyttos", "moser roth", "choceur", "tandil", "cucina nobile", "rio d'oro", "sweet valley", "gut drei eichen", "nur nur natur", "knusperone", "golden bridge", "ursi", "le gusto", "asia green garden"]],
  [["lidl"], ["milbona", "freshona", "combino", "alesto", "solevita", "pilos", "chef select", "vitasia", "crownfield", "fin carré", "snack day", "kania", "belbake", "deluxe", "dulano", "vemondo", "italiamo", "eridanous", "culinea", "cien", "w5", "formil", "sondey", "bio organic"]],
  [["rewe"], ["rewe", "ja!"]],
  [["edeka", "netto"], ["gut & günstig", "gut&günstig"]],
  [["edeka"], ["edeka"]],
  [["penny"], ["penny", "naturgut"]],
  [["netto"], ["netto", "biobio"]],
  [["kaufland"], ["k-classic", "k-bio", "k-purland"]],
  [["tegut"], ["tegut"]],
  [["dm"], ["dmbio", "dm bio", "balea", "sportness"]],
  [["rossmann"], ["isana", "enerbio", "rossmann"]],
];
const CHAIN_LABEL = { aldi: "Aldi", lidl: "Lidl", rewe: "REWE", edeka: "Edeka", penny: "Penny", netto: "Netto", kaufland: "Kaufland", tegut: "tegut", dm: "dm", rossmann: "Rossmann" };

function houseBrandChains(name) {
  const n = String(name || "").toLowerCase().trim();
  for (const [chains, brands] of HOUSE_BRANDS) {
    if (brands.some((b) => n === b || n.startsWith(b + " "))) return chains;
  }
  return null;
}

// Reassign house-brand items to their real chain when that chain is selected.
function fixHouseBrandStores(result, p) {
  const selected = String(p.stores || "").toLowerCase();
  (result?.categories || []).forEach((c) => (c.items || []).forEach((i) => {
    const chains = houseBrandChains(i.name);
    if (!chains) return;
    const current = String(i.store || "").toLowerCase();
    if (chains.some((ch) => current.includes(ch))) return;
    const target = chains.find((ch) => selected.includes(ch));
    if (target) i.store = CHAIN_LABEL[target];
  }));
  return result;
}

// Deterministic quality checks on a generated list. Returns human-readable
// problems (empty array = list is good).
function validateGroceries(result, p, includeSpending = true) {
  const items = (result?.categories || []).flatMap((c) => c.items || []);
  const issues = [];
  const minItems = p.days >= 14 ? 12 : 8;
  if (items.length < minItems) {
    issues.push(`Only ${items.length} products — include at least ${minItems} distinct products (vary proteins, grains, vegetables, fruit, dairy).`);
  }
  const withKcal = items.filter((i) => Number(i.total_kcal) > 0);
  const target = Number(p.calories) * p.days;
  if (target && withKcal.length >= items.length / 2) {
    const kcal = withKcal.reduce((s, i) => s + Number(i.total_kcal), 0);
    if (kcal < target * 0.8) {
      issues.push(`The list contains ~${Math.round(kcal)} kcal, only ${Math.round((kcal / target) * 100)}% of the ${target} kcal needed. Swap low-calorie filler for cheap calorie-dense staples (oats, rice, pasta, bread, legumes, oil) while staying within budget.`);
    } else if (kcal > target * 1.3) {
      issues.push(`The list contains ~${Math.round(kcal)} kcal, ${Math.round((kcal / target) * 100)}% of the ${target} kcal needed — far too much food. Reduce quantities so the total is close to ${target} kcal, keeping the variety of products.`);
    }
  }
  // Macro-split check — only when the user set a target split AND the model
  // returned per-item macro grams. Compares the actual kcal-derived split to
  // the requested one and flags deviations beyond ±8 percentage points.
  if (p.macros) {
    const macroItems = items.filter((i) =>
      Number(i.protein_g) > 0 || Number(i.carb_g) > 0 || Number(i.fat_g) > 0);
    if (macroItems.length >= items.length / 2) {
      const pKcal = macroItems.reduce((s, i) => s + Number(i.protein_g) * 4, 0);
      const cKcal = macroItems.reduce((s, i) => s + Number(i.carb_g) * 4, 0);
      const fKcal = macroItems.reduce((s, i) => s + Number(i.fat_g) * 9, 0);
      const total = pKcal + cKcal + fKcal;
      if (total > 0) {
        const actual = {
          protein: Math.round((pKcal / total) * 100),
          carbs: Math.round((cKcal / total) * 100),
          fats: Math.round((fKcal / total) * 100),
        };
        const dev = {
          protein: actual.protein - p.macros.protein,
          carbs: actual.carbs - p.macros.carbs,
          fats: actual.fats - p.macros.fats,
        };
        const worst = Math.max(Math.abs(dev.protein), Math.abs(dev.carbs), Math.abs(dev.fats));
        if (worst > 8) {
          issues.push(
            `Macro split is ${actual.protein}%P/${actual.carbs}%C/${actual.fats}%F but the target is ${p.macros.protein}%P/${p.macros.carbs}%C/${p.macros.fats}%F. ` +
            `Shift the mix toward the target: ${dev.protein < 0 ? "add more protein-rich foods (eggs, skyr, chicken, quark, lentils)" : "reduce protein-heavy items"}; ${dev.carbs < 0 ? "add more grains/rice/pasta/fruit" : "reduce carb-heavy items"}; ${dev.fats < 0 ? "add more oils/nuts/butter/avocado" : "reduce fat-heavy items"}. Keep total calories and budget unchanged.`
          );
        }
      } else {
        issues.push("All items have 0 macro grams — fill protein_g, carb_g and fat_g for every item.");
      }
    } else if (macroItems.length === 0) {
      issues.push("No per-item macro grams were returned — fill protein_g, carb_g and fat_g for every item so the macro split can be checked.");
    }
  }
  const selected = String(p.stores || "").toLowerCase();
  const wrongChain = items.filter((i) => {
    const chains = houseBrandChains(i.name);
    return chains && !chains.some((ch) => selected.includes(ch));
  });
  if (wrongChain.length) {
    issues.push(`These are store-own brands of chains the user didn't select: ${wrongChain.map((i) => i.name).join(", ")}. Replace them with products actually sold at ${p.stores}.`);
  }
  const allowed = allowedStoreNames(p.stores).map((s) => s.toLowerCase().split(" ")[0]);
  const offStore = allowed.length ? items.filter((i) => !allowed.some((a) => String(i.store || "").toLowerCase().includes(a))) : [];
  if (offStore.length) {
    issues.push(`These items are from stores the user didn't select: ${offStore.map((i) => `${i.name} (${i.store})`).join(", ")}. Replace them with products from ${allowedStoreNames(p.stores).join(", ")} only.`);
  }
  const cost = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const cap = Number(p.budget) + (Number(p.proteinSnackBudget) || 0);
  if (p.spendMode === "maximize" && cost > cap) issues.push(`Total €${cost.toFixed(2)} exceeds the €${cap} budget.`);
  if (includeSpending && p.spendMode !== "maximize") issues.push(...spendingIssues(result, p));
  if (p.spendMode !== "maximize" && items.some((item) => ["total_kcal", "protein_g", "carb_g", "fat_g"].some((field) => item[field] == null || !Number.isFinite(Number(item[field]))))) {
    issues.push("Provide total_kcal, protein_g, carb_g and fat_g for every purchased item. Nutrition must not be dropped to reduce spending.");
  }
  // Maximize-value mode: a list far under budget fails the user's goal — they
  // asked to spend the budget on better groceries, not to save. Nudge one retry
  // that adds premium / higher-value items until the total is close to budget.
  if ((p.spendMode === "maximize") && cost < Number(p.budget) * 0.9) {
    issues.push(`Total €${cost.toFixed(2)} is only ${Math.round((cost / Number(p.budget)) * 100)}% of the €${p.budget} budget. The user chose to SPEND THE FULL BUDGET on higher-value groceries — add more premium items (better meat, fish, organic produce, cheese, nuts, fresh fruit, branded quality goods) until the total is close to €${p.budget}, without going over.`);
  }
  const badPrice = items.filter((i) => !(Number(i.unit_price) >= 0.15));
  if (badPrice.length) issues.push(`Unrealistic unit prices for: ${badPrice.map((i) => i.name).join(", ")}.`);
  // Per-item pack sanity: flag any single item bought in an unreasonable number
  // of packs (e.g. 27 cartons of milk). The model should pick a larger pack size
  // or spread the quantity across different products, not stack small packs.
  const maxPacks = Math.min(8, 3 + Number(p.people || 1) * 2);
  const tooMany = items.filter((i) => {
    const u = Number(i.unit_price), pr = Number(i.price);
    return u > 0 && pr > 0 && Math.round(pr / u) > maxPacks;
  });
  if (tooMany.length) {
    issues.push(`These items are bought in unrealistic quantities (more than ${maxPacks} packs each): ${tooMany.map((i) => `${i.name} (×${Math.round(Number(i.price) / Number(i.unit_price))})`).join(", ")}. Replace the many small packs with a larger pack size of the same product, or split the quantity across different products — a healthy diet does not rely on one item for most of its calories.`);
  }
  return issues;
}

function restrictStoreSchema(allowed) {
  const s = JSON.parse(JSON.stringify(GROCERY_SCHEMA));
  s.properties.categories.items.properties.items.items.properties.store = { type: "string", enum: allowed };
  return s;
}

const budgetCap = (p) => Number(p.budget) + (p.proteinSnackBudget || 0);
const listCost = (r) => (r?.categories || []).flatMap((c) => c.items || []).reduce((s, i) => s + (Number(i.price) || 0), 0);

// Drop the items giving the fewest calories per euro until the list fits the budget.
function trimToBudget(result, cap) {
  const all = (result?.categories || []).flatMap((c) => c.items || []);
  const ranked = [...all].sort((a, b) =>
    (Number(a.total_kcal) || 0) / (Number(a.price) || 1) - (Number(b.total_kcal) || 0) / (Number(b.price) || 1));
  const removed = new Set();
  let cost = listCost(result);
  for (const item of ranked) {
    if (cost <= cap) break;
    removed.add(item);
    cost -= Number(item.price) || 0;
  }
  const categories = result.categories
    .map((c) => ({ ...c, items: (c.items || []).filter((i) => !removed.has(i)) }))
    .filter((c) => c.items.length);
  return { ...result, categories, total_estimated_cost: Math.round(cost * 100) / 100 };
}

export async function runGroceryGeneration(p, langLabel, langCode, { force = false } = {}) {
  // #1: shared server-side cache — identical config returns instantly, ~0 credits.
  const sig = grocerySignature(p, langCode);
  const cached = force ? null : await getCachedGroceryServer(sig);
  if (cached) return normalizeGroceryTotal(cached);

  const allowed = allowedStoreNames(p.stores);
  const { text: knownPricesText, count: knownCount } = await fetchKnownPrices(p.postalCode, allowed);
  const useWebSearch = knownCount < WEB_SEARCH_MIN_PRICES;
  const managedSpending = p.spendMode !== "maximize";
  const alternativeInstruction = managedSpending
    ? `\nFor every main grocery item, provide 1–3 real replacement products under "alternatives". ${p.spendMode === "save" ? "Include the cheapest suitable house-brand equivalent, ideally cheaper than the original." : "Include ordinary good-quality alternatives at a range of real prices, including higher-priced equivalents where appropriate, not luxury filler."} Each replacement covers the same ingredient role and purchased amount, with its own accurate prices and nutrition. All replacements must obey the same selected stores, diet, organic setting, allergies and already-owned exclusions. Do not provide alternatives for Protein Snacks.`
    : "";
  const basePrompt = buildGroceryPrompt(p, langLabel, knownPricesText) + alternativeInstruction;
  const schema = allowed.length ? restrictStoreSchema(allowed) : JSON.parse(JSON.stringify(GROCERY_SCHEMA));
  if (managedSpending) {
    const product = schema.properties.categories.items.properties.items.items;
    const replacement = JSON.parse(JSON.stringify(product));
    replacement.required = ["name", "quantity", "store", "price", "unit_price", "normal_price", "total_kcal", "protein_g", "carb_g", "fat_g"];
    product.properties.alternatives = { type: "array", maxItems: 3, items: replacement };
    product.required = replacement.required;
  }
  const qualityIssues = (result) => validateGroceries(result, p, false);
  const prepare = (result) => {
    const corrected = fixHouseBrandStores(result, p);
    if (managedSpending) {
      for (const category of corrected.categories || []) {
        for (const item of category.items || []) {
          fixHouseBrandStores({ categories: [{ items: item.alternatives || [] }] }, p);
        }
      }
    }
    return managedSpending ? applySpendingAlternatives(corrected, p, qualityIssues) : normalizeGroceryTotal(corrected);
  };
  const call = (prompt, model = "openai/gpt-4o-mini") => invokeAI({
    prompt,
    add_context_from_internet: useWebSearch,
    model,
    response_json_schema: schema,
  });

  let result = prepare(await call(basePrompt));
  let issues = validateGroceries(result, p);
  // One targeted retry: feed back only the concrete problems found, instead of
  // stuffing every constraint into the prompt up front.
  if (issues.length) {
    const prevList = JSON.stringify(result);
    const retry = prepare(await call(`${basePrompt}\n\nYOUR PREVIOUS ATTEMPT:\n${prevList}\n\nIT HAD THESE PROBLEMS:\n- ${issues.join("\n- ")}\n\nFix these concrete problems. Preserve enough food and nutrition for the full duration. Use real product replacements to change spending, not invented prices or extra bulk food. Return the complete corrected list with alternatives.`, "openai/gpt-4o-mini"));
    const retryIssues = validateGroceries(retry, p);
    // Staying within budget matters most — prefer whichever attempt is cheaper when one is over.
    const over = (r) => listCost(r) > budgetCap(p);
    const retryBetter = managedSpending ? preferSpendingCandidate(result, retry, p, qualityIssues)
      : over(result) && !over(retry) ? true
      : !over(result) && over(retry) ? false
      : retryIssues.length <= issues.length;
    if (retryBetter) { result = retry; issues = retryIssues; }
  }

  // Maximize mode: the AI model (even gpt-4o) reliably ignores the "spend
  // close to budget" instruction and defaults to cheap lists. Instead of
  // retrying, deterministically pad the list with real premium products from
  // the selected stores until the total is within 3% of the budget.
  if (p.spendMode === "maximize" && listCost(result) < Number(p.budget) * 0.92) {
    const selected = allowedStoreNames(p.stores);
    result = padToBudget(result, Number(p.budget), selected);
    issues = validateGroceries(result, p);
  }

  // Save/Balanced must preserve needed nutrition, not silently delete food to fit.
  // Retain the existing Maximize behavior.
  if (!managedSpending && listCost(result) > budgetCap(p)) {
    result = trimToBudget(result, budgetCap(p));
    issues = validateGroceries(result, p);
  }
  result = normalizeGroceryTotal(result);
  if (managedSpending) {
    // Save minimizes genuine costs; its 80% goal must never remove needed meals.
    issues = [...qualityIssues(result), ...spendingIssues(result, p, false)];
    // Only a list that busts the main budget is unusable. Soft issues (macro
    // split a few points off, balanced slightly under 92%) still show the list
    // — it just isn't cached/shared below.
    if (grocerySpending(result).main > Number(p.budget)) throw new Error(spendingFailureMessage(p.spendMode || "balanced", langCode));
  }

  // Only persist lists that pass validation, so bad output never gets
  // served to other users or pollutes the community price database.
  if (!issues.length) {
    savePriceObservations(result, p.postalCode, p.diet);
    saveCachedGroceryServer(sig, result, p, langCode).catch(() => { /* best-effort */ });
  }
  return result;
}