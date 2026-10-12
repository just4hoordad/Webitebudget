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

export function knownPrice(item, known) {
  return known?.get(priceKey(item));
}