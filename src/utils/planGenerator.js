/**
 * Client-side grocery plan generator.
 * Takes the PriceCatalog data and user constraints, returns a structured grocery list.
 * Zero AI credits — runs entirely in the browser.
 */

// Known calorie density (kcal per 100g or 100ml) for common comparison_keys.
// Used as fallback if calories_info is missing or unparseable.
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

/**
 * Parse a calories_info string like "~65 kcal/100ml" or "350 kcal/100g"
 * Returns kcal per 100 units, or null if unparseable.
 */
function parseCaloriesPer100(info) {
  if (!info) return null;
  const match = info.match(/(\d+)\s*kcal\s*\/\s*100/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse a quantity_description like "500g", "1L", "10er", "2kg"
 * Returns total grams/ml as a number, or null.
 */
function parseQuantityGrams(qtyStr) {
  if (!qtyStr) return null;
  const lower = (qtyStr + "").toLowerCase().trim();

  // e.g. "1.5l", "1,5l"
  const lMatch = lower.match(/([\d.,]+)\s*l$/);
  if (lMatch) return parseFloat(lMatch[1].replace(",", ".")) * 1000;

  // e.g. "500g", "1kg", "2kg"
  const gMatch = lower.match(/([\d.,]+)\s*kg$/);
  if (gMatch) return parseFloat(gMatch[1].replace(",", ".")) * 1000;

  const gMatch2 = lower.match(/([\d.,]+)\s*g$/);
  if (gMatch2) return parseFloat(gMatch2[1].replace(",", "."));

  // e.g. "10er" — eggs, count as ~155 kcal each (handled by density map)
  const erMatch = lower.match(/(\d+)\s*er$/);
  if (erMatch) return parseInt(erMatch[1], 10) * 10; // treat as ~10g each for math

  return null;
}

/**
 * Estimate total calories for one package of an item.
 */
function estimateCaloriesPerUnit(item) {
  if (NON_FOOD_CATEGORIES.includes(item.category)) return 0;

  const per100 = parseCaloriesPer100(item.calories_info);
  const grams = parseQuantityGrams(item.quantity_description);

  if (per100 !== null && grams !== null) {
    return (per100 / 100) * grams;
  }

  // Fallback: try matching comparison_key against our density map
  const key = item.comparison_key || "";
  for (const [mapKey, density] of Object.entries(CALORIE_DENSITY_MAP)) {
    if (key.toLowerCase().includes(mapKey.split(" ")[0].toLowerCase())) {
      const g = grams || 500; // default to 500g if we can't parse
      return (density / 100) * g;
    }
  }

  return 0; // give up
}

/**
 * MAIN FUNCTION: Generate a grocery list from the PriceCatalog cache.
 *
 * @param {Array}  catalog      - Array of PriceCatalog records
 * @param {Object} constraints  - { budget, days, calories, people, diet, stores, allergies, ownedItems, bio }
 * @returns {{ total_estimated_cost, categories, totalCalories, calPerDay }}
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
  const calTarget = parseFloat(calories) * daysNum * parseInt(people, 10); // total kcal needed
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

  // 3. Remove bio-only filter if requested
  if (bio) {
    const bioPool = pool.filter(item =>
      /bio|alnatura|bioland|demeter|organic/i.test(item.product_name)
    );
    if (bioPool.length >= 15) pool = bioPool; // only apply if enough bio items exist
  }

  // 4. Remove items the user already owns
  if (ownedItems.length > 0) {
    pool = pool.filter(item =>
      !ownedItems.some(owned =>
        item.product_name.toLowerCase().includes(owned.toLowerCase()) ||
        (item.comparison_key || "").toLowerCase().includes(owned.toLowerCase())
      )
    );
  }

  // 5. Remove items with allergens
  if (allergies.length > 0) {
    pool = pool.filter(item => {
      const name = (item.product_name + " " + (item.comparison_key || "")).toLowerCase();
      return !allergies.some(a => name.includes(a.toLowerCase()));
    });
  }

  // 6. Deduplicate by comparison_key — pick cheapest per key per store set
  const byKey = {};
  pool.forEach(item => {
    const key = item.comparison_key || item.product_name;
    if (!byKey[key] || item.unit_price < byKey[key].unit_price) {
      byKey[key] = item;
    }
  });

  // 7. For each unique item, compute how many units are needed for the period and their price
  const candidates = Object.values(byKey)
    .filter(item => item.unit_price > 0)
    .map(item => {
      const calPerUnit = estimateCaloriesPerUnit(item);
      // Non-food items: buy once per week (cleaning, etc.)
      // Food items: buy enough to cover the period
      let unitsNeeded;
      if (NON_FOOD_CATEGORIES.includes(item.category) || calPerUnit === 0) {
        unitsNeeded = weeks; // 1 per week
      } else {
        // How many units of this item does a person need per day?
        // We'll determine that during the selection phase
        unitsNeeded = weeks; // start with 1/week, refine later
      }
      return {
        ...item,
        calPerUnit,
        unitsNeeded,
        totalPrice: parseFloat((item.unit_price * unitsNeeded).toFixed(2)),
        quantity: `${unitsNeeded}x ${item.quantity_description || ""}`.trim(),
      };
    });

  // 8. Score each item: prioritize high-calorie-per-euro items (best value for calorie goals)
  //    Condiments/pantry are deprioritized so they don't inflate calorie math
  const scored = candidates.map(item => {
    const cat = item.category || "Other";
    let calPerEuro = item.calPerUnit > 0 ? item.calPerUnit / item.unit_price : 10;
    // Penalize oils/condiments so real food wins the sort
    if (CONDIMENT_CATEGORIES.includes(cat)) calPerEuro = calPerEuro * 0.05;
    if (NON_FOOD_CATEGORIES.includes(cat)) calPerEuro = 1;
    return { ...item, calPerEuro };
  }).sort((a, b) => b.calPerEuro - a.calPerEuro);

  // Helper to compute scaled units for an item to meet remaining calorie need
  function scaleUnits(item, calStillNeeded, budgetLeft) {
    const cat = item.category || "Other";
    const maxPerWeek = MAX_UNITS_PER_WEEK[cat] || 2;
    const hardCap = weeks * maxPerWeek;

    if (item.calPerUnit <= 0 || NON_FOOD_CATEGORIES.includes(cat) || CONDIMENT_CATEGORIES.includes(cat)) {
      return 1; // condiments/non-food: just 1 unit
    }
    // Only buy as many units as needed to hit remaining calorie target
    const unitsForCal = Math.ceil(calStillNeeded / item.calPerUnit);
    const unitsForBudget = Math.floor(budgetLeft / item.unit_price);
    return Math.max(1, Math.min(unitsForCal, unitsForBudget, hardCap));
  }

  // 9. Greedy selection: fill budget, track calories
  let runningCost = 0;
  let runningCal = 0;
  const selected = [];
  const categoryPriority = ["Grains & Pasta", "Dairy", "Meat & Fish", "Bread & Bakery", "Vegetables", "Fruits", "Pantry", "Snacks", "Drinks", "Household", "Other"];

  // First pass: ensure at least one item per priority category, scaled to calorie need
  for (const cat of categoryPriority) {
    const catItems = scored.filter(i => i.category === cat || (cat === "Other" && !categoryPriority.includes(i.category)));
    for (const item of catItems.slice(0, 2)) {
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

  // Second pass: fill remaining budget, prioritising calorie density
  for (const item of scored) {
    if (selected.find(s => s.comparison_key === item.comparison_key)) continue;
    if (runningCost + item.unit_price > budgetNum) continue;

    const units = scaleUnits(item, Math.max(calTarget - runningCal, 1), budgetNum - runningCost);
    const totalPrice = parseFloat((item.unit_price * units).toFixed(2));
    if (runningCost + totalPrice > budgetNum) continue;

    selected.push({ ...item, unitsNeeded: units, totalPrice, quantity: `${units}x ${item.quantity_description || ""}`.trim() });
    runningCost += totalPrice;
    runningCal += item.calPerUnit * units;
  }

  // 10. Build output structure grouped by category
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
    calPerDay: Math.round(runningCal / daysNum / parseInt(people, 10)),
    fromCache: true,
  };
}