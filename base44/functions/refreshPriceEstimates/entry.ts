import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { callOpenRouter } from "../../shared/openrouter.ts";

// Daily price checker. Runs as a service role (no end user — invoked by the
// scheduled workflow). It finds the stalest (product, postal_code, store)
// groups in the PriceEstimate community database, asks the LLM (with web
// search) for current German prices, and stores fresh observations.
// Self-throttling: anything already refreshed today is skipped, so repeated
// calls do almost no work and cost stays bounded.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const today = new Date().toISOString().slice(0, 10);

    const recent = await svc.entities.PriceEstimate.list("-fetched_date", 500);

    // Latest observation per (product | plz | store).
    const latestBy = new Map();
    (recent || []).forEach((r) => {
      const key = `${(r.product_name || "").toLowerCase()}|${r.postal_code || ""}|${(r.store || "").toLowerCase()}`;
      const prev = latestBy.get(key);
      if (!prev || (r.fetched_date || "") > (prev.fetched_date || "")) {
        latestBy.set(key, r);
      }
    });

    // Candidates needing refresh: not already refreshed today, oldest first.
    const stale = [...latestBy.values()]
      .filter((r) => (r.fetched_date || "") < today)
      .sort((a, b) => (a.fetched_date || "").localeCompare(b.fetched_date || ""))
      .slice(0, 30);

    if (stale.length === 0) {
      return Response.json({ refreshed: 0, message: "All recent prices are fresh." });
    }

    const lines = stale.map((r, i) =>
      `${i + 1}. ${r.product_name} (qty: ${r.quantity || "n/a"}, store: ${r.store || "any"}, PLZ: ${r.postal_code || "national"})`
    );

    const prompt = `You are a German grocery price checker. For each product below, find its current 2025 price in Germany at the given store and region (postal code). Use real web data. Return JSON with an "items" array; each item has: name (product), store, postal_code, price (EUR number for the listed quantity), quantity, normal_price (typical regular price for the same quantity).

Products:
${lines.join("\n")}

Return only the JSON object.`;

    let res;
    try {
      res = await callOpenRouter({
        prompt,
        add_context_from_internet: true,
        model: "openai/gpt-4o-mini",
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  store: { type: "string" },
                  postal_code: { type: "string" },
                  price: { type: "number" },
                  quantity: { type: "string" },
                  normal_price: { type: "number" },
                },
              },
            },
          },
        },
      });
    } catch (llmErr) {
      console.warn("OpenRouter call failed in refreshPriceEstimates, falling back:", llmErr);
      res = await svc.integrations.Core.InvokeLLM({
        prompt,
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
                  store: { type: "string" },
                  postal_code: { type: "string" },
                  price: { type: "number" },
                  quantity: { type: "string" },
                  normal_price: { type: "number" },
                },
              },
            },
          },
        },
      });
    }

    const items = Array.isArray(res.items) ? res.items : [];
    const records = items
      .map((it) => ({
        product_name: it.name,
        postal_code: it.postal_code || "",
        store: it.store || "",
        price: typeof it.price === "number" ? it.price : null,
        quantity: it.quantity || "",
        normal_price: it.normal_price,
        currency: "eur",
        source: "ai-web-search-daily",
        fetched_date: today,
      }))
      .filter((r) => r.product_name && typeof r.price === "number");

    let created = 0;
    if (records.length) {
      await svc.entities.PriceEstimate.bulkCreate(records);
      created = records.length;
    }

    return Response.json({ refreshed: created, considered: stale.length });
  } catch (error) {
    console.error("refreshPriceEstimates error:", error?.message || error);
    return Response.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}