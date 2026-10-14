// Real protein supplement products sold at German supermarkets and drugstores.
// When a user sets a very high protein macro target (>=35% of calories from
// protein), normal groceries alone can't realistically reach that split —
// it's bodybuilder territory. This module adds whey protein powder and
// protein bars to the grocery list to help close the gap, respecting the
// user's selected stores and budget.

// Each product: name, store, price, unit_price, quantity, normal_price,
// calories_info, total_kcal, protein_g, carb_g, fat_g.
// Nutrition values are for the FULL pack. Whey concentrate ~75-80% protein.

const PROTEIN_SUPPLEMENTS = [
  // Drugstore protein powder (cheapest per gram of protein)
  { name: "dm Bodylab24 Whey Protein Schoko 750g", store: "dm", price: 17.95, unit_price: 17.95, quantity: "1 × 750g", normal_price: 17.95, calories_info: "380 kcal/100g", total_kcal: 2850, protein_g: 563, carb_g: 68, fat_g: 53 },
  { name: "Rossmann Dreambody Whey Protein Vanille 750g", store: "Rossmann", price: 17.99, unit_price: 17.99, quantity: "1 × 750g", normal_price: 17.99, calories_info: "375 kcal/100g", total_kcal: 2813, protein_g: 570, carb_g: 60, fat_g: 49 },
  // Discounter protein powder
  { name: "Crane Protein Pulver Schoko 500g", store: "Aldi", price: 9.99, unit_price: 9.99, quantity: "1 × 500g", normal_price: 9.99, calories_info: "382 kcal/100g", total_kcal: 1910, protein_g: 375, carb_g: 45, fat_g: 38 },
  { name: "Energon Protein Pulver Schoko 900g", store: "Lidl", price: 14.99, unit_price: 14.99, quantity: "1 × 900g", normal_price: 14.99, calories_info: "378 kcal/100g", total_kcal: 3402, protein_g: 675, carb_g: 81, fat_g: 63 },
  // Mid-range / premium
  { name: "Optimum Nutrition Gold Standard Whey 908g", store: "REWE", price: 34.99, unit_price: 34.99, quantity: "1 × 908g", normal_price: 34.99, calories_info: "400 kcal/100g", total_kcal: 3632, protein_g: 726, carb_g: 91, fat_g: 73 },
  { name: "Multipower 100% Whey Protein 990g", store: "Edeka", price: 24.99, unit_price: 24.99, quantity: "1 × 990g", normal_price: 24.99, calories_info: "390 kcal/100g", total_kcal: 3861, protein_g: 693, carb_g: 99, fat_g: 79 },
  // Protein bars (smaller, for snacking)
  { name: "dm Sportness Protein Riegel Cookies 45g", store: "dm", price: 0.95, unit_price: 0.95, quantity: "6 × 45g", normal_price: 0.95, calories_info: "360 kcal/100g", total_kcal: 972, protein_g: 120, carb_g: 108, fat_g: 54 },
  { name: "Corny Big High Protein Bar Schoko 50g", store: "REWE", price: 0.99, unit_price: 0.99, quantity: "6 × 50g", normal_price: 0.99, calories_info: "370 kcal/100g", total_kcal: 1110, protein_g: 150, carb_g: 102, fat_g: 57 },
];

const PROTEIN_SUPPLEMENT_THRESHOLD = 35; // % of calories from protein

export function isBodybuilderProteinTarget(macros) {
  return macros && Number(macros.protein) >= PROTEIN_SUPPLEMENT_THRESHOLD;
}

// Add protein supplements to the grocery list when the protein target is
// very high (>=35%). Picks products available at the user's selected stores
// (or dm/Rossmann if no stores selected), adds them within budget, and
// scales the quantity to help close the protein gap.
export function addProteinSupplements(result, p) {
  if (!isBodybuilderProteinTarget(p.macros)) return result;

  const budgetCap = Number(p.budget) + (Number(p.proteinSnackBudget) || 0);
  const items = (result?.categories || []).flatMap((c) => c.items || []);
  let currentCost = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
  if (currentCost >= budgetCap) return result;

  const existingNames = new Set(items.map((i) => i.name.toLowerCase()));

  // Filter to products available at selected stores
  const allowed = (Array.isArray(p.stores) ? p.stores : String(p.stores || "").split(","))
    .map((s) => s.trim().toLowerCase().split(" ")[0])
    .filter(Boolean);

  const pool = PROTEIN_SUPPLEMENTS.filter((p2) => {
    if (existingNames.has(p2.name.toLowerCase())) return false;
    if (!allowed.length) return true; // no stores selected → dm/Rossmann are fine
    return allowed.some((a) => p2.store.toLowerCase().includes(a));
  });

  // If no matches from selected stores, fall back to dm/Rossmann (drugstores
  // always carry protein powder, and bodybuilders typically shop there).
  if (!pool.length) {
    const fallback = PROTEIN_SUPPLEMENTS.filter(
      (p2) => !existingNames.has(p2.name.toLowerCase()) &&
        (p2.store === "dm" || p2.store === "Rossmann")
    );
    pool.push(...fallback);
  }

  if (!pool.length) return result;

  // Sort by protein-per-euro descending — best value first
  pool.sort((a, b) => (b.protein_g / b.price) - (a.protein_g / a.price));

  const toAdd = [];
  for (const supp of pool) {
    if (currentCost + supp.price > budgetCap) continue;
    toAdd.push(supp);
    currentCost += supp.price;
    if (toAdd.length >= 2) break; // 1-2 supplements is enough
  }

  if (!toAdd.length) return result;

  const supplementCategory = {
    name: "Protein Supplements",
    items: toAdd,
  };

  const categories = [...(result?.categories || []), supplementCategory];
  const newTotal = Math.round(currentCost * 100) / 100;
  return { ...result, categories, total_estimated_cost: newTotal };
}