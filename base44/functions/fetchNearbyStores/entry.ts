// Nearby-store lookup via Photon (Komoot's OSM-backed geocoder).
//
// Previously this raced Overpass against Photon, but every Overpass mirror
// became chronically slow/unreachable (hangs >90s, returns 0 elements on
// every recorded run), and firing 4 dead Overpass requests alongside the 13
// Photon chain-queries contended for connections — so Photon came back
// partial and chains like tegut simply never surfaced. Photon alone,
// queried per chain in parallel, reliably returns all nearby stores
// (verified: 23 stores incl. 6 tegut within 3km of Fulda). Results are
// cached 6h for instant repeats.

const PHOTON_URL = "https://photon.komoot.io/api";

// frontend chain id -> Photon text query
const CHAIN_QUERY: Record<string, string> = {
  aldi: "Aldi", lidl: "Lidl", rewe: "REWE", edeka: "Edeka", penny: "Penny",
  netto: "Netto", kaufland: "Kaufland", norma: "Norma", globus: "Globus",
  tegut: "tegut", dm: "dm", rossmann: "Rossmann", müller: "Müller Drogerie",
};

// OSM shop values that count as grocery/drugstore chains. "beverages" catches
// sub-formats like tegut Getränkemarkt; "frozen_food" catches frozen-only
// discounters; "perfumery"/"chemist"/"drugstore" cover dm/Rossmann/Müller.
const PHOTON_SHOP_VALUES = new Set([
  "supermarket", "chemist", "drugstore", "convenience", "perfumery",
  "beverages", "frozen_food",
]);
const PHOTON_TIMEOUT_MS = 8000;

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

async function queryChainPhoton(chainId: string, lat: number, lng: number, radius: number) {
  const q = CHAIN_QUERY[chainId];
  if (!q) return [];
  const url = `${PHOTON_URL}?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&location_bias_scale=0.8&limit=50`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PHOTON_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "BudgetBite/1.0 (meal planning app)" }, signal: controller.signal });
    if (!res.ok) return null;
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
          name: p.name || q,
          brand: p.name || q,
          shop: p.osm_value,
          "addr:street": p.street || "",
          "addr:housenumber": p.housenumber || "",
          "addr:city": p.city || "",
        },
      });
    }
    return out;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Photon throttles bursts, so 13 parallel requests silently dropped chains
// (e.g. tegut). Query in small batches and retry failed chains once.
async function queryPhoton(chains: string[], lat: number, lng: number, radius: number) {
  const all: any[] = [];
  let failed = 0;
  for (let i = 0; i < chains.length; i += 4) {
    const batch = chains.slice(i, i + 4);
    const results = await Promise.all(batch.map(async (c) => {
      let r = await queryChainPhoton(c, lat, lng, radius);
      if (r === null) {
        await new Promise((ok) => setTimeout(ok, 600));
        r = await queryChainPhoton(c, lat, lng, radius);
      }
      if (r === null) failed++;
      return r || [];
    }));
    all.push(...results.flat());
  }
  return { elements: dedupe(all), complete: failed === 0 };
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
    const validChains = (chainsArr || []).filter((c) => CHAIN_QUERY[c]);
    // If no specific chains requested, query every known chain.
    const chainsToQuery = validChains.length ? validChains : Object.keys(CHAIN_QUERY);

    const key = cacheKey(latNum, lngNum, safeRadius, chainsArr);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      console.log(`[fetchNearbyStores] cache hit (${hit.elements.length} stores)`);
      return Response.json({ elements: hit.elements });
    }

    const { elements, complete } = await queryPhoton(chainsToQuery, latNum, lngNum, safeRadius);

    console.log(`[fetchNearbyStores] photon (${elements.length} stores, complete: ${complete})`);
    if (complete) cache.set(key, { ts: Date.now(), elements });
    return Response.json({ elements });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});