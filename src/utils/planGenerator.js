/**
 * Client-side grocery plan generator.
 * Takes the PriceCatalog data and user constraints, returns a structured grocery list.
 * Zero AI credits — runs entirely in the browser.
 */

// Known calorie density (kcal per 100g or 100ml) for common comparison_keys.
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

// Non-food categories don't contribute calories
const NON_FOOD_CATEGORIES = ["Household", "Health & Beauty"];

// Pantry/condiment items that shouldn't be bulk-bought to fill calorie targets
const CONDIMENT_CATEGORIES = ["Pantry", "Spreads"];

// Max units per week by category (prevents absurd quantities)
const MAX_UNITS_PER_WEEK = {
  "Dairy": 3,
  "Meat & Fish": 2,
  "Grains & Pasta": 3,
  "Bread & Bakery": 2,
  "Vegetables": 3,
  "Fruits": 3,
  "Drinks": 4,
  "Snacks": 2,
  "Pantry": 1,
  "Spreads": 1,
  "Household": 1,
};

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
  if (NON_FOOD_CATEGORIES.includes(item.category)) return 0;
  const per100 = parseCaloriesPer100(item.calories_info);
  const grams = parseQuantityGrams(item.quantity_description);
  if (per100 !== null && grams !== null) {
    return (per100 / 100) * grams;
  }
  const key = item.comparison_key || "";
  for (const [mapKey, density] of Object.entries(CALORIE_DENSITY_MAP)) {
    if (key.toLowerCase().includes(mapKey.split(" ")[0].toLowerCase())) {
      const g = grams || 500;
      return (density / 100) * g;
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
  const calPerDayTarget = parseFloat(calories); // user's daily calorie goal
  const calTarget = calPerDayTarget * daysNum * peopleNum; // total kcal needed
  const weeks = Math.ceil(daysNum / 7);

  // 1. Filter catalog to selected stores
  const storeList = (typeof stores === "string" ? stores.split(",") : stores)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  let pool = storeList.length > 0
    ? catalog.filter(item => storeList.some(s => s === (item.store || "").toLowerCase()))
    : catalog;

  // 2. Apply diet filter
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
    const bioPool = pool.filter(item =>
      /bio|alnatura|bioland|demeter|organic/i.test(item.product_name)
    );
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

  // 6. Deduplicate by comparison_key — pick cheapest
  const byKey = {};
  pool.forEach(item => {
    const key = item.comparison_key || item.product_name;
    if (!byKey[key] || item.unit_price < byKey[key].unit_price) {
      byKey[key] = item;
    }
  });

  // 7. Compute calPerUnit for each candidate
  const candidates = Object.values(byKey)
    .filter(item => item.unit_price > 0)
    .map(item => ({ ...item, calPerUnit: estimateCaloriesPerUnit(item) }));

  // 8. Score: calorie-dense food first; condiments and non-food deprioritised
  const scored = candidates.map(item => {
    const cat = item.category || "Other";
    let calPerEuro = item.calPerUnit > 0 ? item.calPerUnit / item.unit_price : 10;
    if (CONDIMENT_CATEGORIES.includes(cat)) calPerEuro *= 0.05;
    if (NON_FOOD_CATEGORIES.includes(cat)) calPerEuro = 1;
    return { ...item, calPerEuro };
  }).sort((a, b) => b.calPerEuro - a.calPerEuro);

  // Helper: how many units of this item to buy
  function scaleUnits(item, calStillNeeded, budgetLeft) {
    const cat = item.category || "Other";
    const maxPerWeek = MAX_UNITS_PER_WEEK[cat] || 2;
    const hardCap = weeks * maxPerWeek;

    if (item.calPerUnit <= 0 || NON_FOOD_CATEGORIES.includes(cat) || CONDIMENT_CATEGORIES.includes(cat)) {
      return 1;
    }
    const unitsForCal = calStillNeeded > 0 ? Math.ceil(calStillNeeded / item.calPerUnit) : 1;
    const unitsForBudget = Math.floor(budgetLeft / item.unit_price);
    return Math.max(1, Math.min(unitsForCal, unitsForBudget, hardCap));
  }

  // 9. Greedy selection
  let runningCost = 0;
  let runningCal = 0;
  const selected = [];
  const categoryPriority = ["Grains & Pasta", "Dairy", "Meat & Fish", "Bread & Bakery", "Vegetables", "Fruits", "Pantry", "Snacks", "Drinks", "Household", "Other"];

  // First pass: one item per category
  for (const cat of categoryPriority) {
    const catItems = scored.filter(i => i.category === cat || (cat === "Other" && !categoryPriority.includes(i.category)));
    for (const item of catItems.slice(0, 2)) {
      const isFood = !NON_FOOD_CATEGORIES.includes(cat) && !CONDIMENT_CATEGORIES.includes(cat) && item.calPerUnit > 0;
      if (isFood && runningCal >= calTarget) break; // already hit target
      const units = scaleUnits(item, Math.max(calTarget - runningCal, 1), budgetNum - runningCost);
      const totalPrice = parseFloat((item.unit_price * units).toFixed(2));
      if (runningCost + totalPrice <= budgetNum) {
        selected.push({ ...item, unitsNeeded: units, totalPrice, quantity: `${units}x ${item.quantity_description || ""}`.trim() });
        runningCost += totalPrice;
        runningCal += item.calPerUnit * units;
        break;
      }
    }
  }

  // Second pass: fill remaining calorie gap (stop adding food once calTarget is met)
  for (const item of scored) {
    if (selected.find(s => s.comparison_key === item.comparison_key)) continue;
    if (runningCost + item.unit_price > budgetNum) continue;

    const cat = item.category || "Other";
    const isFood = !NON_FOOD_CATEGORIES.includes(cat) && !CONDIMENT_CATEGORIES.includes(cat) && item.calPerUnit > 0;

    // Don't add more food items once calorie target is met
    if (isFood && runningCal >= calTarget) continue;

    const units = scaleUnits(item, Math.max(calTarget - runningCal, 1), budgetNum - runningCost);
    const totalPrice = parseFloat((item.unit_price * units).toFixed(2));
    if (runningCost + totalPrice > budgetNum) continue;

    selected.push({ ...item, unitsNeeded: units, totalPrice, quantity: `${units}x ${item.quantity_description || ""}`.trim() });
    runningCost += totalPrice;
    runningCal += item.calPerUnit * units;
  }

  // 10. Build output grouped by category
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

  // Clamp reported calPerDay to the user's goal (slight overshoot from integer unit rounding is expected)
  const actualCalPerDay = Math.round(runningCal / daysNum / peopleNum);

  return {
    total_estimated_cost: parseFloat(runningCost.toFixed(2)),
    categories,
    totalCalories: Math.round(runningCal),
    calPerDay: actualCalPerDay,
    fromCache: true,
  };
}