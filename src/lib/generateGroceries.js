import { base44 } from "@/api/base44Client";

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
                calories_info: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

export function groceryParamsFromSearch(search) {
  const params = new URLSearchParams(search);
  const macrosParam = params.get("macros");
  return {
    budget: params.get("budget") || 150,
    stores: params.get("stores") || "aldi,lidl",
    diet: params.get("diet") || "balanced",
    calories: params.get("calories") || 2000,
    days: parseInt(params.get("days") || "30", 10),
    people: params.get("people") || 1,
    saleHunt: params.get("saleHunt") === "true",
    bio: params.get("bio") === "true",
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

export function grocerySignature(p, langCode) {
  return JSON.stringify({
    budget: p.budget, stores: p.stores, diet: p.diet, calories: p.calories,
    days: p.days, people: p.people, saleHunt: p.saleHunt, bio: p.bio,
    junkPercent: p.junkPercent, proteinSnackBudget: p.proteinSnackBudget,
    allergies: p.allergies, ownedItems: p.ownedItems, macros: p.macros, postalCode: p.postalCode, lang: langCode,
  });
}

const PREFIX = "bb_grocery_";
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

export function buildGroceryPrompt(p, langLabel, knownPricesText = "") {
  const { people, diet, days, budget, calories, stores, saleHunt, bio, junkPercent, proteinSnackBudget, allergies, ownedItems, macros } = p;
  return `Generate a grocery list for ${people} person(s) with a ${diet} diet in Germany, covering exactly ${days} days.

Budget: €${budget} for ${days} days.
Calories: ~${calories} kcal/day for all ${people} person(s).
Stores: ${stores}.
Region: postal code ${p.postalCode || "unknown"} — supermarket prices vary by region in Germany; use local prices for this postal code when available.
Language: ${langLabel}.
${knownPricesText ? `COMMUNITY PRICE DATABASE (prices previously found by other users for this region; prefer these where a product matches, and only override with fresher web data):\n${knownPricesText}\n` : ""}
${diet === "half-cooked" || diet === "frozen" ? `DIET MODE: FROZEN FOODS ONLY. ONLY include fully frozen, ready-to-heat meals and frozen convenience products available at German supermarkets — e.g. "iglo Fischstäbchen 400g", "Gut & Günstig Tiefkühl-Pizza Salami 400g", "Apetito Schnitzel gebacken 400g", "Dr. Oetker Steinofen-Pizza Mozzarella 350g", "Aldi Tiefkühl Hähnchen-Nuggets 500g", "McCain Pommes Frites 750g", "Bofrost Spinat-Käse-Tortellini 500g", "iglo Gemüse-Pfanne 750g", "Lidl Fairglobe Bio Edamame 400g". DO NOT include any raw unprocessed ingredients (no raw vegetables, no flour, no raw meat cuts). All items must be sold frozen and require only microwave or oven heating.` : ""}
${macros ? `MACRONUTRIENT TARGETS: The user wants the daily caloric intake to come from approximately ${macros.protein}% protein, ${macros.carbs}% carbohydrates, and ${macros.fats}% fats. Choose products and quantities so the overall grocery list supports this macro split (e.g. more protein-rich foods like eggs, skyr, chicken, lentils for higher protein; more grains, rice, pasta for higher carbs; more oils, nuts, avocado for higher fats).` : ""}
Rules:
1. Use real 2024-2025 German supermarket prices from the listed stores (e.g. Aldi Vollmilch 1L = €0.99, Lidl Eier 10er = €1.99).
2. Pick the cheapest store for each item.
3. The price field = unit price × quantity needed for ${days} days (scale quantities to exactly cover ${days} days, not a full month).
4. CRITICAL BUDGET RULE: The main grocery budget (excluding Protein Snacks category) MUST stay UNDER €${budget} — never go over the budget, not even by 1 cent. Aim to be as close to €${budget} as possible while staying below it (ideally between €${(budget * 0.92).toFixed(0)} and €${budget}). If you are over €${budget}, remove items or reduce quantities until the total is strictly below €${budget}. The total_estimated_cost MUST reflect the real sum of ALL item prices including protein snacks, and it too must be below the total budget (€${parseFloat(budget) + proteinSnackBudget}).
5. All text in ${langLabel}, EXCEPT category names which MUST always be in English (e.g. "Dairy", "Vegetables", "Meat", "Bread & Bakery", "Snacks", etc.).
6. For each item, also provide normal_price: the typical price for the same quantity at a regular/mid-range supermarket (e.g. Rewe, Edeka). This shows how much cheaper the budget store option is.
7. CRITICAL: The item name MUST include the full real product name with the brand name as sold in the store (e.g. "Ja! Vollmilch 3,5% 1L", "Milbona Naturjoghurt 500g", "Gut & Günstig Haferflocken 500g", "Tandil Waschmittel Pulver 1,5kg"). Never use generic names like "Milk" or "Oats" — always use the actual branded product name.
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
async function fetchKnownPrices(postalCode) {
  try {
    const records = await base44.entities.PriceEstimate.filter(
      { postal_code: postalCode || "" },
      "-fetched_date",
      200
    );
    const seen = new Map();
    (records || []).forEach((r) => {
      if (!r.product_name) return;
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
export async function getKnownPricesText(postalCode) {
  return (await fetchKnownPrices(postalCode)).text;
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

export async function runGroceryGeneration(p, langLabel, langCode) {
  // #1: shared server-side cache — identical config returns instantly, ~0 credits.
  const sig = grocerySignature(p, langCode);
  const cached = await getCachedGroceryServer(sig);
  if (cached) return cached;

  const { text: knownPricesText, count: knownCount } = await fetchKnownPrices(p.postalCode);
  const useWebSearch = knownCount < WEB_SEARCH_MIN_PRICES;
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: buildGroceryPrompt(p, langLabel, knownPricesText),
    add_context_from_internet: useWebSearch,
    model: "gemini_3_flash",
    response_json_schema: GROCERY_SCHEMA,
  });
  savePriceObservations(result, p.postalCode, p.diet);
  // #1: populate the shared cache for the next user with this config.
  saveCachedGroceryServer(sig, result, p, langCode).catch(() => { /* best-effort */ });
  return result;
}