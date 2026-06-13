import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Each batch focuses on ONE store with its key products
// This ensures full coverage across ALL 13 stores
const STORE_BATCHES = [
  {
    store: "Aldi",
    diet: "balanced",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Butter 250g", "Naturjoghurt 500g", "Toastbrot 750g", "Kartoffeln 2kg", "Bananen 1kg", "Äpfel 1kg", "Gouda 400g", "Olivenöl 750ml"]
  },
  {
    store: "Lidl",
    diet: "balanced",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Butter 250g", "Naturjoghurt 500g", "Toastbrot 750g", "Kartoffeln 2kg", "Bananen 1kg", "Äpfel 1kg", "Gouda 400g", "Olivenöl 750ml"]
  },
  {
    store: "Rewe",
    diet: "balanced",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Butter 250g", "Naturjoghurt 500g", "Toastbrot 750g", "Kartoffeln 2kg", "Bananen 1kg", "Äpfel 1kg", "Gouda 400g", "Olivenöl 750ml"]
  },
  {
    store: "Edeka",
    diet: "balanced",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Butter 250g", "Naturjoghurt 500g", "Toastbrot 750g", "Kartoffeln 2kg", "Bananen 1kg", "Äpfel 1kg", "Gouda 400g", "Olivenöl 750ml"]
  },
  {
    store: "Penny",
    diet: "balanced",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Butter 250g", "Naturjoghurt 500g", "Toastbrot 750g", "Kartoffeln 2kg", "Bananen 1kg", "Äpfel 1kg", "Gouda 400g", "Olivenöl 750ml"]
  },
  {
    store: "Netto",
    diet: "balanced",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Butter 250g", "Naturjoghurt 500g", "Toastbrot 750g", "Kartoffeln 2kg", "Bananen 1kg", "Äpfel 1kg", "Gouda 400g", "Olivenöl 750ml"]
  },
  {
    store: "Kaufland",
    diet: "balanced",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Butter 250g", "Naturjoghurt 500g", "Toastbrot 750g", "Kartoffeln 2kg", "Bananen 1kg", "Äpfel 1kg", "Gouda 400g", "Olivenöl 750ml"]
  },
  {
    store: "Norma",
    diet: "balanced",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Butter 250g", "Naturjoghurt 500g", "Toastbrot 750g", "Kartoffeln 2kg", "Bananen 1kg", "Äpfel 1kg", "Gouda 400g", "Olivenöl 750ml"]
  },
  {
    store: "Globus",
    diet: "balanced",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Butter 250g", "Naturjoghurt 500g", "Toastbrot 750g", "Kartoffeln 2kg", "Bananen 1kg", "Äpfel 1kg", "Gouda 400g", "Olivenöl 750ml"]
  },
  {
    store: "Tegut",
    diet: "balanced",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Butter 250g", "Naturjoghurt 500g", "Toastbrot 750g", "Kartoffeln 2kg", "Bananen 1kg", "Äpfel 1kg", "Gouda 400g", "Olivenöl 750ml"]
  },
  {
    store: "dm",
    diet: "vegan",
    items: ["Hafermilch 1L", "Sojadrink 1L", "Mandeldrink 1L", "Sojajoghurt 400g", "Cashews 150g", "Mandeln 200g", "Erdnussbutter 500g", "Protein Riegel", "Multivitamin Tabletten", "Haferflocken 500g", "Quinoa 400g", "Whey Protein 750g"]
  },
  {
    store: "Rossmann",
    diet: "vegan",
    items: ["Hafermilch 1L", "Sojadrink 1L", "Mandeldrink 1L", "Sojajoghurt 400g", "Cashews 150g", "Mandeln 200g", "Erdnussbutter 500g", "Protein Riegel", "Haferflocken 500g", "Chiasamen 200g", "Leinsamen 400g", "Vitamin C Tabletten"]
  },
  {
    store: "Müller",
    diet: "balanced",
    items: ["Hafermilch 1L", "Sojadrink 1L", "Naturjoghurt 500g", "Müsli 500g", "Nussmischung 200g", "Schokolade 100g", "Kaffee 500g", "Tee 20er", "Mineralwasser 6x1.5L", "Orangensaft 1L", "Protein Shake Pulver 750g", "Haferflocken 500g"]
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().split('T')[0];

    // Parse optional batch index from request body (for chunked execution)
    let body = {};
    try { body = await req.json(); } catch (_) {}
    const batchIndex = body.batchIndex ?? null;

    // If batchIndex provided, run only that single store batch
    const batchesToRun = batchIndex !== null
      ? [STORE_BATCHES[batchIndex]].filter(Boolean)
      : STORE_BATCHES;

    const allResults = [];

    for (const batch of batchesToRun) {
      let priceData;
      try {
        priceData = await base44.integrations.Core.InvokeLLM({
          prompt: `Look up the current real 2025 German supermarket prices for the following items specifically at ${batch.store} supermarket in Germany.
Items: ${batch.items.join(', ')}.
For EACH item return:
- The real branded product name as sold at ${batch.store} (e.g. "Ja! Vollmilch 3,5% 1L" for Rewe, "Milbona Vollmilch 3,5% 1L" for Lidl)
- Store: "${batch.store}"
- The exact unit price at ${batch.store} in EUR
- The normal/regular price at Rewe or Edeka for comparison
- The category in English (e.g. "Dairy", "Vegetables", "Meat", "Bread & Bakery", "Snacks")
- The quantity description (e.g. "1L", "500g", "10er")
- Basic calorie info (e.g. "~65 kcal/100ml")
Use real 2024-2025 prices. Only include items you are confident about.`,
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
                    calories_info: { type: "string" }
                  }
                }
              }
            }
          }
        });
      } catch (err) {
        console.error(`Failed to fetch prices for ${batch.store}:`, err.message);
        continue;
      }

      const products = priceData?.products || [];
      if (products.length > 0) {
        try {
          const records = products.map(product => ({
            ...product,
            store: product.store || batch.store,
            diet_tags: [batch.diet, "balanced"],
            last_updated: today
          }));
          await base44.asServiceRole.entities.PriceCatalog.bulkCreate(records);
          records.forEach(r => allResults.push(`${r.store}: ${r.product_name}`));
        } catch (err) {
          console.error(`Failed to bulk insert for ${batch.store}:`, err.message);
        }
      }
    }

    console.log(`refreshPriceCatalog done: ${allResults.length} products upserted`);
    return Response.json({
      updated: allResults.length,
      totalBatches: STORE_BATCHES.length,
      products: allResults
    });
  } catch (error) {
    console.error("refreshPriceCatalog error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});