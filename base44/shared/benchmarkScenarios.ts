// Admin benchmark scenario definitions: each scenario mirrors a real
// production AI task (grocery list, meal plan, recipe, grocery swap, product
// search) with its production prompt + schema and a deterministic, objective
// quality scorer. Used by the abTestModels backend function to compare
// candidate models across every AI-powered feature, not just grocery lists.

// ── Shared helpers ──────────────────────────────────────────────────────────

export function allowedStoreNames(stores: any): string[] {
  const names = String(stores || "").replace(/\([^)]*\)/g, "").split(",")
    .map((s) => s.trim()).filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  return [...new Set(names)];
}

function isAllowedStore(item: any, stores: any): boolean {
  const allowed = allowedStoreNames(stores).map((s) => s.toLowerCase().split(" ")[0]);
  if (!allowed.length) return true;
  const sl = String(item?.store || "").toLowerCase().trim();
  const sf = sl.split(/[\s-]+/)[0];
  return allowed.some((a) => sl === a || sf === a);
}

// ── Sample fixtures (representative of real production inputs) ──────────────

const SAMPLE_GROCERY_ITEMS = [
  "Ja! Vollmilch 3,5% 1L (2 × 1L)", "Gut & Günstig Haferflocken 500g (1 × 500g)",
  "Milbona Naturjoghurt 500g (2 × 500g)", "GutBio Eier 10er (1 × 10er)",
  "Gut & Günstig penne Rigate 500g (1 × 500g)", "Péries passierte Tomaten 500g (1 × 500g)",
  "Reuter Rinderhackfleisch 500g (1 × 500g)", "Mark Landschaft Butter mild 250g (1 × 250g)",
  "Karotten lose (500g)", "Aldi Äpfel Braeburn (1kg)", "Gut & Günstig Basmati Reis 1kg (1 × 1kg)",
  "Gut & Günstig TK-Erbsen 900g (1 × 900g)",
].join(", ");

const SAMPLE_MEAL = {
  name: "Pasta with tomato sauce and minced beef",
  mealType: "dinner",
  ingredients: [
    { name: "Gut & Günstig penne Rigate 500g", quantity: "150g" },
    { name: "Péries passierte Tomaten 500g", quantity: "200g" },
    { name: "Reuter Rinderhackfleisch 500g", quantity: "120g" },
  ],
};

const SAMPLE_SWAP_ITEM = {
  name: "Milbona Naturjoghurt 500g", quantity: "2 × 500g", price: 2.98,
  store: "Lidl", total_kcal: 660,
};

// ── Schemas (mirror production) ──────────────────────────────────────────────

export const GROCERY_SCHEMA = {
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
                name: { type: "string" }, quantity: { type: "string" },
                unit_price: { type: "number" }, price: { type: "number" },
                normal_price: { type: "number" }, store: { type: "string" },
                calories_info: { type: "string" }, total_kcal: { type: "number" },
                protein_g: { type: "number" }, carb_g: { type: "number" }, fat_g: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
};

const DAY_SCHEMA = {
  type: "object",
  properties: {
    day: { type: "string" },
    breakfast: { type: "string" }, breakfast_calories: { type: "number" },
    breakfast_ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
    lunch: { type: "string" }, lunch_calories: { type: "number" },
    lunch_ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
    dinner: { type: "string" }, dinner_calories: { type: "number" },
    dinner_ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
  },
};

const MEAL_PLAN_SCHEMA = {
  type: "object",
  properties: { days: { type: "array", minItems: 7, items: DAY_SCHEMA } },
};

const RECIPE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    prep_time: { type: "number" },
    cook_time: { type: "number" },
    servings: { type: "number" },
    ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
    steps: { type: "array", items: { type: "string" } },
  },
};

const GROCERY_SWAP_SCHEMA = {
  type: "object",
  properties: {
    alternatives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" }, quantity: { type: "string" },
          price: { type: "number" }, unit_price: { type: "number" },
          normal_price: { type: "number" }, store: { type: "string" },
          reason: { type: "string" }, calories_info: { type: "string" },
          total_kcal: { type: "number" }, protein_g: { type: "number" },
          carb_g: { type: "number" }, fat_g: { type: "number" },
        },
      },
    },
  },
};

const ADD_ITEM_SCHEMA = {
  type: "object",
  properties: {
    alternatives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" }, quantity: { type: "string" },
          unit_price: { type: "number" }, price: { type: "number" },
          normal_price: { type: "number" }, store: { type: "string" },
          calories_info: { type: "string" }, total_kcal: { type: "number" },
          protein_g: { type: "number" }, carb_g: { type: "number" },
          fat_g: { type: "number" }, category: { type: "string" },
        },
      },
    },
  },
};

// ── Prompt builders (faithful to production) ──────────────────────────────────

function groceryPrompt(config: any): string {
  const { budget = 80, stores = "Aldi, Lidl", diet = "balanced", calories = 2000, days = 7, people = 1 } = config;
  const allowed = allowedStoreNames(stores);
  return `Generate a grocery list for ${people} person(s) with a ${diet} diet in Germany, covering exactly ${days} days.

Budget for main groceries: €${budget} for ${days} days.
Calories: ~${calories} kcal/day for all ${people} person(s).
Stores: ${stores || "any German supermarket"}.${allowed.length ? `\nSTRICT STORE RULE: every item's "store" MUST be exactly one of: ${allowed.join(", ")}. Never use any other store, even if it is cheaper, and only pick products actually sold at these stores. Store names in the examples below are illustrations only.` : ""}
Region: postal code unknown — supermarket prices vary by region in Germany; use local prices for this postal code when available.
Language: English.

Rules:
1. Use real 2024-2025 German supermarket prices from the listed stores (e.g. Aldi Vollmilch 1L = €0.99, Lidl Eier 10er = €1.99).
2. Choose reasonably priced everyday-quality products, mixing house brands with fresh ingredients rather than buying only the cheapest staples. Include a varied selection (roughly 10–18 distinct products across proteins, grains, vegetables, fruit and dairy) so meals don't repeat — use fewer packs of each item rather than fewer items.
3. Write quantity as "N × pack size" (e.g. "2 × 500g"); unit_price is the price of ONE pack and price = unit_price × N for the quantity needed for ${days} days (scale quantities to exactly cover ${days} days, not a full month). Never buy more than 6 packs of the same product — if more of an ingredient is needed, choose a larger pack size rather than stacking many small packs. Keep every item to a realistic amount a person actually consumes: no single item should provide more than ~25% of one day's calories, and milk in particular is a drink, not a calorie source — a person has at most one glass (~250ml) a day, so never plan more than ~${Math.max(2, Math.ceil(people * 0.25 * days))}L of milk total for the whole period; if you need more dairy calories, use yogurt, quark, skyr, or cheese, not more milk.
4. BALANCED MODE: The SUM of main item prices must be €${(budget * 0.92).toFixed(2)}–€${budget} while keeping total calories strictly near ${calories * days} kcal. Choose everyday staples plus fresh foods. If item prices sum below €${(budget * 0.92).toFixed(2)}, swap cheap staples for higher-tier fresh items — NEVER stack extra packs of calorie-dense staples that push total_kcal above ${Math.round(calories * days * 1.04)} kcal.
 5. All text in English, EXCEPT category names which MUST always be in English (e.g. "Dairy", "Vegetables", "Meat", "Bread & Bakery", "Snacks", etc.).
6. For each item, also provide normal_price: the realistic price for the SAME product (or its closest mid-range equivalent) at a mid-range German supermarket (REWE or Edeka) for the SAME quantity. normal_price should usually be HIGHER than price (typically by 10–20% for discounters), and should never be lower than price.
7. CRITICAL: The item name MUST include the full real product name with the brand name and pack size as sold in the store (e.g. "Ja! Vollmilch 3,5% 1L"). Never use generic names like "Milk". Set calories_info to the exact energy density per 100g/100ml (e.g. "370 kcal/100g"). Set total_kcal to the EXACT total kilocalories of ALL purchased packs combined. Set protein_g, carb_g and fat_g to the total grams across ALL purchased packs combined.
CALORIE TARGET LOCK (MANDATORY): The sum of every item's total_kcal MUST be between ${Math.round(calories * days * 0.97)} and ${Math.round(calories * days * 1.03)} kcal. No single item may exceed 18% of the total period's calories.
TOTAL COST VERIFICATION (MANDATORY): total_estimated_cost MUST EXACTLY equal the sum of every item's price field.
8. Keep the grocery list clean and healthy — no junk food or treats.`;
}

function mealPlanPrompt(config: any): string {
  const { calories = 2000, people = 1, diet = "balanced" } = config;
  return `Create a complete 7-day meal plan for week 1 of 1.

Return ALL text (meal names, day names, ingredient names) in English language.

AVAILABLE PRODUCTS (TOTAL for 7 days):
${SAMPLE_GROCERY_ITEMS}

Diet type: ${diet}
Target calories per day: ${calories} kcal (MANDATORY — breakfast_calories + lunch_calories + dinner_calories must add up to ~${calories} kcal every day; do NOT default to 2000)
Number of people: ${people}

CRITICAL RULES:
1. Use ONLY the products listed above — no substitutions or additions. Every ingredient name in breakfast_ingredients, lunch_ingredients, dinner_ingredients MUST be copied EXACTLY from the AVAILABLE PRODUCTS list. Do NOT invent, assume, or add any ingredient (e.g. "egg", "toast", "oil") that is not in the list.
2. Vary meals across the days — do NOT repeat the same meal every day.
3. Calorie distribution: breakfast ~${Math.round(calories * 0.25)} kcal, lunch ~${Math.round(calories * 0.35)} kcal, dinner ~${Math.round(calories * 0.40)} kcal.

REALISM & HEALTH — every meal must be a real, cookable dish a person would actually eat:
- Never pass a single raw ingredient or a drink off as a meal. Combine products into a recognizable dish (e.g. "Pasta with tomato and cheese", "Rice with chicken and vegetables").
- Portion sizes must be realistic for ONE sitting, never bulk quantities.
- The plan must be doable for a normal person to shop for and cook with the listed products.

Return a "days" array with EXACTLY 7 day objects. Each day object: { day, breakfast, breakfast_calories, breakfast_ingredients[{name,quantity}], lunch, lunch_calories, lunch_ingredients, dinner, dinner_calories, dinner_ingredients }.
RETURN EXACTLY 7 days with no gaps or missing days.`;
}

function recipePrompt(): string {
  const ingList = SAMPLE_MEAL.ingredients.map((i) => `${i.name} (${i.quantity})`).join(", ");
  return `Write a cooking recipe for "${SAMPLE_MEAL.name}" in English.
Available ingredients: ${ingList}. Diet: balanced. Serves: 1.
Return: title, prep_time (min), cook_time (min), servings, ingredients[{name, quantity}], steps[] (concise, ordered). Use the planned ingredients; add salt/oil/pepper only if essential. No calorie count.`;
}

function grocerySwapPrompt(config: any): string {
  const { stores = "Aldi, Lidl", diet = "balanced" } = config;
  const it = SAMPLE_SWAP_ITEM;
  return `Suggest 3 alternatives for "${it.name}" (${it.quantity}, ~${it.total_kcal} kcal, €${it.price.toFixed(2)}, ${it.store}) at German supermarkets.
Category: Dairy. Diet: ${diet}. Price ≤ €${it.price.toFixed(2)}. ${stores ? `Only products from: ${stores}.` : "Any German supermarket."} Use real branded names with pack sizes (e.g. "Milbona Naturjoghurt 500g") and 2024-2025 prices. Match a similar total energy (~${it.total_kcal} kcal). Set calories_info as kcal/100g or kcal/100ml, plus accurate total_kcal, protein_g, carb_g, fat_g for the full quantity.`;
}

function addItemPrompt(config: any): string {
  const { stores = "Aldi, Lidl", diet = "balanced" } = config;
  return `Find 3-4 real branded products for "high protein yogurt" at these German stores: ${stores}. Diet: ${diet}. Use exact in-store product names with pack size (e.g. "Ja! Vollmilch 3,5% 1L") and 2024-2025 prices. Set calories_info to kcal/100g or kcal/100ml, total_kcal to total calories of the full quantity, and protein_g/carb_g/fat_g for that quantity. Category names in English.`;
}

// ── Scorers (deterministic, objective constraint checks) ──────────────────────

function normalizeGroceryTotal(result: any): any {
  if (!result || !Array.isArray(result.categories)) return result;
  const sum = result.categories.reduce(
    (acc: number, cat: any) =>
      acc + (Array.isArray(cat?.items) ? cat.items : []).reduce((s: number, i: any) => s + (Number(i?.price) || 0), 0),
    0
  );
  return { ...result, total_estimated_cost: Math.round(sum * 100) / 100 };
}

function scoreGrocery(result: any, config: any): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  const categories = Array.isArray(result?.categories) ? result.categories : [];
  const items = categories.flatMap((c: any) => (Array.isArray(c?.items) ? c.items : []));
  if (!items.length) return { score: 0, issues: ["Empty list"] };

  const minItems = Number(config.days) >= 14 ? 12 : 8;
  if (items.length < minItems) { issues.push(`Only ${items.length} items (need ${minItems}+)`); score -= 15; }

  const sum = items.reduce((s: number, i: any) => s + (Number(i.price) || 0), 0);
  const reported = Number(result?.total_estimated_cost) || 0;
  if (Math.abs(reported - sum) > Math.max(sum * 0.05, 1)) {
    issues.push(`Total €${reported.toFixed(2)} ≠ sum €${sum.toFixed(2)}`); score -= 15;
  }

  const allowed = allowedStoreNames(config.stores).map((s) => s.toLowerCase().split(" ")[0]);
  if (allowed.length) {
    const off = items.filter((i: any) => !isAllowedStore(i, config.stores));
    if (off.length) { issues.push(`${off.length} items from unselected stores`); score -= 15; }
  }

  const target = Number(config.calories) * Number(config.days);
  const kcal = items.reduce((s: number, i: any) => s + (Number(i.total_kcal) || 0), 0);
  if (target && kcal < target * 0.85) { issues.push(`Low calories (${Math.round((kcal / target) * 100)}% of target)`); score -= 15; }
  else if (target && kcal > target * 1.15) { issues.push(`Excess calories (${Math.round((kcal / target) * 100)}%)`); score -= 8; }

  const missingNut = items.filter((i: any) =>
    !Number.isFinite(Number(i.protein_g)) || !Number.isFinite(Number(i.carb_g)) || !Number.isFinite(Number(i.fat_g)));
  if (missingNut.length) { issues.push(`${missingNut.length} items missing macros`); score -= 8; }

  const generics = ["milk", "oats", "rice", "bread", "eggs", "oil", "pasta", "chicken", "cheese", "yogurt", "bananas", "apples"];
  const generic = items.filter((i: any) => generics.includes(String(i.name || "").toLowerCase().trim()));
  if (generic.length) { issues.push(`${generic.length} generic (non-branded) names`); score -= 8; }

  const noNormal = items.filter((i: any) => !Number.isFinite(Number(i.normal_price)));
  if (noNormal.length) { issues.push(`${noNormal.length} missing normal_price`); score -= 5; }

  const badPrice = items.filter((i: any) => !(Number(i.unit_price) >= 0.15));
  if (badPrice.length) { issues.push(`${badPrice.length} unrealistic unit prices`); score -= 8; }

  return { score: Math.max(0, Math.round(score)), issues };
}

function scoreMealPlan(result: any, config: any): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  const days = Array.isArray(result?.days) ? result.days : [];
  if (!days.length) return { score: 0, issues: ["Empty plan"] };

  const target = Number(config.calories) || 2000;
  if (days.length < 7) { issues.push(`Only ${days.length} days (need 7)`); score -= 20; }

  const mealTypes = ["breakfast", "lunch", "dinner"];
  let incompleteMeals = 0;
  let badCalDays = 0;
  for (const d of days) {
    for (const mt of mealTypes) {
      if (!d[mt] || !d[`${mt}_calories`]) incompleteMeals++;
    }
    const daySum = mealTypes.reduce((s, mt) => s + (Number(d[`${mt}_calories`]) || 0), 0);
    if (target && Math.abs(daySum - target) > target * 0.2) badCalDays++;
  }
  if (incompleteMeals) { issues.push(`${incompleteMeals} meals missing name/calories`); score -= 15; }
  if (badCalDays) { issues.push(`${badCalDays} days off calorie target (±20%)`); score -= 15; }

  // Ingredient discipline: ingredients must come from available products
  const available = SAMPLE_GROCERY_ITEMS.split(", ").map((s) => s.replace(/\s*\([^)]*\)\s*$/, "").toLowerCase());
  let badIngs = 0;
  for (const d of days) {
    for (const mt of mealTypes) {
      for (const ing of (Array.isArray(d[`${mt}_ingredients`]) ? d[`${mt}_ingredients`] : [])) {
        const n = String(ing?.name || "").toLowerCase().trim();
        if (!n) continue;
        if (!available.some((a) => n.includes(a) || a.includes(n))) badIngs++;
      }
    }
  }
  if (badIngs) { issues.push(`${badIngs} ingredients not in grocery list`); score -= 15; }

  // Variety: no identical dinner across all 7 days
  const dinners = days.map((d) => d.dinner).filter(Boolean);
  const uniqueDinners = new Set(dinners.map((d) => String(d).toLowerCase()));
  if (dinners.length > 2 && uniqueDinners.size <= 2) { issues.push(`Low dinner variety (${uniqueDinners.size} unique)`); score -= 10; }

  return { score: Math.max(0, Math.round(score)), issues };
}

function scoreRecipe(result: any): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  const r = result || {};
  if (!r.title) { issues.push("Missing title"); score -= 20; }
  const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
  if (!ings.length) { issues.push("No ingredients"); score -= 25; }
  else {
    const noQty = ings.filter((i) => !i?.quantity).length;
    if (noQty) { issues.push(`${noQty} ingredients missing quantity`); score -= 8; }
  }
  const steps = Array.isArray(r.steps) ? r.steps : [];
  if (steps.length < 3) { issues.push(`Only ${steps.length} steps (need 3+)`); score -= 20; }
  if (!Number.isFinite(Number(r.prep_time))) { issues.push("Missing prep_time"); score -= 10; }
  if (!Number.isFinite(Number(r.cook_time))) { issues.push("Missing cook_time"); score -= 10; }
  if (!Number.isFinite(Number(r.servings))) { issues.push("Missing servings"); score -= 5; }
  return { score: Math.max(0, Math.round(score)), issues };
}

function scoreAlternatives(result: any, config: any, opts: { minCount: number; maxCount: number; label: string; checkStore: boolean; checkPrice?: number; checkKcal?: number }): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  const alts = Array.isArray(result?.alternatives) ? result.alternatives : [];
  if (!alts.length) return { score: 0, issues: ["No alternatives returned"] };
  if (alts.length < opts.minCount) { issues.push(`Only ${alts.length} ${opts.label} (need ${opts.minCount})`); score -= 15; }

  if (opts.checkStore) {
    const off = alts.filter((a) => !isAllowedStore(a, config.stores));
    if (off.length) { issues.push(`${off.length} from unselected stores`); score -= 15; }
  }
  if (opts.checkPrice != null) {
    const over = alts.filter((a) => Number(a.price) > opts.checkPrice);
    if (over.length) { issues.push(`${over.length} over price limit`); score -= 10; }
  }
  if (opts.checkKcal != null) {
    const off = alts.filter((a) => {
      const k = Number(a.total_kcal) || 0;
      return k > 0 && Math.abs(k - opts.checkKcal!) > opts.checkKcal! * 0.5;
    });
    if (off.length) { issues.push(`${off.length} far from target calories`); score -= 8; }
  }

  const missingNut = alts.filter((a) =>
    !Number.isFinite(Number(a.protein_g)) || !Number.isFinite(Number(a.carb_g)) || !Number.isFinite(Number(a.fat_g)) || !Number.isFinite(Number(a.total_kcal)));
  if (missingNut.length) { issues.push(`${missingNut.length} missing nutrition`); score -= 10; }

  const noCalInfo = alts.filter((a) => !a.calories_info);
  if (noCalInfo.length) { issues.push(`${noCalInfo.length} missing calories_info`); score -= 5; }

  const generics = ["milk", "yogurt", "cheese", "rice", "bread", "oil", "pasta", "chicken"];
  const generic = alts.filter((a) => generics.includes(String(a.name || "").toLowerCase().trim()));
  if (generic.length) { issues.push(`${generic.length} generic (non-branded) names`); score -= 8; }

  const badPrice = alts.filter((a) => !(Number(a.unit_price) >= 0.15 || Number(a.price) >= 0.15));
  if (badPrice.length) { issues.push(`${badPrice.length} unrealistic prices`); score -= 8; }

  return { score: Math.max(0, Math.round(score)), issues };
}

function scoreGrocerySwap(result: any, config: any): { score: number; issues: string[] } {
  return scoreAlternatives(result, config, {
    minCount: 3, maxCount: 3, label: "alternatives", checkStore: true,
    checkPrice: SAMPLE_SWAP_ITEM.price, checkKcal: SAMPLE_SWAP_ITEM.total_kcal,
  });
}

function scoreAddItem(result: any, config: any): { score: number; issues: string[] } {
  return scoreAlternatives(result, config, {
    minCount: 3, maxCount: 4, label: "products", checkStore: true,
  });
}

// ── Scenario registry ─────────────────────────────────────────────────────────

export interface Scenario {
  id: string;
  label: string;
  description: string;
  schema: Record<string, unknown>;
  buildPrompt: (config: any) => string;
  useWebSearch?: boolean;
  score: (result: any, config: any) => { score: number; issues: string[] };
  normalize?: (result: any) => any;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "grocery",
    label: "Grocery list",
    description: "Full grocery list generation",
    schema: GROCERY_SCHEMA,
    buildPrompt: groceryPrompt,
    score: scoreGrocery,
    normalize: normalizeGroceryTotal,
  },
  {
    id: "meal_plan",
    label: "Meal plan",
    description: "7-day plan from a grocery list",
    schema: MEAL_PLAN_SCHEMA,
    buildPrompt: mealPlanPrompt,
    score: scoreMealPlan,
  },
  {
    id: "recipe",
    label: "Recipe",
    description: "Cooking recipe for a meal",
    schema: RECIPE_SCHEMA,
    buildPrompt: recipePrompt,
    score: (r) => scoreRecipe(r),
  },
  {
    id: "grocery_swap",
    label: "Grocery swap",
    description: "Alternative products for an item",
    schema: GROCERY_SWAP_SCHEMA,
    buildPrompt: grocerySwapPrompt,
    score: scoreGrocerySwap,
  },
  {
    id: "add_item",
    label: "Add item",
    description: "Product search (no web, for parity)",
    schema: ADD_ITEM_SCHEMA,
    buildPrompt: addItemPrompt,
    score: scoreAddItem,
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}