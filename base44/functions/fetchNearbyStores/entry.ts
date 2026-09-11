const OVERPASS_MIRRORS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

Deno.serve(async (req) => {
  try {
    const { lat, lng, radius = 3000 } = await req.json();

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

    const query = `[out:json][timeout:25];(node["shop"="supermarket"](around:${safeRadius},${latNum},${lngNum});way["shop"="supermarket"](around:${safeRadius},${latNum},${lngNum});node["shop"="chemist"](around:${safeRadius},${latNum},${lngNum});way["shop"="chemist"](around:${safeRadius},${latNum},${lngNum});node["shop"="drugstore"](around:${safeRadius},${latNum},${lngNum});way["shop"="drugstore"](around:${safeRadius},${latNum},${lngNum}););out center;`;

    let lastError: string | null = null;
    for (const mirror of OVERPASS_MIRRORS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
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
        console.log(`[fetchNearbyStores] ${mirror} found ${data.elements?.length || 0} stores`);
        return Response.json({ elements: data.elements || [] });
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