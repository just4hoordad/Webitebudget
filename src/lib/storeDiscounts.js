// Store discount estimates vs mid-range supermarkets (REWE/Edeka).
//
// These figures reflect realistic German grocery price gaps observed in
// independent price baskets (Handelsblatt / GfK / Stiftung Warentest style
// comparisons): hard-discounters (Aldi, Lidl) land ~12-18% cheaper on a mixed
// basket, smaller discounters (Penny, Netto, Norma) ~8-14%, full-range
// discounters (Kaufland) ~6-10%, drugstores only cheaper on a narrow range of
// toiletries/breakfast staples (~4-8%). Diet and macro splits nudge the number
// up or down a few points but never outside the 0-20 band — anything higher is
// fabricated and sets an expectation the generated list can never meet.

const STORE_BASE_DATA = {
  aldi: {
    name: "Aldi",
    baseDiscount: 14,
    diets: { "high-protein": 11, "vegan": 16, "vegetarian": 15, "balanced": 14, "pescatarian": 12, "gluten-free": 13, "frozen": 11, "halal": 12 },
    macros: { protein: 11, carbs: 16, fats: 14 },
  },
  lidl: {
    name: "Lidl",
    baseDiscount: 13,
    diets: { "high-protein": 10, "vegan": 15, "vegetarian": 14, "balanced": 13, "pescatarian": 11, "gluten-free": 12, "frozen": 10, "halal": 11 },
    macros: { protein: 10, carbs: 15, fats: 13 },
  },
  kaufland: {
    name: "Kaufland",
    baseDiscount: 8,
    diets: { "high-protein": 6, "vegan": 9, "vegetarian": 8, "balanced": 8, "pescatarian": 7, "gluten-free": 7, "frozen": 6, "halal": 7 },
    macros: { protein: 6, carbs: 9, fats: 8 },
  },
  penny: {
    name: "Penny",
    baseDiscount: 10,
    diets: { "high-protein": 8, "vegan": 11, "vegetarian": 10, "balanced": 10, "pescatarian": 9, "gluten-free": 9, "frozen": 8, "halal": 9 },
    macros: { protein: 8, carbs: 11, fats: 10 },
  },
  netto: {
    name: "Netto",
    baseDiscount: 9,
    diets: { "high-protein": 7, "vegan": 10, "vegetarian": 9, "balanced": 9, "pescatarian": 8, "gluten-free": 8, "frozen": 7, "halal": 8 },
    macros: { protein: 7, carbs: 10, fats: 9 },
  },
  rewe: {
    name: "REWE",
    baseDiscount: 0,
    diets: { "high-protein": 0, "vegan": 0, "vegetarian": 0, "balanced": 0, "pescatarian": 0, "gluten-free": 0, "frozen": 0, "halal": 0 },
    macros: { protein: 0, carbs: 0, fats: 0 },
  },
  edeka: {
    name: "Edeka",
    baseDiscount: 0,
    diets: { "high-protein": 0, "vegan": 0, "vegetarian": 0, "balanced": 0, "pescatarian": 0, "gluten-free": 0, "frozen": 0, "halal": 0 },
    macros: { protein: 0, carbs: 0, fats: 0 },
  },
  norma: {
    name: "Norma",
    baseDiscount: 9,
    diets: { "high-protein": 7, "vegan": 10, "vegetarian": 9, "balanced": 9, "pescatarian": 8, "gluten-free": 8, "frozen": 7, "halal": 8 },
    macros: { protein: 7, carbs: 10, fats: 9 },
  },
  globus: {
    name: "Globus",
    baseDiscount: 6,
    diets: { "high-protein": 5, "vegan": 7, "vegetarian": 6, "balanced": 6, "pescatarian": 5, "gluten-free": 6, "frozen": 5, "halal": 5 },
    macros: { protein: 5, carbs: 7, fats: 6 },
  },
  tegut: {
    name: "Tegut",
    baseDiscount: 4,
    diets: { "high-protein": 3, "vegan": 5, "vegetarian": 4, "balanced": 4, "pescatarian": 4, "gluten-free": 4, "frozen": 3, "halal": 3 },
    macros: { protein: 3, carbs: 5, fats: 4 },
  },
  dm: {
    name: "dm",
    baseDiscount: 5,
    diets: { "high-protein": 3, "vegan": 7, "vegetarian": 6, "balanced": 5, "pescatarian": 3, "gluten-free": 6, "frozen": 2, "halal": 4 },
    macros: { protein: 3, carbs: 7, fats: 5 },
  },
  rossmann: {
    name: "Rossmann",
    baseDiscount: 4,
    diets: { "high-protein": 2, "vegan": 6, "vegetarian": 5, "balanced": 4, "pescatarian": 2, "gluten-free": 5, "frozen": 2, "halal": 3 },
    macros: { protein: 2, carbs: 6, fats: 4 },
  },
  müller: {
    name: "Müller",
    baseDiscount: 3,
    diets: { "high-protein": 2, "vegan": 4, "vegetarian": 3, "balanced": 3, "pescatarian": 2, "gluten-free": 3, "frozen": 1, "halal": 2 },
    macros: { protein: 2, carbs: 4, fats: 3 },
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
 * @returns {number} discount percentage (e.g. 14 for -14%)
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
  return Math.max(0, Math.min(20, finalDiscount));
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