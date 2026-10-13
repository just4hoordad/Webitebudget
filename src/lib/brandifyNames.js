// Replaces generic grocery item names (e.g. "Salami 100g") with the real
// branded product name from the source-verified price catalog (e.g. "Dulano
// Salami 100g"), so every list item is the actual product sold at the store.
//
// The catalog is built from commonItemsByChain, which seeds each chain's 100
// most common items with that chain's real house-brand names. When the AI
// returns a generic descriptor, this matches it to the branded catalog entry
// for the same store and swaps in the real name.

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

function buildIndex(known) {
  const byStore = new Map();
  if (!known || typeof known.values !== "function") return byStore;
  for (const ref of known.values()) {
    const store = normalize(ref.store).split(/[\s(]/)[0];
    if (!store) continue;
    const norm = normalize(ref.product_name);
    const kws = keywords(ref.product_name);
    if (!kws.length) continue;
    if (!byStore.has(store)) byStore.set(store, []);
    byStore.get(store).push({ name: ref.product_name, norm, kws });
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

export function brandifyNames(result, known) {
  if (!result?.categories || !known?.size) return result;
  const index = buildIndex(known);
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