const OVERPASS_MIRRORS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// Map frontend chain ids to the brand/name fragments used in OSM tags.
const CHAIN_BRANDS: Record<string, string> = {
  aldi: "aldi",
  lidl: "lidl",
  rewe: "rewe",
  edeka: "edeka",
  penny: "penny",
  netto: "netto",
  kaufland: "kaufland",
  norma: "norma",
  globus: "globus",
  tegut: "tegut",
  dm: "dm",
  rossmann: "rossmann",
  müller: "müller|mueller",
};

const SHOP_FILTER = `["shop"~"supermarket|chemist|drugstore|convenience"]`;

function buildQuery(lat: number, lng: number, radius: number, chains: string[] | null) {
  const around = `(around:${radius},${lat},${lng})`;
  if (!chains || !chains.length) {
    return `[out:json][timeout:25];(node${SHOP_FILTER}${around};way${SHOP_FILTER}${around};);out center;`;
  }
  const parts = chains.map((c) => CHAIN_BRANDS[c]).filter(Boolean).join("|");
  if (!parts) {
    return `[out:json][timeout:25];(node${SHOP_FILTER}${around};way${SHOP_FILTER}${around};);out center;`;
  }
  const brandF = `["brand"~"${parts}",i]`;
  const nameF = `["name"~"${parts}",i]`;
  // Match stores that carry the chain in either their brand or name tag — many
  // OSM supermarkets have only a `name` (e.g. "Aldi") with no `brand`.
  return `[out:json][timeout:25];(node${SHOP_FILTER}${brandF}${around};node${SHOP_FILTER}${nameF}${around};way${SHOP_FILTER}${brandF}${around};way${SHOP_FILTER}${nameF}${around};);out center;`;
}

// Simple in-memory cache for warm instances — repeated lookups in the same
// area become instant instead of hitting Overpass again.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { ts: number; elements: any[] }>();

function cacheKey(lat: number, lng: number, radius: number, chains: string[] | null) {
  const c = (chains || ["all"]).slice().sort().join("|");
  return `${lat.toFixed(3)},${lng.toFixed(3)},${radius},${c}`;
}

function dedupe(elements: any[]) {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const el of elements) {
    const k = `${el.type}:${el.id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(el);
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const { lat, lng, radius = 1500, chains = null } = await req.json();

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radius);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || !Number.isFinite(radiusNum)) {
      return Response.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return Response.json({ error: "Coordinates out of range" }, { status: 400 });
    }
    const safeRadius = Math.min(Math.max(Math.round(radiusNum), 100), 50000);
    const chainsArr = Array.isArray(chains) ? chains.filter((c): c is string => typeof c === "string") : null;

    const key = cacheKey(latNum, lngNum, safeRadius, chainsArr);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      console.log(`[fetchNearbyStores] cache hit (${hit.elements.length} stores)`);
      return Response.json({ elements: hit.elements });
    }

    const query = buildQuery(latNum, lngNum, safeRadius, chainsArr);

    let lastError: string | null = null;
    for (const mirror of OVERPASS_MIRRORS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);
        const res = await fetch(mirror, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "BudgetBite/1.0 (meal planning app)",
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
          lastError = `mirror ${mirror} returned ${res.status}`;
          console.log(`[fetchNearbyStores] ${lastError}, trying next`);
          continue;
        }
        const data = await res.json();
        const elements = dedupe(data.elements || []);
        console.log(`[fetchNearbyStores] ${mirror} found ${elements.length} stores (chains: ${chainsArr?.join(",") || "all"})`);
        cache.set(key, { ts: Date.now(), elements });
        return Response.json({ elements });
      } catch (e) {
        lastError = `mirror ${mirror} failed: ${e.message}`;
        console.log(`[fetchNearbyStores] ${lastError}, trying next`);
      }
    }

    return Response.json({ error: lastError || "All Overpass mirrors failed", elements: [] }, { status: 502 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});