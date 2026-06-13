import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// All supported stores from the app
const ALL_STORES = ["aldi", "lidl", "rewe", "edeka", "penny", "netto", "kaufland", "norma", "globus", "tegut", "dm", "rossmann", "müller"];

// Product batches per diet, covering all stores
const PRODUCT_BATCHES = [
  {
    diet: "balanced",
    stores: "aldi, lidl, rewe, edeka, penny, netto, kaufland",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Karotten 1kg", "Zwiebeln 1kg", "Bananen 1kg", "Äpfel 1kg", "Naturjoghurt 500g", "Gouda Käse 400g", "Toastbrot 750g", "Butter 250g", "Olivenöl 750ml", "Kartoffeln 2kg", "Gurke", "Paprika 3er"]
  },
  {
    diet: "vegan",
    stores: "aldi, lidl, rewe, edeka, dm, rossmann",
    items: ["Hafermilch 1L", "Tofu 400g", "Rote Linsen 500g", "Kichererbsen Dose 400g", "Sojajoghurt 400g", "Mandeln 200g", "Avocado", "Babyspinat 250g", "Süßkartoffeln 1kg", "Hummus 200g", "Sojadrink 1L", "Tempeh 200g", "Cashews 150g", "Kokosmilch Dose 400ml"]
  },
  {
    diet: "high-protein",
    stores: "aldi, lidl, rewe, edeka, kaufland, dm, rossmann",
    items: ["Hähnchenbrust 1kg", "Magerquark 500g", "Eier 10er", "Thunfisch Dose 150g", "Lachs 300g", "Rinderhack 500g", "Skyr 500g", "Whey Protein 1kg", "Hüttenkäse 200g", "Kidneybohnen Dose 400g", "Linsen Dose 400g", "Erdnussbutter 500g"]
  },
  {
    diet: "vegetarian",
    stores: "aldi, lidl, rewe, edeka, penny, netto",
    items: ["Eier 10er", "Mozzarella 125g", "Ricotta 250g", "Feta 200g", "Vollmilch 1L", "Naturjoghurt 500g", "Quark 500g", "Champignons 500g", "Zucchini", "Aubergine", "Brokkoli 500g", "Blumenkohl 600g", "Linsen 500g", "Kichererbsen 500g"]
  },
  {
    diet: "keto",
    stores: "aldi, lidl, rewe, edeka, kaufland, norma",
    items: ["Lachs 300g", "Rinderhack 500g", "Bacon 150g", "Brokkoli 500g", "Blumenkohl 600g", "Sahne 200ml", "Cheddar 200g", "Mandeln 200g", "Eier 10er", "Avocado", "Butter 250g", "Olivenöl 750ml", "Hähnchenschenkel 1kg", "Speck 200g", "Walnüsse 200g"]
  },
  {
    diet: "pescatarian",
    stores: "aldi, lidl, rewe, edeka, kaufland",
    items: ["Lachs 300g", "Thunfisch Dose 150g", "Garnelen 300g", "Kabeljau 400g", "Makrele Dose 125g", "Eier 10er", "Naturjoghurt 500g", "Reis 1kg", "Nudeln 500g", "Brokkoli 500g", "Tomaten 1kg", "Zitrone", "Olivenöl 750ml"]
  },
  {
    diet: "gluten-free",
    stores: "aldi, lidl, rewe, edeka, dm, rossmann, müller",
    items: ["Reisnudeln 400g", "Maismehl 500g", "Kartoffeln 2kg", "Quinoa 500g", "Buchweizen 500g", "Reismehl 500g", "Hähnchenbrust 500g", "Eier 10er", "Naturjoghurt 500g", "Brokkoli 500g", "Karotten 1kg", "Äpfel 1kg", "Olivenöl 750ml"]
  },
  {
    diet: "halal",
    stores: "rewe, edeka, kaufland, netto, penny",
    items: ["Halal Hähnchenbrust 500g", "Halal Rinderhack 500g", "Halal Lamm 500g", "Eier 10er", "Vollmilch 1L", "Reis 1kg", "Nudeln 500g", "Tomaten 1kg", "Zwiebeln 1kg", "Karotten 1kg", "Olivenöl 750ml", "Joghurt 500g"]
  },
  {
    diet: "balanced",
    stores: "norma, globus, tegut, dm, rossmann, müller",
    items: ["Vollmilch 1L", "Eier 10er", "Hähnchenbrust 500g", "Joghurt 500g", "Käse 400g", "Brot 750g", "Butter 250g", "Reis 1kg", "Nudeln 500g", "Bananen 1kg", "Äpfel 1kg", "Tomaten 1kg", "Karotten 1kg", "Kartoffeln 2kg"]
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const results = [];
    const today = new Date().toISOString().split('T')[0];

    for (const batch of PRODUCT_BATCHES) {
      let priceData;
      try {
        priceData = await base44.integrations.Core.InvokeLLM({
          prompt: `Look up the current real 2025 German supermarket prices for the following items at these stores: ${batch.stores}.
Items: ${batch.items.join(', ')}.
For each item, return:
- The real branded product name as sold in-store (e.g. "Ja! Vollmilch 3,5% 1L", "Milbona Naturjoghurt 500g")
- The cheapest store from the list above
- The exact unit price at that store in EUR
- The normal/regular price at a mid-range supermarket (Rewe or Edeka) for the same quantity
- The category in English (e.g. "Dairy", "Vegetables", "Meat", "Bread & Bakery")
- The quantity description (e.g. "1L", "500g", "10er")
- Basic calorie info (e.g. "~65 kcal/100ml")
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
      } catch (err) {
        console.error(`Failed to fetch prices for batch (${batch.diet} / ${batch.stores}):`, err.message);
        continue;
      }

      for (const product of (priceData?.products || [])) {
        try {
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
        } catch (err) {
          console.error(`Failed to upsert product ${product.product_name}:`, err.message);
        }
      }
    }

    return Response.json({ updated: results.length, products: results });
  } catch (error) {
    console.error("refreshPriceCatalog error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});