import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Core comparison items — the SAME items tracked across ALL grocery stores
// so users can see price differences for identical products
const COMPARISON_ITEMS = [
  // Dairy
  "Vollmilch 3,5% 1L",
  "Halbfettmilch 1,5% 1L",
  "Butter 250g",
  "Saure Sahne 200g",
  "Schlagsahne 200ml",
  "Naturjoghurt 500g",
  "Skyr Natur 500g",
  "Gouda am Stück 400g",
  "Mozzarella 125g",
  "Frischkäse 200g",
  "Eier 10er",
  // Meat & Fish
  "Hähnchenbrust 500g",
  "Schweineschnitzel 500g",
  "Hackfleisch gemischt 500g",
  "Thunfisch in Wasser 185g Dose",
  "Lachs Filet 300g TK",
  // Bread & Bakery
  "Toastbrot 750g",
  "Vollkornbrot 500g",
  "Brötchen 6er",
  // Grains & Pasta
  "Nudeln Spaghetti 500g",
  "Reis Langkorn 1kg",
  "Haferflocken 500g",
  "Mehl Type 405 1kg",
  // Vegetables
  "Tomaten 500g",
  "Karotten 1kg",
  "Kartoffeln 2kg",
  "Zwiebeln 1kg",
  "Paprika rot 3er",
  "Brokkoli 500g",
  "Eisbergsalat",
  "Spinat TK 750g",
  // Fruits
  "Bananen 1kg",
  "Äpfel 1kg",
  "Orangen Netz 1kg",
  // Pantry
  "Olivenöl 750ml",
  "Sonnenblumenöl 1L",
  "Tomaten Passata 500g",
  "Ketchup 500ml",
  "Senf 250ml",
  // Drinks
  "Mineralwasser still 1,5L",
  "Orangensaft 1L",
  "Apfelsaft 1L",
  // Spreads & Breakfast
  "Erdbeermarmelade 450g",
  "Erdnussbutter 350g",
  "Müsli 500g",
  // Snacks & Sweet
  "Vollmilchschokolade 100g",
  "Knoppers 200g",
  // Household
  "Waschmittel Pulver 1,5kg",
  "Spülmittel 500ml",
];

// Store-specific extra items (drugstores/specialty)
const STORE_EXTRAS = {
  dm: ["Nivea Bodylotion 400ml", "Pampers Windeln Größe 3 52er", "Balea Shampoo 300ml", "Fitvia Protein Shake 750g", "dm Bio Chiasamen 250g"],
  Rossmann: ["Isana Shampoo 300ml", "Babylove Windeln Größe 3 52er", "Alterra Gesichtscreme 50ml", "Rossmann Protein Riegel", "Rossmann Bio Leinsamen 400g"],
  Müller: ["Müller Milch 400ml", "Müllermilch Protein 400ml", "Ritter Sport Schokolade 100g", "Müsli Riegel 6er", "Nescafé Classic 200g"],
};

const GROCERY_STORES = ["Aldi", "Lidl", "Rewe", "Edeka", "Penny", "Netto", "Kaufland", "Norma", "Globus", "Tegut"];
const DRUGSTORES = ["dm", "Rossmann", "Müller"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().split('T')[0];

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { storeIndex = null, clearFirst = false } = body;

    // Optional: clear old entries before a full refresh
    if (clearFirst) {
      console.log("Clearing old PriceCatalog entries...");
      // We don't bulk delete here — the caller should manage that via entity API
    }

    const allStores = [...GROCERY_STORES, ...DRUGSTORES];
    const storesToRun = storeIndex !== null ? [allStores[storeIndex]].filter(Boolean) : allStores;

    const allResults = [];

    for (const store of storesToRun) {
      const isDrugstore = DRUGSTORES.includes(store);
      const items = isDrugstore
        ? [...COMPARISON_ITEMS.filter(i => !i.includes("Hähnchen") && !i.includes("Schnitzel") && !i.includes("Hackfleisch") && !i.includes("Lachs")).slice(0, 30), ...(STORE_EXTRAS[store] || [])]
        : COMPARISON_ITEMS;

      let priceData;
      try {
        priceData = await base44.integrations.Core.InvokeLLM({
          prompt: `Look up the current real 2025 German supermarket prices for the following items specifically at ${store} in Germany.

Items: ${items.join(', ')}.

For EACH item return:
- The real branded product name as sold at ${store} (e.g. "Milbona Vollmilch 3,5% 1L" for Lidl, "Ja! Vollmilch 3,5% 1L" for Rewe)
- Store: "${store}"
- The exact current unit price at ${store} in EUR (2024-2025 prices)
- The normal/regular price at a mid-range supermarket (Rewe or Edeka) for comparison
- The category in English: "Dairy", "Meat & Fish", "Bread & Bakery", "Grains & Pasta", "Vegetables", "Fruits", "Pantry", "Drinks", "Snacks", "Household", "Health & Beauty"
- The quantity/pack size (e.g. "1L", "500g", "10er")
- A comparison_key: the GENERIC item name used to match this item across stores (e.g. "Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g") — this must be identical for the same product type at different stores
- Basic calorie info if applicable (e.g. "~65 kcal/100ml")

Use real 2024-2025 prices. Only include items you are confident about. Skip items not sold at ${store}.`,
          add_context_from_internet: true,
          model: "gemini_3_flash",
          response_json_schema: {
            type: "object",
            properties: {
              products: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_name: { type: "string" },
                    store: { type: "string" },
                    category: { type: "string" },
                    unit_price: { type: "number" },
                    normal_price: { type: "number" },
                    quantity_description: { type: "string" },
                    comparison_key: { type: "string" },
                    calories_info: { type: "string" }
                  },
                  required: ["product_name", "store", "unit_price", "comparison_key"]
                }
              }
            }
          }
        });
      } catch (err) {
        console.error(`Failed to fetch prices for ${store}:`, err.message);
        continue;
      }

      const products = priceData?.products || [];
      if (products.length > 0) {
        try {
          const records = products.map(product => ({
            product_name: product.product_name,
            store: product.store || store,
            category: product.category || "Other",
            unit_price: product.unit_price,
            normal_price: product.normal_price,
            quantity_description: product.quantity_description || "",
            comparison_key: product.comparison_key || "",
            calories_info: product.calories_info || "",
            diet_tags: isDrugstore ? ["vegan", "balanced"] : ["balanced"],
            last_updated: today
          }));
          await base44.asServiceRole.entities.PriceCatalog.bulkCreate(records);
          records.forEach(r => allResults.push(`${r.store}: ${r.product_name}`));
          console.log(`${store}: inserted ${records.length} products`);
        } catch (err) {
          console.error(`Failed to bulk insert for ${store}:`, err.message);
        }
      }
    }

    return Response.json({
      updated: allResults.length,
      stores: storesToRun,
      products: allResults
    });
  } catch (error) {
    console.error("refreshPriceCatalog error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});