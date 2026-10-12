// A small catalog of real premium grocery products sold at German supermarkets.
// Used to deterministically top up a "maximize" grocery list when the AI model
// generates a list that stays well under the user's budget — the model reliably
// ignores prompt instructions to spend close to the budget, so we fill the gap
// in code instead of retrying.

// Each product: name, store, price (EUR for the quantity), unit_price, quantity,
// normal_price (mid-range equivalent), calories_info, total_kcal, protein_g, carb_g, fat_g.
// Prices are realistic 2024-2025 German prices for the stated quantity.

const PREMIUM_PRODUCTS = [
  // Meat & Fish
  { name: "Rinderfilet 500g", store: "REWE", price: 24.99, unit_price: 24.99, quantity: "500g", normal_price: 28.99, calories_info: "210 kcal/100g", total_kcal: 1050, protein_g: 90, carb_g: 0, fat_g: 70 },
  { name: "Lachsfilet frisch 400g", store: "Edeka", price: 12.99, unit_price: 12.99, quantity: "400g", normal_price: 14.99, calories_info: "208 kcal/100g", total_kcal: 832, protein_g: 80, carb_g: 0, fat_g: 52 },
  { name: "Bio-Hähnchenbrustfilet 600g", store: "REWE", price: 8.49, unit_price: 8.49, quantity: "600g", normal_price: 9.99, calories_info: "113 kcal/100g", total_kcal: 678, protein_g: 132, carb_g: 0, fat_g: 15 },
  { name: "Rinderhackfleisch bio 500g", store: "Edeka", price: 7.99, unit_price: 7.99, quantity: "500g", normal_price: 9.49, calories_info: "250 kcal/100g", total_kcal: 1250, protein_g: 100, carb_g: 0, fat_g: 90 },
  { name: "Kabanos scharf 150g", store: "Aldi", price: 3.49, unit_price: 3.49, quantity: "150g", normal_price: 4.49, calories_info: "320 kcal/100g", total_kcal: 480, protein_g: 30, carb_g: 3, fat_g: 36 },
  { name: "Salami Milano 200g", store: "Lidl", price: 2.99, unit_price: 2.99, quantity: "200g", normal_price: 3.99, calories_info: "350 kcal/100g", total_kcal: 700, protein_g: 40, carb_g: 4, fat_g: 56 },
  // Cheese & Dairy
  { name: "Parmigiano Reggiano 250g", store: "REWE", price: 7.99, unit_price: 7.99, quantity: "250g", normal_price: 9.49, calories_info: "392 kcal/100g", total_kcal: 980, protein_g: 88, carb_g: 4, fat_g: 64 },
  { name: "Mozzarella di Bufala 250g", store: "Edeka", price: 4.99, unit_price: 4.99, quantity: "250g", normal_price: 5.99, calories_info: "254 kcal/100g", total_kcal: 635, protein_g: 44, carb_g: 4, fat_g: 48 },
  { name: "Brie de Meaux 250g", store: "REWE", price: 5.49, unit_price: 5.49, quantity: "250g", normal_price: 6.49, calories_info: "300 kcal/100g", total_kcal: 750, protein_g: 50, carb_g: 4, fat_g: 58 },
  { name: "Bio-Skyr 500g", store: "Lidl", price: 2.49, unit_price: 2.49, quantity: "500g", normal_price: 3.29, calories_info: "68 kcal/100g", total_kcal: 340, protein_g: 60, carb_g: 24, fat_g: 3 },
  { name: "Bio-Joghurt griechisch 500g", store: "REWE", price: 2.79, unit_price: 2.79, quantity: "500g", normal_price: 3.49, calories_info: "97 kcal/100g", total_kcal: 485, protein_g: 45, carb_g: 24, fat_g: 25 },
  { name: "Gouda jong 400g", store: "Aldi", price: 4.49, unit_price: 4.49, quantity: "400g", normal_price: 5.49, calories_info: "356 kcal/100g", total_kcal: 1424, protein_g: 100, carb_g: 8, fat_g: 112 },
  // Nuts & Dried Fruit
  { name: "Mandeln gehäut 200g", store: "REWE", price: 3.99, unit_price: 3.99, quantity: "200g", normal_price: 4.99, calories_info: "579 kcal/100g", total_kcal: 1158, protein_g: 42, carb_g: 44, fat_g: 100 },
  { name: "Cashew Nüsse 200g", store: "Lidl", price: 3.49, unit_price: 3.49, quantity: "200g", normal_price: 4.49, calories_info: "553 kcal/100g", total_kcal: 1106, protein_g: 36, carb_g: 60, fat_g: 88 },
  { name: "Walnüsse 200g", store: "Edeka", price: 4.49, unit_price: 4.49, quantity: "200g", normal_price: 5.49, calories_info: "654 kcal/100g", total_kcal: 1308, protein_g: 30, carb_g: 28, fat_g: 130 },
  { name: "Datteln getrocknet 250g", store: "Aldi", price: 2.99, unit_price: 2.99, quantity: "250g", normal_price: 3.99, calories_info: "282 kcal/100g", total_kcal: 705, protein_g: 7, carb_g: 168, fat_g: 1 },
  // Fresh Fruit & Veg (premium)
  { name: "Bio Heidelbeeren 300g", store: "REWE", price: 3.99, unit_price: 3.99, quantity: "300g", normal_price: 4.99, calories_info: "57 kcal/100g", total_kcal: 171, protein_g: 2, carb_g: 42, fat_g: 1 },
  { name: "Bio Avocado 4er", store: "Edeka", price: 4.99, unit_price: 4.99, quantity: "4 Stück", normal_price: 5.99, calories_info: "160 kcal/100g", total_kcal: 640, protein_g: 8, carb_g: 32, fat_g: 52 },
  { name: "Frische Feigen 250g", store: "REWE", price: 3.99, unit_price: 3.99, quantity: "250g", normal_price: 4.99, calories_info: "74 kcal/100g", total_kcal: 185, protein_g: 4, carb_g: 45, fat_g: 1 },
  { name: "Bio Cherry Tomaten 500g", store: "Lidl", price: 2.99, unit_price: 2.99, quantity: "500g", normal_price: 3.49, calories_info: "18 kcal/100g", total_kcal: 90, protein_g: 4, carb_g: 18, fat_g: 1 },
  { name: "Bio Rucola 100g", store: "REWE", price: 1.99, unit_price: 1.99, quantity: "100g", normal_price: 2.49, calories_info: "25 kcal/100g", total_kcal: 25, protein_g: 3, carb_g: 4, fat_g: 1 },
  // Premium branded / specialty
  { name: "Lindt Excellence 70% 100g", store: "REWE", price: 2.79, unit_price: 2.79, quantity: "100g", normal_price: 3.29, calories_info: "598 kcal/100g", total_kcal: 598, protein_g: 8, carb_g: 45, fat_g: 42 },
  { name: "Barilla Spaghetti 1kg", store: "Edeka", price: 2.99, unit_price: 2.99, quantity: "1kg", normal_price: 3.49, calories_info: "361 kcal/100g", total_kcal: 3610, protein_g: 130, carb_g: 720, fat_g: 16 },
  { name: "Bertolli Olivenöl extra 750ml", store: "REWE", price: 9.99, unit_price: 9.99, quantity: "750ml", normal_price: 11.99, calories_info: "884 kcal/100ml", total_kcal: 6630, protein_g: 0, carb_g: 0, fat_g: 750 },
  { name: "Bio Honig 500g", store: "Lidl", price: 5.99, unit_price: 5.99, quantity: "500g", normal_price: 7.49, calories_info: "304 kcal/100g", total_kcal: 1520, protein_g: 3, carb_g: 400, fat_g: 0 },
  { name: "Bio Kaffee gemahlen 500g", store: "Aldi", price: 6.99, unit_price: 6.99, quantity: "500g", normal_price: 8.49, calories_info: "0 kcal/g", total_kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0 },
  { name: "Pesto Genovese 190g", store: "REWE", price: 3.49, unit_price: 3.49, quantity: "190g", normal_price: 4.29, calories_info: "540 kcal/100g", total_kcal: 1026, protein_g: 24, carb_g: 16, fat_g: 90 },
  { name: "Serrano Schinken 150g", store: "Edeka", price: 4.99, unit_price: 4.99, quantity: "150g", normal_price: 5.99, calories_info: "280 kcal/100g", total_kcal: 420, protein_g: 33, carb_g: 1, fat_g: 30 },
  { name: "Bio Eier Freiland 10er", store: "Lidl", price: 3.99, unit_price: 3.99, quantity: "10 Stück", normal_price: 4.99, calories_info: "143 kcal/100g", total_kcal: 715, protein_g: 60, carb_g: 5, fat_g: 50 },
  { name: "Manchego 200g", store: "REWE", price: 6.99, unit_price: 6.99, quantity: "200g", normal_price: 8.49, calories_info: "386 kcal/100g", total_kcal: 772, protein_g: 56, carb_g: 4, fat_g: 60 },
  { name: "Bio Quinoa 500g", store: "Edeka", price: 3.99, unit_price: 3.99, quantity: "500g", normal_price: 4.99, calories_info: "368 kcal/100g", total_kcal: 1840, protein_g: 68, carb_g: 320, fat_g: 30 },
  { name: "Smoothie Mango-Orange 750ml", store: "REWE", price: 3.49, unit_price: 3.49, quantity: "750ml", normal_price: 4.29, calories_info: "48 kcal/100ml", total_kcal: 360, protein_g: 5, carb_g: 84, fat_g: 1 },
];

// Filter products to those available at the selected stores, then greedily
// add them (largest first to fill the gap efficiently) until the total is close
// to the target. Avoids duplicating products already in the list.
export function padToBudget(result, targetBudget, selectedStores) {
  const existingNames = new Set(
    (result?.categories || []).flatMap((c) => c.items || [])
      .map((i) => i.name.toLowerCase())
  );

  const allowed = (selectedStores || []).map((s) => s.toLowerCase().split(" ")[0]);
  const pool = PREMIUM_PRODUCTS.filter((p) => {
    if (existingNames.has(p.name.toLowerCase())) return false;
    if (!allowed.length) return true;
    return allowed.some((a) => p.store.toLowerCase().includes(a));
  });

  // Sort by price descending so we fill the gap with fewer items.
  pool.sort((a, b) => b.price - a.price);

  let currentCost = (result?.categories || []).flatMap((c) => c.items || [])
    .reduce((s, i) => s + (Number(i.price) || 0), 0);
  const target = Number(targetBudget) * 0.97; // get within 3% of budget
  if (currentCost >= target) return result;

  const toAdd = [];
  const used = new Set();
  // First pass: add the most expensive items that fit
  for (const p of pool) {
    if (currentCost + p.price > Number(targetBudget)) continue;
    if (used.has(p.name)) continue;
    toAdd.push(p);
    used.add(p.name);
    currentCost += p.price;
    if (currentCost >= target) break;
  }

  // Second pass: if still under, add smaller items
  if (currentCost < target) {
    for (const p of pool) {
      if (used.has(p.name)) continue;
      if (currentCost + p.price > Number(targetBudget)) continue;
      toAdd.push(p);
      used.add(p.name);
      currentCost += p.price;
      if (currentCost >= target) break;
    }
  }

  if (!toAdd.length) return result;

  // Group added items into a "Premium" category
  const premiumCategory = {
    name: "Premium",
    items: toAdd.map((p) => ({
      ...p,
      store: p.store,
    })),
  };

  const categories = [...(result?.categories || []), premiumCategory];
  const newTotal = Math.round(currentCost * 100) / 100;
  return { ...result, categories, total_estimated_cost: newTotal };
}