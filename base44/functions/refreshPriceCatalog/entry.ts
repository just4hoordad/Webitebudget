import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Common German supermarket products to keep prices fresh
const PRODUCT_BATCHES = [
  {
    diet: "balanced",
    stores: "aldi,lidl",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust", "Reis 1kg", "Nudeln 500g", "Tomaten", "Karotten", "Zwiebeln", "Bananen", "Äpfel", "Joghurt 500g", "Käse 400g", "Brot 750g", "Butter 250g", "Olivenöl 750ml"]
  },
  {
    diet: "vegan",
    stores: "aldi,lidl",
    items: ["Hafermilch 1L", "Tofu 400g", "Linsen 500g", "Kichererbsen Dose", "Sojajoghurt 400g", "Nüsse 200g", "Avocado", "Spinat 250g", "Süßkartoffeln 1kg", "Hummus 200g"]
  },
  {
    diet: "keto",
    stores: "aldi,lidl",
    items: ["Lachs 300g", "Rinderhack 500g", "Bacon 150g", "Brokkoli 500g", "Blumenkohl 600g", "Sahne 200ml", "Cheddar 200g", "Mandeln 200g", "Eier 10er", "Avocado"]
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const results = [];
    const today = new Date().toISOString().split('T')[0];

    for (const batch of PRODUCT_BATCHES) {
      const priceData = await base44.integrations.Core.InvokeLLM({
        prompt: `Look up the current real 2025 German supermarket prices for the following items at ${batch.stores}.
Items: ${batch.items.join(', ')}.
For each item return the real branded product name as sold in-store, the cheapest store, exact unit price, and the normal price at a mid-range supermarket (Rewe/Edeka).
Only include items you are confident about the price for.`,
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

      for (const product of (priceData.products || [])) {
        // Check if product already exists
        const existing = await base44.asServiceRole.entities.PriceCatalog.filter({ product_name: product.product_name });

        const record = {
          ...product,
          diet_tags: [batch.diet, "balanced"],
          last_updated: today
        };

        if (existing && existing.length > 0) {
          await base44.asServiceRole.entities.PriceCatalog.update(existing[0].id, record);
        } else {
          await base44.asServiceRole.entities.PriceCatalog.create(record);
        }
        results.push(product.product_name);
      }
    }

    return Response.json({ updated: results.length, products: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});