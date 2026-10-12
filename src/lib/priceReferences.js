const normalize = (value) => String(value || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');

export function priceKey(item) {
  const store = normalize(item.store).split(/[\s(]/)[0];
  return `${store}|${normalize(item.product_name || item.name)}`;
}

export function isFreshVerifiedPrice(ref) {
  const fetched = new Date(ref?.fetched_date || '').getTime();
  return Boolean(ref && /^catalog-verified https:\/\//.test(ref.source || '') &&
    Number(ref.unit_price) > 0 && fetched <= Date.now() && Date.now() - fetched < 7 * 86400000);
}

function packSize(quantity) {
  const match = String(quantity || '').toLowerCase().replace(/\s+/g, '').match(/(\d+(?:[.,]\d+)?)(kg|ml|g|l)(?:$|\b)/);
  if (!match) return null;
  const amount = Number(match[1].replace(',', '.'));
  return `${amount * (match[2] === 'kg' || match[2] === 'l' ? 1000 : 1)}${match[2] === 'l' || match[2] === 'ml' ? 'ml' : 'g'}`;
}

export function knownPrice(item, known) {
  const ref = known?.get(priceKey(item));
  const expected = packSize(ref?.quantity);
  const actual = packSize(item.quantity);
  return expected && actual !== expected ? null : ref;
}