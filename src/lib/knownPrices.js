import { base44 } from '@/api/base44Client';
import { priceKey } from '@/lib/priceReferences';

// One shared request per region/store selection, reused by both planner flows.
const requests = new Map();
const empty = () => ({ text: '', known: new Map() });

export function fetchKnownPrices(postalCode = '', stores = []) {
  const key = JSON.stringify([postalCode, [...stores].sort()]);
  const cached = requests.get(key);
  if (cached && Date.now() - cached.time < 300000) return cached.promise;
  const promise = loadPrices(postalCode, stores).catch(() => { requests.delete(key); return empty(); });
  requests.set(key, { time: Date.now(), promise });
  return promise;
}

async function loadPrices(postalCode, stores) {
  const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const query = { source: { $regex: '^catalog-verified https://' }, fetched_date: { $gte: since } };
  if (stores.length) {
    query.$or = stores.map((store) => ({ store: { $regex: `^${String(store).split(/[\s(]/)[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`, $options: 'i' } }));
  }
  const options = { sort: '-fetched_date', limit: 100 };
  const page = await base44.entities.PriceEstimate.filter(query, options);
  // Background upserts maintain one catalog entry per product/store.
  const references = page.items || [];
  const known = new Map(references.map((ref) => [priceKey(ref), ref]));
  const text = references.map((ref) => `- ${ref.product_name} — €${Number(ref.unit_price).toFixed(2)} per pack @ ${ref.store} (pack: ${ref.quantity}, checked: ${ref.fetched_date})`).join('\n');
  return { text, known };
}