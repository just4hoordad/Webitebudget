const STORE_DOMAINS = {
  Aldi: ['aldi-sued.de', 'aldi-nord.de'], Lidl: ['lidl.de'], REWE: ['rewe.de'],
  Edeka: ['edeka.de', 'edeka24.de'], Kaufland: ['kaufland.de'], Penny: ['penny.de'],
  Netto: ['netto-online.de'], Norma: ['norma-online.de', 'norma24.de'],
  dm: ['dm.de'], Rossmann: ['rossmann.de'], tegut: ['tegut.com'],
};
const normalize = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
const plainText = (html) => normalize(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;|&#34;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&euro;|&#8364;/g, '€'));

export function officialPriceUrl(url, store) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.port &&
      (STORE_DOMAINS[store] || []).some((domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
  } catch { return false; }
}

function productEvidence(node, price) {
  if (!node || typeof node !== 'object') return false;
  if (Array.isArray(node)) return node.some((value) => productEvidence(value, price));
  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  if (types.includes('Product')) {
    const name = normalize(node.name);
    const expected = normalize(price.name);
    const offers = Array.isArray(node.offers) ? node.offers : [node.offers];
    if (name && (name.includes(expected) || expected.includes(name)) && offers.some((offer) => offer && offer.priceCurrency === 'EUR' && Math.abs(Number(String(offer.price).replace(',', '.')) - price.pack_price) < 0.005)) return true;
  }
  return Object.values(node).some((value) => value && typeof value === 'object' && productEvidence(value, price));
}

export async function verifyPriceEvidence(price, store) {
  if (!officialPriceUrl(price.source_url, store)) return false;
  try {
    // No follow-up to a redirect outside the selected retailer.
    const response = await fetch(price.source_url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!response.ok) return false;
    const html = await response.text();
    const quote = normalize(price.evidence);
    const quoteHasPrice = /€|eur/i.test(quote) && new RegExp(`(?:^|[^\\d])${Number(price.pack_price).toFixed(2).replace('.', '[.,]')}(?:[^\\d]|$)`).test(quote);
    const nameWords = normalize(price.name).split(/\W+/).filter((word) => word.length >= 4);
    const quoteHasProduct = nameWords.length > 0 && nameWords.slice(0, 3).every((word) => quote.includes(word));
    if (quote.length >= 12 && quoteHasPrice && quoteHasProduct && plainText(html).includes(quote)) return true;
    for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try { if (productEvidence(JSON.parse(match[1]), price)) return true; } catch { /* Ignore unrelated malformed metadata. */ }
    }
    return false;
  } catch { return false; }
}