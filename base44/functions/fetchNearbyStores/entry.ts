// Nearby-store lookup. Strategy: race Overpass (the only COMPLETE source — all
// chain stores within a radius) against a 6s clock; if it wins, return its full
// results. If it's slow or all mirrors are down, fall back to Photon (Komoot's
// OSM-backed geocoder — fast and reliable but a text search, so partial).
// Stores therefore always show up: complete when Overpass cooperates, partial
// but instant when it doesn't. Results are cached 6h for instant repeats.

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const PHOTON_URL = "https://photon.komoot.io/api";

// frontend chain id -> OSM brand/name fragment (Overpass)
const CHAIN_BRANDS: Record<string, string> = {
  aldi: "aldi", lidl: "lidl", rewe: "rewe", edeka: "edeka", penny: "penny",
  netto: "netto", kaufland: "kaufland", norma: "norma", globus: "globus",
  tegut: "tegut", dm: "dm", rossmann: "rossmann", müller: "müller|mueller",
};

// frontend chain id -> Photon text query
const CHAIN_QUERY: Record<string, string> = {
  aldi: "Aldi", lidl: "Lidl", rewe: "REWE", edeka: "Edeka", penny: "Penny",
  netto: "Netto", kaufland: "Kaufland", norma: "Norma", globus: "Globus",
  tegut: "tegut", dm: "dm", rossmann: "Rossmann", müller: "Müller Drogerie",
};

const SHOP_FILTER = `["shop"~"supermarket|chemist|drugstore|convenience"]`;
const PHOTON_SHOP_VALUES = new Set(["supermarket", "chemist", "drugstore", "convenience", "perfumery"]);
const OVERPASS_TIMEOUT_MS = 6000;
const PHOTON_TIMEOUT_MS = 6000;

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildOverpassQuery(lat: number, lng: number, radius: number, chains: string[] | null) {
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
  return `[out:json][timeout:25];(node${SHOP_FILTER}${brandF}${around};node${SHOP_FILTER}${nameF}${around};way${SHOP_FILTER}${brandF}${around};way${SHOP_FILTER}${nameF}${around};);out center;`;
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

// Race every Overpass mirror; return first 200's elements, cancelling the rest.
async function queryOverpass(query: string): Promise<any[] | null> {
  const controllers = OVERPASS_MIRRORS.map(() => new AbortController());
  const timeouts: any[] = [];
  const tasks = OVERPASS_MIRRORS.map(async (mirror, i) => {
    timeouts.push(setTimeout(() => controllers[i].abort(), 9000));
    const res = await fetch(mirror, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "BudgetBite/1.0 (meal planning app)" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controllers[i].signal,
    });
    if (!res.ok) throw new Error(`${mirror} ${res.status}`);
    const data = await res.json();
    return data.elements || [];
  });
  try {
    return await Promise.any(tasks);
  } catch {
    return null;
  } finally {
    timeouts.forEach(clearTimeout);
    controllers.forEach((c) => c.abort());
  }
}

async function queryChainPhoton(chainId: string, lat: number, lng: number, radius: number) {
  const q = CHAIN_QUERY[chainId];
  if (!q) return [];
  const url = `${PHOTON_URL}?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&location_bias_scale=0.8&limit=50`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PHOTON_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "BudgetBite/1.0 (meal planning app)" }, signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const out: any[] = [];
    for (const f of data.features || []) {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;
      if (p.osm_key !== "shop" || !PHOTON_SHOP_VALUES.has(p.osm_value)) continue;
      const sLat = coords[1];
      const sLng = coords[0];
      if (distanceMeters(lat, lng, sLat, sLng) > radius) continue;
      out.push({
        type: p.osm_type === "N" ? "node" : "way",
        id: p.osm_id,
        lat: sLat,
        lon: sLng,
        tags: {
          name: p.name || CHAIN_QUERY[chainId],
          brand: p.name || CHAIN_QUERY[chainId],
          shop: p.osm_value,
          "addr:street": p.street || "",
          "addr:housenumber": p.housenumber || "",
          "addr:city": p.city || "",
        },
      });
    }
    return out;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function queryPhoton(chains: string[], lat: number, lng: number, radius: number) {
  const results = await Promise.all(chains.map((c) => queryChainPhoton(c, lat, lng, radius)));
  return dedupe(results.flat());
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { ts: number; elements: any[] }>();

function cacheKey(lat: number, lng: number, radius: number, chains: string[] | null) {
  const c = (chains || ["all"]).slice().sort().join("|");
  return `${lat.toFixed(3)},${lng.toFixed(3)},${radius},${c}`;
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
    const validChains = (chainsArr || []).filter((c) => CHAIN_BRANDS[c]);

    const key = cacheKey(latNum, lngNum, safeRadius, chainsArr);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      console.log(`[fetchNearbyStores] cache hit (${hit.elements.length} stores)`);
      return Response.json({ elements: hit.elements });
    }

    // Start both sources in parallel.
    const overpassQuery = buildOverpassQuery(latNum, lngNum, safeRadius, chainsArr);
    const overpassPromise = queryOverpass(overpassQuery);
    const photonPromise = validChains.length ? queryPhoton(validChains, latNum, lngNum, safeRadius) : Promise.resolve([]);

    // Wait for Overpass up to OVERPASS_TIMEOUT_MS; if it resolves with data,
    // prefer it (complete). Otherwise fall back to Photon (partial).
    const overpassTimeout = new Promise<"__timeout__">((r) => setTimeout(() => r("__timeout__"), OVERPASS_TIMEOUT_MS));
    const overpassResult = await Promise.race([
      overpassPromise.then((e) => (e === null ? null : dedupe(e))),
      overpassTimeout,
    ]);

    let elements: any[];
    let source: string;
    if (Array.isArray(overpassResult) && overpassResult.length >= 0 && overpassResult !== null) {
      elements = overpassResult;
      source = "overpass";
    } else {
      elements = await photonPromise;
      source = "photon";
    }

    console.log(`[fetchNearbyStores] ${source} found ${elements.length} stores (chains: ${chainsArr?.join(",") || "all"})`);
    cache.set(key, { ts: Date.now(), elements });
    return Response.json({ elements });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});