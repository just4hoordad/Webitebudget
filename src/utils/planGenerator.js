/**
 * Client-side grocery plan generator.
 * Takes the PriceCatalog data and user constraints, returns a structured grocery list.
 * Zero AI credits — runs entirely in the browser.
 */

const CALORIE_DENSITY_MAP = {
  "Vollmilch 1L":          61,
  "Halbfettmilch 1L":      46,
  "Butter 250g":          717,
  "Naturjoghurt 500g":     61,
  "Skyr Natur 500g":       65,
  "Gouda 400g":           356,
  "Mozzarella 125g":      280,
  "Frischkäse 200g":      160,
  "Eier 10er":            155,
  "Hähnchenbrust 500g":   165,
  "Schweineschnitzel 500g": 143,
  "Hackfleisch 500g":     215,
  "Thunfisch Dose":        99,
  "Lachs Filet 300g":     208,
  "Toastbrot 750g":       265,
  "Vollkornbrot 500g":    224,
  "Brötchen 6er":         270,
  "Nudeln Spaghetti 500g": 352,
  "Reis Langkorn 1kg":    350,
  "Haferflocken 500g":    372,
  "Mehl Type 405 1kg":    341,
  "Tomaten 500g":          18,
  "Karotten 1kg":          41,
  "Kartoffeln 2kg":        77,
  "Zwiebeln 1kg":          40,
  "Paprika rot 3er":       31,
  "Brokkoli 500g":         34,
  "Eisbergsalat":          13,
  "Spinat TK 750g":        23,
  "Bananen 1kg":           89,
  "Äpfel 1kg":             52,
  "Orangen Netz 1kg":      47,
  "Olivenöl 750ml":       884,
  "Sonnenblumenöl 1L":    884,
  "Tomaten Passata 500g":  32,
  "Orangensaft 1L":        45,
  "Apfelsaft 1L":          46,
  "Erdbeermarmelade 450g": 250,
  "Erdnussbutter 350g":   588,
  "Müsli 500g":           375,
  "Vollmilchschokolade 100g": 535,
};

// Categories that don't count toward calorie target (oils, sauces, drinks, cleaning)
const NON_CALORIC_CATEGORIES = ["Household", "Health & Beauty", "Pantry", "Spreads", "Drinks"];

// Max total units for entire period — prevents any single item dominating
const MAX_TOTAL_UNITS = {
  "Dairy": 5,
  "Meat & Fish": 4,
  "Grains & Pasta": 4,
  "Bread & Bakery": 4,
  "Vegetables": 5,
  "Fruits": 5,
  "Drinks": 4,
  "Snacks": 3,
  "Pantry": 1,
  "Spreads": 1,
  "Household": 1,
};

// High-calorie-density staples capped at 2 units to prevent them from swallowing the calorie budget
const HIGH_CAL_STAPLE_KEYS = ["Butter", "Olivenöl", "Sonnenblumenöl", "Haferflocken", "Müsli", "Schokolade", "Erdnussbutter"];

function parseCaloriesPer100(info) {
  if (!info) return null;
  const match = info.match(/(\d+)\s*kcal\s*\/\s*100/i);
  return match ? parseInt(match[1], 10) : null;
}

function parseQuantityGrams(qtyStr) {
  if (!qtyStr) return null;
  const lower = (qtyStr + "").toLowerCase().trim();
  const lMatch = lower.match(/([\d.,]+)\s*l$/);
  if (lMatch) return parseFloat(lMatch[1].replace(",", ".")) * 1000;
  const gMatch = lower.match(/([\d.,]+)\s*kg$/);
  if (gMatch) return parseFloat(gMatch[1].replace(",", ".")) * 1000;
  const gMatch2 = lower.match(/([\d.,]+)\s*g$/);
  if (gMatch2) return parseFloat(gMatch2[1].replace(",", "."));
  const erMatch = lower.match(/(\d+)\s*er$/);
  if (erMatch) return parseInt(erMatch[1], 10) * 10;
  return null;
}

function estimateCaloriesPerUnit(item) {
  if (NON_CALORIC_CATEGORIES.includes(item.category)) return 0;
  const per100 = parseCaloriesPer100(item.calories_info);
  const grams = parseQuantityGrams(item.quantity_description);
  if (per100 !== null && grams !== null) return (per100 / 100) * grams;
  const key = item.comparison_key || "";
  for (const [mapKey, density] of Object.entries(CALORIE_DENSITY_MAP)) {
    if (key.toLowerCase().includes(mapKey.split(" ")[0].toLowerCase())) {
      return (density / 100) * (grams || 500);
    }
  }
  return 0;
}

/**
 * MAIN FUNCTION: Generate a grocery list from the PriceCatalog cache.
 */
export function generateGroceryListFromCatalog(catalog, constraints) {
  const {
    budget = 150,
    days = 30,
    calories = 2000,
    people = 1,
    diet = "balanced",
    stores = [],
    allergies = [],
    ownedItems = [],
    bio = false,
  } = constraints;

  const budgetNum = parseFloat(budget);
  const daysNum = parseInt(days, 10);
  const peopleNum = parseInt(people, 10);
  const calPerDayGoal = parseFloat(calories);
  const calTarget = calPerDayGoal * daysNum * peopleNum;

  // 1. Filter to selected stores
  const storeList = (typeof stores === "string" ? stores.split(",") : stores)
    .map(s => s.trim().toLowerCase()).filter(Boolean);
  let pool = storeList.length > 0
    ? catalog.filter(item => storeList.some(s => s === (item.store || "").toLowerCase()))
    : catalog;

  // 2. Diet filter
  if (diet === "vegan") {
    pool = pool.filter(item =>
      !["Meat & Fish", "Dairy"].includes(item.category) ||
      (item.diet_tags || []).includes("vegan")
    );
  } else if (diet === "vegetarian") {
    pool = pool.filter(item => item.category !== "Meat & Fish");
  } else if (diet === "keto") {
    pool = pool.filter(item =>
      !["Grains & Pasta", "Bread & Bakery", "Drinks", "Snacks"].includes(item.category)
    );
  }

  // 3. Bio filter
  if (bio) {
    const bioPool = pool.filter(item => /bio|alnatura|bioland|demeter|organic/i.test(item.product_name));
    if (bioPool.length >= 15) pool = bioPool;
  }

  // 4. Remove owned items
  if (ownedItems.length > 0) {
    pool = pool.filter(item =>
      !ownedItems.some(owned =>
        item.product_name.toLowerCase().includes(owned.toLowerCase()) ||
        (item.comparison_key || "").toLowerCase().includes(owned.toLowerCase())
      )
    );
  }

  // 5. Remove allergens
  if (allergies.length > 0) {
    pool = pool.filter(item => {
      const name = (item.product_name + " " + (item.comparison_key || "")).toLowerCase();
      return !allergies.some(a => name.includes(a.toLowerCase()));
    });
  }

  // 6. Deduplicate by comparison_key — cheapest per key
  const byKey = {};
  pool.forEach(item => {
    const key = item.comparison_key || item.product_name;
    if (!byKey[key] || item.unit_price < byKey[key].unit_price) byKey[key] = item;
  });

  // 7. Compute calPerUnit for each candidate
  const candidates = Object.values(byKey)
    .filter(item => item.unit_price > 0)
    .map(item => ({ ...item, calPerUnit: estimateCaloriesPerUnit(item) }));

  // 8. Score and sort: calorie-dense food first; non-caloric items last
  const scored = candidates.map(item => {
    const cat = item.category || "Other";
    let calPerEuro = item.calPerUnit > 0 ? item.calPerUnit / item.unit_price : 5;
    if (NON_CALORIC_CATEGORIES.includes(cat)) calPerEuro = 0.5;
    return { ...item, calPerEuro };
  }).sort((a, b) => b.calPerEuro - a.calPerEuro);

  // 9. Helper: is this a calorie-counted food item?
  function isCaloricFood(item) {
    return !NON_CALORIC_CATEGORIES.includes(item.category || "Other") && item.calPerUnit > 0;
  }

  // 10. Helper: how many units to buy
  function scaleUnits(item, calStillNeeded, budgetLeft) {
    const cat = item.category || "Other";
    const hardCap = MAX_TOTAL_UNITS[cat] || 2;
    const compKey = item.comparison_key || "";
    const isHighCal = HIGH_CAL_STAPLE_KEYS.some(k => compKey.includes(k));
    const effectiveCap = isHighCal ? Math.min(hardCap, 2) : hardCap;

    if (!isCaloricFood(item)) return 1;
    const unitsForCal = calStillNeeded > 0 ? Math.ceil(calStillNeeded / item.calPerUnit) : 1;
    const unitsForBudget = Math.floor(budgetLeft / item.unit_price);
    return Math.max(1, Math.min(unitsForCal, unitsForBudget, effectiveCap));
  }

  // 11. Greedy selection
  let runningCost = 0;
  let runningCal = 0; // only tracks caloric food calories
  const selected = [];
  const categoryPriority = ["Grains & Pasta", "Dairy", "Meat & Fish", "Bread & Bakery", "Vegetables", "Fruits", "Snacks", "Pantry", "Drinks", "Household", "Other"];

  function tryAdd(item, forceSingleUnit = false) {
    if (runningCost + item.unit_price > budgetNum) return false;
    const calLeft = calTarget - runningCal;
    const units = forceSingleUnit ? 1 : scaleUnits(item, Math.max(calLeft, 1), budgetNum - runningCost);
    const totalPrice = parseFloat((item.unit_price * units).toFixed(2));
    if (runningCost + totalPrice > budgetNum) return false;
    selected.push({ ...item, unitsNeeded: units, totalPrice, quantity: `${units}x ${item.quantity_description || ""}`.trim() });
    runningCost += totalPrice;
    if (isCaloricFood(item)) runningCal += item.calPerUnit * units;
    return true;
  }

  // First pass: add 1 base unit per category to ensure variety (no scaling yet)
  for (const cat of categoryPriority) {
    const catItems = scored.filter(i => i.category === cat || (cat === "Other" && !categoryPriority.includes(i.category)));
    for (const item of catItems.slice(0, 2)) {
      if (tryAdd(item, true)) break; // always 1 unit in first pass
    }
  }

  // Second pass: scale up caloric items to meet calorie target, add non-caloric variety
  for (const item of scored) {
    if (selected.find(s => s.comparison_key === item.comparison_key)) continue;
    const caloric = isCaloricFood(item);
    const calLeft = calTarget - runningCal;
    // If we already hit calorie target, add everything at 1 unit (variety + budget spending)
    tryAdd(item, !caloric || calLeft <= 0);
  }

  // Third pass: scale up existing caloric items if we're still short on calories
  // (happens when second pass added many 1-unit items without filling the gap)
  for (const item of selected.filter(i => isCaloricFood(i))) {
    const calLeft = calTarget - runningCal;
    if (calLeft <= 0) break;
    const cat = item.category || "Other";
    const hardCap = MAX_TOTAL_UNITS[cat] || 2;
    const compKey = item.comparison_key || "";
    const isHighCal = HIGH_CAL_STAPLE_KEYS.some(k => compKey.includes(k));
    const effectiveCap = isHighCal ? Math.min(hardCap, 2) : hardCap;
    if (item.unitsNeeded >= effectiveCap) continue;
    const additionalUnits = Math.min(
      Math.ceil(calLeft / item.calPerUnit),
      effectiveCap - item.unitsNeeded,
      Math.floor((budgetNum - runningCost) / item.unit_price)
    );
    if (additionalUnits <= 0) continue;
    const extraCost = parseFloat((item.unit_price * additionalUnits).toFixed(2));
    if (runningCost + extraCost > budgetNum) continue;
    item.unitsNeeded += additionalUnits;
    item.totalPrice = parseFloat((item.unit_price * item.unitsNeeded).toFixed(2));
    item.quantity = `${item.unitsNeeded}x ${item.quantity_description || ""}`.trim();
    runningCost += extraCost;
    runningCal += item.calPerUnit * additionalUnits;
  }

  // 12. Build output grouped by category
  const categoryMap = {};
  for (const item of selected) {
    const cat = item.category || "Other";
    if (!categoryMap[cat]) categoryMap[cat] = [];
    const totalItemCal = Math.round(item.calPerUnit * item.unitsNeeded);
    categoryMap[cat].push({
      name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      price: item.totalPrice,
      normal_price: item.normal_price ? parseFloat((item.normal_price * item.unitsNeeded).toFixed(2)) : null,
      store: item.store,
      calories_info: totalItemCal > 0 ? `~${totalItemCal.toLocaleString()} kcal total` : (item.calories_info || ""),
      _cal: totalItemCal,
    });
  }

  const categories = Object.entries(categoryMap).map(([name, items]) => ({ name, items }));

  return {
    total_estimated_cost: parseFloat(runningCost.toFixed(2)),
    categories,
    totalCalories: Math.round(runningCal),
    calPerDay: Math.round(runningCal / daysNum / peopleNum),
    fromCache: true,
  };
}