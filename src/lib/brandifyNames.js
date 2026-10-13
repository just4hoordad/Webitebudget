// Replaces generic grocery item names (e.g. "Salami 100g") with the real
// branded product name from the per-chain brand catalog (e.g. "Chef Select
// Salami 100g" at Lidl), so every list item is the actual product sold at the
// store.
//
// The catalog is the static per-chain brand map (commonItemsByChain) exposed
// via the getBrandCatalog backend function — it does NOT depend on the
// source-verified price catalog (which requires live web scraping and is
// often empty). The dynamic `known` Map (verified prices) is merged in when
// available, so verified branded names still win.

const normalize = (s) => String(s || "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");

// Product keywords — brand words are intentionally kept (they're what make a
// name specific). Only pack sizes, units and punctuation are stripped.
function keywords(name) {
  return normalize(name)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l|mg|stk|st|st\u00fcck|pack|er|paar|rollen|beutel|x|\u00d7)\b/g, "")
    .replace(/[(),%&]/g, " ")
    .split(/[\s\-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w));
}

function addEntry(byStore, store, productName) {
  if (!store || !productName) return;
  const norm = normalize(productName);
  const kws = keywords(productName);
  if (!kws.length) return;
  if (!byStore.has(store)) byStore.set(store, []);
  byStore.get(store).push({ name: productName, norm, kws });
}

// Build the match index from two sources:
//  1. brandCatalog — static per-chain branded names: { Aldi: [{name, quantity}], ... }
//  2. known — dynamic Map of source-verified prices (product_name, store)
// Both contribute branded names; the static catalog is the reliable baseline.
function buildIndex(known, brandCatalog) {
  const byStore = new Map();
  if (brandCatalog && typeof brandCatalog === "object") {
    for (const [store, items] of Object.entries(brandCatalog)) {
      const storeKey = normalize(store).split(/[\s(]/)[0];
      if (!storeKey) continue;
      for (const it of items || []) addEntry(byStore, storeKey, it.name);
    }
  }
  if (known && typeof known.values === "function") {
    for (const ref of known.values()) {
      const store = normalize(ref.store).split(/[\s(]/)[0];
      addEntry(byStore, store, ref.product_name);
    }
  }
  return byStore;
}

function brandifyItem(item, index) {
  if (!item?.name) return item;
  const store = normalize(item.store).split(/[\s(]/)[0];
  const entries = index.get(store);
  if (!entries) return item;
  const itemNorm = normalize(item.name);
  const itemKws = keywords(item.name);
  if (!itemKws.length) return item;
  let best = null;
  for (const e of entries) {
    if (e.norm === itemNorm) return item; // already the exact branded product
    // The generic name must be the suffix of the branded name (brand prepended)
    // and every product keyword must appear in the branded product — this
    // prevents cross-product false matches (e.g. "Salami" → "Salami Pizza").
    if (e.norm.length <= itemNorm.length) continue;
    if (!e.norm.endsWith(itemNorm)) continue;
    if (!itemKws.every((k) => e.kws.includes(k))) continue;
    if (!best || e.norm.length < best.norm.length) best = e; // closest (least extra) match
  }
  return best ? { ...item, name: best.name } : item;
}

export function brandifyNames(result, known, brandCatalog) {
  if (!result?.categories) return result;
  const index = buildIndex(known, brandCatalog);
  if (!index.size) return result;
  const categories = result.categories.map((c) => ({
    ...c,
    items: (c.items || []).map((i) => {
      const branded = brandifyItem(i, index);
      if (branded.alternatives) branded.alternatives = branded.alternatives.map((a) => brandifyItem(a, index));
      return branded;
    }),
  }));
  return { ...result, categories };
}