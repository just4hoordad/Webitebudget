// Nearby-store lookup via Photon (Komoot's OSM-backed ElasticSearch geocoder).
// One parallel text search per selected chain, biased to the user's location,
// then distance-filtered. Same OpenStreetMap data as Overpass but ~10x faster
// and far more reliable than the flaky Overpass mirrors.

const PHOTON_URL = "https://photon.komoot.io/api";

const CHAIN_QUERY: Record<string, string> = {
  aldi: "Aldi",
  lidl: "Lidl",
  rewe: "REWE",
  edeka: "Edeka",
  penny: "Penny",
  netto: "Netto",
  kaufland: "Kaufland",
  norma: "Norma",
  globus: "Globus",
  tegut: "tegut",
  dm: "dm",
  rossmann: "Rossmann",
  müller: "Müller Drogerie",
};

const SHOP_VALUES = new Set(["supermarket", "chemist", "drugstore", "convenience", "perfumery"]);

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function queryChain(chainId: string, lat: number, lng: number, limit: number) {
  const q = CHAIN_QUERY[chainId];
  if (!q) return [];
  const url = `${PHOTON_URL}?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&location_bias_scale=0.8&limit=${limit}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BudgetBite/1.0 (meal planning app)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.log(`[fetchNearbyStores] photon ${chainId} returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.features || []) as any[];
  } catch (e) {
    console.log(`[fetchNearbyStores] photon ${chainId} failed: ${e.message}`);
    return [];
  }
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { ts: number; elements: any[] }>();

function cacheKey(lat: number, lng: number, radius: number, chains: string[]) {
  return `${lat.toFixed(3)},${lng.toFixed(3)},${radius},${chains.slice().sort().join("|")}`;
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
    const safeRadius = Math.min(Math.max(Math.round(radiusNum), 100), 10000);
    const chainsArr = Array.isArray(chains)
      ? chains.filter((c): c is string => typeof c === "string" && CHAIN_QUERY[c])
      : [];

    const key = cacheKey(latNum, lngNum, safeRadius, chainsArr);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      console.log(`[fetchNearbyStores] cache hit (${hit.elements.length} stores)`);
      return Response.json({ elements: hit.elements });
    }

    if (chainsArr.length === 0) {
      return Response.json({ elements: [] });
    }

    // Fire one Photon search per chain in parallel.
    const results = await Promise.all(chainsArr.map((c) => queryChain(c, latNum, lngNum, 50)));

    const seen = new Set<string>();
    const elements: any[] = [];
    for (let i = 0; i < chainsArr.length; i++) {
      const chainId = chainsArr[i];
      for (const f of results[i]) {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        // Only actual shops.
        if (p.osm_key !== "shop" || !SHOP_VALUES.has(p.osm_value)) continue;
        const sLat = coords[1];
        const sLng = coords[0];
        // Distance filter — Photon is location-biased, not radius-bounded.
        if (distanceMeters(latNum, lngNum, sLat, sLng) > safeRadius) continue;
        const idKey = `${p.osm_type}:${p.osm_id}`;
        if (seen.has(idKey)) continue;
        seen.add(idKey);
        elements.push({
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
    }

    console.log(`[fetchNearbyStores] photon found ${elements.length} stores (chains: ${chainsArr.join(",")})`);
    cache.set(key, { ts: Date.now(), elements });
    return Response.json({ elements });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});