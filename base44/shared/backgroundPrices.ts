import { verifyPriceEvidence } from './priceEvidence.ts';

const STORES = ['Aldi', 'Lidl', 'REWE', 'Edeka', 'Kaufland', 'Penny', 'Netto', 'Norma', 'dm', 'Rossmann', 'tegut'];
const productKey = (name, store) => `${store}|${String(name).trim().toLowerCase()}`;

export async function refreshBackgroundPrices(base44, { previewOnly = false, limit = 40 } = {}) {
  const svc = base44.asServiceRole;
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
  const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [popular, fresh] = await Promise.all([
    svc.entities.PriceEstimate.aggregate({ query: { postal_code: '', store: { $in: STORES } }, groupBy: ['store', 'product_name'], sort: '-count', limit: 200 }),
    svc.entities.PriceEstimate.aggregate({ query: { source: { $regex: '^catalog-verified https://' }, postal_code: '', fetched_date: { $gte: since } }, groupBy: ['store', 'product_name'], limit: 1000 }),
  ]);
  const ready = new Set(fresh.rows.map((row) => productKey(row.product_name, row.store)));
  const queues = new Map(STORES.map((store) => [store, []]));
  for (const row of popular.rows) {
    if (row.product_name && !ready.has(productKey(row.product_name, row.store))) queues.get(row.store)?.push({ name: row.product_name, store: row.store });
  }
  const candidates = [];
  const max = Math.min(40, Math.max(1, Number(limit) || 40));
  while (candidates.length < max) {
    let added = false;
    for (const store of STORES) {
      const item = queues.get(store).shift();
      if (item) { candidates.push({ ...item, request_id: String(candidates.length) }); added = true; }
      if (candidates.length >= max) break;
    }
    if (!added) break;
  }
  if (previewOnly || !candidates.length) return { status: previewOnly ? 'preview' : 'already_fresh', candidates: candidates.length, products: candidates.slice(0, 10), refreshed: 0 };
  const result = await svc.integrations.Core.InvokeLLM({
    add_context_from_internet: true,
    prompt: `Prepare a reusable German supermarket price catalogue. Today is ${today}. For each requested product, find the current price of ONE retail pack on that retailer's official product page. Match the exact brand and pack size; do not substitute a different product. Provide the exact branded product name, pack size, official HTTPS URL and a short verbatim quotation containing the product and EUR price. If no current source is accessible, found=false. Never invent prices or source URLs. Do not infer regional prices. Preserve request_id.\n${candidates.map((item) => `${item.request_id}: ${item.name} @ ${item.store}`).join('\n')}`,
    response_json_schema: { type: 'object', properties: { prices: { type: 'array', items: { type: 'object', properties: {
      request_id: { type: 'string' }, found: { type: 'boolean' }, name: { type: 'string' }, pack_size: { type: 'string' }, pack_price: { type: 'number' }, source_url: { type: 'string' }, evidence: { type: 'string' },
    }, required: ['request_id', 'found'] } } }, required: ['prices'] },
  });
  const records = [];
  const seen = new Set();
  const prices = result.prices || [];
  // Check at most six retailer pages at once. This never runs on a user's list request.
  for (let start = 0; start < prices.length; start += 6) {
    const checked = await Promise.all(prices.slice(start, start + 6).map(async (price) => {
      const request = candidates.find((item) => item.request_id === price.request_id);
      if (!request || !price.found || !price.name || !price.pack_size || !(Number(price.pack_price) > 0) || !Number.isFinite(Number(price.pack_price)) || price.pack_price > 100) return null;
      const productWords = request.name.normalize('NFKC').toLowerCase().match(/[\p{L}]{3,}/gu) || [];
      const foundName = String(price.name).normalize('NFKC').toLowerCase();
      const expectedPack = request.name.toLowerCase().match(/\d+(?:[.,]\d+)?\s*(?:kg|ml|g|l)\b/);
      if (!productWords.every((word) => foundName.includes(word))) return null;
      if (expectedPack && expectedPack[0].replace(/\s/g, '') !== String(price.pack_size).toLowerCase().replace(/\s/g, '')) return null;
      if (!(await verifyPriceEvidence(price, request.store))) return null;
      return { product_name: request.name, postal_code: '', store: request.store, price: Number(price.pack_price), unit_price: Number(price.pack_price), quantity: `1 × ${price.pack_size}`, currency: 'eur', source: `catalog-verified ${price.source_url}`, fetched_date: today };
    }));
    for (const record of checked) {
      if (record && !seen.has(productKey(record.product_name, record.store))) { records.push(record); seen.add(productKey(record.product_name, record.store)); }
    }
  }
  if (records.length) await svc.entities.PriceEstimate.upsert(records, { key: ['product_name', 'store', 'postal_code'] });
  console.log(`Background prices: ${candidates.length} requested, ${records.length} source-confirmed.`);
  return { status: 'success', checked: candidates.length, refreshed: records.length, date: today };
}