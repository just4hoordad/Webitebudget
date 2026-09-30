// Store discount calculations based on current shelf prices in the PriceEstimate databank,
// dietary preferences, and macronutrient targets.

// Base discount averages derived from our core essentials databank (savings vs brand-name reference items)
const STORE_BASE_DATA = {
  aldi: {
    name: "Aldi",
    baseDiscount: 39,
    diets: { "high-protein": 36, "vegan": 42, "vegetarian": 39, "balanced": 42, "pescatarian": 38, "gluten-free": 40, "frozen": 36, "halal": 37 },
    macros: { protein: 35, carbs: 44, fats: 38 },
  },
  lidl: {
    name: "Lidl",
    baseDiscount: 40,
    diets: { "high-protein": 37, "vegan": 43, "vegetarian": 40, "balanced": 43, "pescatarian": 39, "gluten-free": 40, "frozen": 37, "halal": 38 },
    macros: { protein: 36, carbs: 45, fats: 39 },
  },
  kaufland: {
    name: "Kaufland",
    baseDiscount: 38,
    diets: { "high-protein": 35, "vegan": 41, "vegetarian": 39, "balanced": 42, "pescatarian": 38, "gluten-free": 39, "frozen": 36, "halal": 36 },
    macros: { protein: 34, carbs: 43, fats: 37 },
  },
  penny: {
    name: "Penny",
    baseDiscount: 38,
    diets: { "high-protein": 34, "vegan": 40, "vegetarian": 38, "balanced": 41, "pescatarian": 37, "gluten-free": 38, "frozen": 35, "halal": 36 },
    macros: { protein: 34, carbs: 43, fats: 37 },
  },
  netto: {
    name: "Netto",
    baseDiscount: 37,
    diets: { "high-protein": 33, "vegan": 40, "vegetarian": 38, "balanced": 41, "pescatarian": 37, "gluten-free": 37, "frozen": 34, "halal": 35 },
    macros: { protein: 33, carbs: 42, fats: 36 },
  },
  rewe: {
    name: "REWE",
    baseDiscount: 33,
    diets: { "high-protein": 30, "vegan": 37, "vegetarian": 35, "balanced": 38, "pescatarian": 34, "gluten-free": 34, "frozen": 31, "halal": 32 },
    macros: { protein: 30, carbs: 39, fats: 32 },
  },
  edeka: {
    name: "Edeka",
    baseDiscount: 31,
    diets: { "high-protein": 29, "vegan": 35, "vegetarian": 33, "balanced": 36, "pescatarian": 32, "gluten-free": 33, "frozen": 30, "halal": 30 },
    macros: { protein: 28, carbs: 37, fats: 30 },
  },
  norma: {
    name: "Norma",
    baseDiscount: 36,
    diets: { "high-protein": 33, "vegan": 38, "vegetarian": 36, "balanced": 39, "pescatarian": 35, "gluten-free": 36, "frozen": 34, "halal": 34 },
    macros: { protein: 32, carbs: 41, fats: 35 },
  },
  globus: {
    name: "Globus",
    baseDiscount: 32,
    diets: { "high-protein": 30, "vegan": 35, "vegetarian": 34, "balanced": 36, "pescatarian": 33, "gluten-free": 33, "frozen": 31, "halal": 31 },
    macros: { protein: 29, carbs: 37, fats: 31 },
  },
  tegut: {
    name: "Tegut",
    baseDiscount: 27,
    diets: { "high-protein": 25, "vegan": 31, "vegetarian": 29, "balanced": 31, "pescatarian": 27, "gluten-free": 28, "frozen": 26, "halal": 26 },
    macros: { protein: 24, carbs: 32, fats: 26 },
  },
  dm: {
    name: "dm",
    baseDiscount: 24,
    diets: { "high-protein": 23, "vegan": 28, "vegetarian": 26, "balanced": 26, "pescatarian": 22, "gluten-free": 27, "frozen": 20, "halal": 24 },
    macros: { protein: 22, carbs: 28, fats: 25 },
  },
  rossmann: {
    name: "Rossmann",
    baseDiscount: 23,
    diets: { "high-protein": 22, "vegan": 27, "vegetarian": 25, "balanced": 25, "pescatarian": 21, "gluten-free": 26, "frozen": 19, "halal": 23 },
    macros: { protein: 21, carbs: 27, fats: 24 },
  },
  müller: {
    name: "Müller",
    baseDiscount: 21,
    diets: { "high-protein": 20, "vegan": 24, "vegetarian": 23, "balanced": 23, "pescatarian": 19, "gluten-free": 23, "frozen": 17, "halal": 21 },
    macros: { protein: 19, carbs: 25, fats: 22 },
  },
};

/**
 * Normalizes store name or id to lookup key (e.g. "Aldi" -> "aldi", "rewe" -> "rewe").
 */
function normalizeKey(str) {
  if (!str) return "";
  return str.trim().toLowerCase().replace(/[^a-zäöü]/g, "");
}

/**
 * Calculates the dynamic discount percentage for a store given the diet and macros.
 *
 * @param {string} storeIdOrName - e.g. "aldi", "Aldi", "lidl", "Lidl", "rewe", "REWE"
 * @param {string} diet - e.g. "high-protein", "vegan", "balanced", etc.
 * @param {{ protein?: number, carbs?: number, fats?: number }} macros - macro percentages
 * @returns {number} discount percentage (e.g. 38 for -38%)
 */
export function getStoreDiscount(storeIdOrName, diet = "balanced", macros = null) {
  const key = normalizeKey(storeIdOrName);
  const profile = STORE_BASE_DATA[key];
  if (!profile) return 0;

  const dietKey = (diet || "balanced").toLowerCase();
  const dietDiscount = profile.diets[dietKey] ?? profile.baseDiscount;

  if (!macros || (!macros.protein && !macros.carbs && !macros.fats)) {
    return dietDiscount;
  }

  // Weight discount by user's macro split
  const p = (Number(macros.protein) || 30) / 100;
  const c = (Number(macros.carbs) || 40) / 100;
  const f = (Number(macros.fats) || 30) / 100;
  const total = p + c + f || 1;

  const macroDiscount =
    ((profile.macros.protein * p) +
     (profile.macros.carbs * c) +
     (profile.macros.fats * f)) / total;

  // 60% diet-specific food discount + 40% macro-weighted discount
  const finalDiscount = Math.round(dietDiscount * 0.6 + macroDiscount * 0.4);
  return Math.max(10, Math.min(60, finalDiscount));
}

/**
 * Returns all store discounts for a given diet and macro profile.
 */
export function getAllStoreDiscounts(diet = "balanced", macros = null) {
  const result = {};
  for (const [key, data] of Object.entries(STORE_BASE_DATA)) {
    result[key] = getStoreDiscount(key, diet, macros);
    result[data.name] = result[key];
  }
  return result;
}