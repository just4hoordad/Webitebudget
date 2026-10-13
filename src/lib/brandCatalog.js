import { base44 } from "@/api/base44Client";

// Static per-chain branded product catalog, fetched once and cached for a day.
// This is the reliable source of house-brand product names (e.g. "Chef Select
// Salami 100g" at Lidl) used to brandify generic grocery item names. It does
// not depend on the source-verified price catalog, which requires live web
// scraping and is often empty.
let cache = null;
let cacheTime = 0;
const TTL = 24 * 60 * 60 * 1000;

export async function fetchBrandCatalog() {
  if (cache && Date.now() - cacheTime < TTL) return cache;
  try {
    const res = await base44.functions.invoke("getBrandCatalog", {});
    const catalog = res?.data?.catalog || {};
    if (cache || Object.keys(catalog).length) { cache = catalog; cacheTime = Date.now(); }
    return catalog;
  } catch {
    return cache || {};
  }
}