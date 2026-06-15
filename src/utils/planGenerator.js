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

// Categories that don't count toward calorie target (cleaning, health products)
// Pantry, Spreads, and Drinks DO have calories and should be counted
const NON_CALORIC_CATEGORIES = ["Household", "Health & Beauty"];

// Minimum calorie percentage from each category for a balanced diet
const BALANCED_DIET_TARGETS = {
  "Grains & Pasta": { min: 0.25, max: 0.35 },  // 25-35% from grains
  "Vegetables": { min: 0.15, max: 0.25 },      // 15-25% from vegetables
  "Fruits": { min: 0.10, max: 0.20 },          // 10-20% from fruits
  "Meat & Fish": { min: 0.15, max: 0.25 },     // 15-25% from protein
  "Dairy": { min: 0.10, max: 0.20 },           // 10-20% from dairy
  "Bread & Bakery": { min: 0.10, max: 0.20 },  // 10-20% from bread
};

// Max total units for entire period — prevents any single item dominating
// Increased limits for calorie-dense categories (Pantry, Spreads) to help reach calorie targets
const MAX_TOTAL_UNITS = {
  "Dairy": 6,
  "Meat & Fish": 5,
  "Grains & Pasta": 6,
  "Bread & Bakery": 5,
  "Vegetables": 5,
  "Fruits": 5,
  "Drinks": 4,
  "Snacks": 4,
  "Pantry": 3,
  "Spreads": 3,
  "Household": 1,
};

// High-calorie-density staples — cap relaxed when calorie target is not met
const HIGH_CAL_STAPLE_KEYS = ["Butter", "Olivenöl", "Sonnenblumenöl", "Haferflocken", "Müsli", "Schokolade", "Erdnussbutter", "Nudeln", "Reis", "Toastbrot"];

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
  // First priority: use explicit calories_info if available
  const per100 = parseCaloriesPer100(item.calories_info);
  const grams = parseQuantityGrams(item.quantity_description);
  if (per100 !== null && grams !== null) return (per100 / 100) * grams;
  
  // Second priority: use calorie density map
  const key = item.comparison_key || "";
  for (const [mapKey, density] of Object.entries(CALORIE_DENSITY_MAP)) {
    if (key.toLowerCase().includes(mapKey.split(" ")[0].toLowerCase())) {
      return (density / 100) * (grams || 500);
    }
  }
  
  // Fallback: estimate based on category averages
  const categoryCalories = {
    "Dairy": 60,
    "Meat & Fish": 180,
    "Grains & Pasta": 350,
    "Bread & Bakery": 250,
    "Vegetables": 35,
    "Fruits": 50,
    "Pantry": 200,
    "Spreads": 400,
    "Drinks": 45,
    "Snacks": 400,
  };
  return (categoryCalories[item.category] || 100) / 100 * (grams || 500);
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
    saleHunt = false,
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

  // 3. Bio filter — hard-filter to only bio/organic items when enabled
  if (bio) {
    const bioPool = pool.filter(item =>
      item.bio === true ||
      /bio|alnatura|bioland|demeter|organic|naturkind|gut bio/i.test(item.product_name)
    );
    // Only apply the filter if we have enough items to build a meaningful list
    if (bioPool.length >= 10) pool = bioPool;
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

  // 8. Score and sort: calorie-dense food first; apply bio/saleHunt bonuses
  const scored = candidates.map(item => {
    const cat = item.category || "Other";
    let calPerEuro = item.calPerUnit > 0 ? item.calPerUnit / item.unit_price : 5;
    if (NON_CALORIC_CATEGORIES.includes(cat)) calPerEuro = 0.5;

    const isOnSale = item.normal_price && item.normal_price > item.unit_price * 1.05;
    if (saleHunt && isOnSale) {
      // Sale Hunt ON: heavily boost discounted items
      const discountPct = (item.normal_price - item.unit_price) / item.normal_price;
      calPerEuro *= (1 + discountPct * 2);
    } else if (!saleHunt && isOnSale) {
      // Sale Hunt OFF: penalize sale items so regular-priced items are preferred
      calPerEuro *= 0.3;
    }

    return { ...item, calPerEuro };
  }).sort((a, b) => b.calPerEuro - a.calPerEuro);

  // 9. Helper: does this item have meaningful calories (>10 cal per unit)?
  function hasMeaningfulCalories(item) {
    return !NON_CALORIC_CATEGORIES.includes(item.category || "Other") && item.calPerUnit > 10;
  }

  // 10. Helper: how many units to buy
  function scaleUnits(item, calStillNeeded, budgetLeft) {
    const cat = item.category || "Other";
    const hardCap = MAX_TOTAL_UNITS[cat] || 2;
    const compKey = item.comparison_key || "";
    const isHighCal = HIGH_CAL_STAPLE_KEYS.some(k => compKey.includes(k));
    
    // Relax caps when we're significantly short on calories (>30% below target)
    const calDeficitRatio = calStillNeeded / (calPerDayGoal * daysNum * peopleNum);
    const effectiveCap = (isHighCal && calDeficitRatio < 0.7) ? hardCap : Math.min(hardCap, 3);

    // Only scale for calories if item has meaningful calories
    if (!hasMeaningfulCalories(item)) return 1;
    const unitsForCal = calStillNeeded > 0 ? Math.ceil(calStillNeeded / item.calPerUnit) : 1;
    const unitsForBudget = Math.floor(budgetLeft / item.unit_price);
    return Math.max(1, Math.min(unitsForCal, unitsForBudget, effectiveCap));
  }

  // 11. Greedy selection with balanced diet enforcement
  let runningCost = 0;
  let runningCal = 0; // tracks all meaningful calories
  const selected = [];
  const categoryCalories = {}; // track calories per category for balance
  const categoryPriority = ["Grains & Pasta", "Dairy", "Meat & Fish", "Bread & Bakery", "Vegetables", "Fruits", "Snacks", "Pantry", "Drinks", "Household", "Other"];
  
  // Initialize category calorie tracking
  Object.keys(BALANCED_DIET_TARGETS).forEach(cat => categoryCalories[cat] = 0);

  function tryAdd(item, forceSingleUnit = false) {
    if (runningCost + item.unit_price > budgetNum) return false;
    const calLeft = calTarget - runningCal;
    const units = forceSingleUnit ? 1 : scaleUnits(item, Math.max(calLeft, 1), budgetNum - runningCost);
    const totalPrice = parseFloat((item.unit_price * units).toFixed(2));
    if (runningCost + totalPrice > budgetNum) return false;
    selected.push({ ...item, unitsNeeded: units, totalPrice, quantity: `${units}x ${item.quantity_description || ""}`.trim() });
    runningCost += totalPrice;
    const itemCal = hasMeaningfulCalories(item) ? item.calPerUnit * units : 0;
    runningCal += itemCal;
    // Track calories per category for balance monitoring
    if (categoryCalories[item.category] !== undefined) {
      categoryCalories[item.category] += itemCal;
    }
    return true;
  }

  // First pass: add 1 base unit per category to ensure variety (no scaling yet)
  for (const cat of categoryPriority) {
    const catItems = scored.filter(i => i.category === cat || (cat === "Other" && !categoryPriority.includes(i.category)));
    for (const item of catItems.slice(0, 2)) {
      if (tryAdd(item, true)) break; // always 1 unit in first pass
    }
  }
  
  // Enforce minimum calories from each balanced diet category
  Object.entries(BALANCED_DIET_TARGETS).forEach(([cat, targets]) => {
    const minCal = calTarget * targets.min;
    const currentCal = categoryCalories[cat] || 0;
    if (currentCal >= minCal) return; // Already meeting minimum
    
    // Add more items from this category until we meet the minimum
    const catItems = scored.filter(i => i.category === cat && !selected.find(s => s.comparison_key === i.comparison_key));
    for (const item of catItems) {
      if (categoryCalories[cat] >= minCal) break;
      if (runningCost + item.unit_price > budgetNum) break;
      tryAdd(item, false);
    }
  });

  // Second pass: fill remaining calorie target while respecting category maximums
  for (const item of scored) {
    if (selected.find(s => s.comparison_key === item.comparison_key)) continue;
    const calLeft = calTarget - runningCal;
    if (calLeft <= 0) break;
    
    // Check if adding this item would exceed category maximum
    const cat = item.category;
    if (BALANCED_DIET_TARGETS[cat]) {
      const maxCal = calTarget * BALANCED_DIET_TARGETS[cat].max;
      const currentCatCal = categoryCalories[cat] || 0;
      const projectedCal = currentCatCal + item.calPerUnit;
      if (projectedCal > maxCal && currentCatCal >= maxCal * 0.9) continue; // Skip if at 90% of max
    }
    
    tryAdd(item, false);
  }

  // Third pass: scale up existing items if we're still short on calories, respecting balance
  for (const item of selected.filter(i => hasMeaningfulCalories(i))) {
    const calLeft = calTarget - runningCal;
    if (calLeft <= 0) break;
    const cat = item.category || "Other";
    
    // Check category max before scaling
    if (BALANCED_DIET_TARGETS[cat]) {
      const maxCal = calTarget * BALANCED_DIET_TARGETS[cat].max;
      const currentCatCal = categoryCalories[cat] || 0;
      if (currentCatCal >= maxCal) continue; // Don't scale if at category max
    }
    
    const hardCap = MAX_TOTAL_UNITS[cat] || 2;
    const compKey = item.comparison_key || "";
    const isHighCal = HIGH_CAL_STAPLE_KEYS.some(k => compKey.includes(k));
    const effectiveCap = isHighCal ? Math.min(hardCap, 3) : hardCap;
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
    const addedCal = item.calPerUnit * additionalUnits;
    runningCal += addedCal;
    if (categoryCalories[cat] !== undefined) {
      categoryCalories[cat] += addedCal;
    }
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