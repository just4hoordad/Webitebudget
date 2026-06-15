import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const STORES = ["aldi", "lidl", "rewe", "edeka", "penny", "netto", "kaufland"];

const CATEGORIES = [
  "Dairy", "Vegetables", "Fruit", "Meat", "Fish", "Bread & Bakery",
  "Grains & Pasta", "Snacks", "Beverages", "Frozen Foods",
  "Condiments & Sauces", "Oils & Fats", "Legumes", "Eggs",
  "Sweets & Chocolate", "Canned Goods"
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both scheduled (service role) and manual admin calls
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch {
      // No user = called from scheduler, treat as authorized
      isAdmin = true;
    }

    if (!isAdmin) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[syncStorePrices] Starting daily price sync...');

    const syncedAt = new Date().toISOString();
    let totalSynced = 0;
    let totalFailed = 0;

    for (const store of STORES) {
      for (const category of CATEGORIES) {
        try {
          console.log(`[syncStorePrices] Fetching ${category} @ ${store}...`);

          const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `List the 5 most commonly bought grocery items in the "${category}" category available at ${store} in Germany.

For each item, provide:
- The EXACT branded product name as sold in the store (e.g. "Ja! Vollmilch 3,5% 1L", "Milbona Naturjoghurt 500g")
- The current unit price in EUR at ${store} (use real 2024-2025 German supermarket prices)
- The typical price for the same quantity at a mid-range supermarket (Rewe or Edeka)
- Unit/size (e.g. "1L", "500g", "10er pack")
- Brief calorie info (e.g. "~150 kcal/100g")
- Which diet types it suits: choose any from ["vegan", "vegetarian", "balanced", "high-protein", "low-carb", "keto", "frozen", "half-cooked"]

Use ONLY real products that are actually sold at ${store} in Germany.`,
            add_context_from_internet: true,
            model: "gemini_3_flash",
            response_json_schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "number" },
                      normal_price: { type: "number" },
                      unit: { type: "string" },
                      calories_info: { type: "string" },
                      diet_tags: { type: "array", items: { type: "string" } }
                    }
                  }
                }
              }
            }
          });

          const items = result?.items || [];

          for (const item of items) {
            if (!item.name || !item.price) continue;

            // Check if this product already exists in DB
            const existing = await base44.asServiceRole.entities.ProductPrice.filter({
              name: item.name,
              store: store
            });

            if (existing.length > 0) {
              // Update existing record
              await base44.asServiceRole.entities.ProductPrice.update(existing[0].id, {
                price: item.price,
                normal_price: item.normal_price,
                unit: item.unit,
                calories_info: item.calories_info,
                diet_tags: item.diet_tags || [],
                last_synced: syncedAt
              });
            } else {
              // Create new record
              await base44.asServiceRole.entities.ProductPrice.create({
                name: item.name,
                category: category,
                store: store,
                price: item.price,
                normal_price: item.normal_price,
                unit: item.unit,
                calories_info: item.calories_info,
                diet_tags: item.diet_tags || [],
                last_synced: syncedAt
              });
            }
            totalSynced++;
          }

        } catch (err) {
          console.error(`[syncStorePrices] Failed for ${category} @ ${store}: ${err.message}`);
          totalFailed++;
        }
      }
    }

    console.log(`[syncStorePrices] Done. Synced: ${totalSynced}, Failed: ${totalFailed}`);
    return Response.json({
      success: true,
      synced: totalSynced,
      failed: totalFailed,
      synced_at: syncedAt
    });

  } catch (error) {
    console.error('[syncStorePrices] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});