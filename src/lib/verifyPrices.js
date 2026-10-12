import { base44 } from "@/api/base44Client";
import { sanitizePrices } from "@/lib/priceSanity";

// Looks up the current shelf price of every product on the store's own
// website (live web search) and only accepts prices backed by a source URL.
// Results are saved as verified prices, so each product is looked up at most
// once a week and every later list reuses the real price for free.
const FRESH_DAYS = 7;

const isFreshVerified = (ref) => ref && ref.source && ref.source !== "ai-web-search" &&
  (Date.now() - new Date(ref.fetched_date).getTime()) < FRESH_DAYS * 86400000;

export async function verifyPrices(result, known = new Map()) {
  const items = (result?.categories || []).flatMap((c) => c.items || []);
  const todo = items.filter((i) => !isFreshVerified(known.get(String(i.name).toLowerCase()))).slice(0, 40);
  if (!todo.length) return sanitizePrices(result, known);
  const res = await base44.integrations.Core.InvokeLLM({
    model: "gemini_3_flash",
    add_context_from_internet: true,
    prompt: `Look up the CURRENT regular shelf price (today, Germany) of each product below on the store's official website or a current price listing (e.g. aldi-sued.de, aldi-nord.de, lidl.de, shop.rewe.de, edeka24, kaufland.de, penny.de, netto-online.de).
Return the price of ONE pack in EUR and the URL where you found it. If you cannot find a real current listing, set found=false — never guess.

${todo.map((i) => `- ${i.name} @ ${i.store}`).join("\n")}`,
    response_json_schema: {
      type: "object",
      properties: {
        prices: { type: "array", items: { type: "object", properties: {
          name: { type: "string" }, found: { type: "boolean" },
          pack_price: { type: "number" }, source_url: { type: "string" },
        } } },
      },
    },
  }).catch(() => null);
  const today = new Date().toISOString().slice(0, 10);
  const records = [];
  (res?.prices || []).forEach((p) => {
    const item = todo.find((i) => i.name.toLowerCase() === String(p.name || "").toLowerCase());
    if (!item || !p.found || !(p.pack_price > 0) || !/^https?:\/\//.test(p.source_url || "")) return;
    const rec = { product_name: item.name, postal_code: "", store: item.store || "", price: p.pack_price,
      unit_price: p.pack_price, quantity: item.quantity || "", currency: "eur",
      source: `web-verified ${p.source_url}`.slice(0, 300), fetched_date: today };
    known.set(item.name.toLowerCase(), rec);
    records.push(rec);
  });
  if (records.length) base44.entities.PriceEstimate.bulkCreate(records).catch(() => {});
  const verified = sanitizePrices(result, known);
  verified.categories.forEach((c) => c.items.forEach((i) => {
    if (isFreshVerified(known.get(String(i.name).toLowerCase()))) i.price_verified = true;
  }));
  return verified;
}