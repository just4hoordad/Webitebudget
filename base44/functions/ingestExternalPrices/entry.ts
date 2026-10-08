import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from "base44:runtime";

// Option 2: receiver for a commercial grocery-price feed (FoodDataScrape,
// Actowiz, Openpricengine, etc.). The provider POSTs a JSON batch of real
// shelf prices; we bulk-create PriceEstimate rows with source "external-feed".
//
// Security: authenticate via a shared secret passed in the FEED_API_KEY header.
// Set FEED_API_KEY as an app secret and share it with the provider. Without it
// (or with a mismatch), the request is rejected — anyone can reach the endpoint.
//
// Expected payload shape:
// {
//   "items": [
//     { "product_name": "...", "store": "REWE", "price": 1.19,
//       "normal_price": 1.49, "quantity": "1L", "postal_code": "10115" }
//   ]
// }

export default async function(req: Request): Promise<Response> {
  try {
    // Auth: shared secret header — no user session required (provider is a machine).
    const expectedKey = secrets.get("FEED_API_KEY");
    if (!expectedKey) {
      return Response.json({ error: "FEED_API_KEY secret not set" }, { status: 503 });
    }
    const providedKey = req.headers.get("x-feed-api-key");
    if (!providedKey || providedKey !== expectedKey) {
      return Response.json({ error: "Unauthorized: invalid or missing API key" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) {
      return Response.json({ error: "No items provided" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const records = items
      .map((it: any) => ({
        product_name: typeof it.product_name === "string" ? it.product_name.trim() : "",
        postal_code: typeof it.postal_code === "string" ? it.postal_code.trim() : "",
        store: typeof it.store === "string" ? it.store.trim() : "",
        price: typeof it.price === "number" ? it.price : null,
        unit_price: typeof it.unit_price === "number" ? it.unit_price : undefined,
        quantity: typeof it.quantity === "string" ? it.quantity : "",
        normal_price: typeof it.normal_price === "number" ? it.normal_price : undefined,
        currency: "eur",
        source: "external-feed",
        fetched_date: today,
      }))
      .filter((r: any) => r.product_name && typeof r.price === "number" && r.price > 0)
      .map((r: any) => {
        // drop undefined fields so we don't write explicit undefined
        const out: any = { ...r };
        if (out.unit_price === undefined) delete out.unit_price;
        if (out.normal_price === undefined) delete out.normal_price;
        return out;
      });

    if (!records.length) {
      return Response.json({ error: "No valid items after filtering" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.PriceEstimate.bulkCreate(records);

    return Response.json({
      status: "success",
      ingested: records.length,
      stores: [...new Set(records.map((r) => r.store))],
      date: today,
    });
  } catch (error: any) {
    console.error("ingestExternalPrices error:", error?.message || error);
    return Response.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}