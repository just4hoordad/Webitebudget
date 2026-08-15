Deno.serve(async (req) => {
  try {
    const { lat, lng, radius = 3000 } = await req.json();

    // Validate inputs as finite numbers to prevent Overpass QL injection.
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

    // Query supermarkets + drugstores (chemist) nearby
    const query = `[out:json][timeout:25];(node["shop"="supermarket"](around:${safeRadius},${latNum},${lngNum});way["shop"="supermarket"](around:${safeRadius},${latNum},${lngNum});node["shop"="chemist"](around:${safeRadius},${latNum},${lngNum});way["shop"="chemist"](around:${safeRadius},${latNum},${lngNum});node["shop"="drugstore"](around:${safeRadius},${latNum},${lngNum});way["shop"="drugstore"](around:${safeRadius},${latNum},${lngNum}););out center;`;

    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encoded}`, {
      method: "GET",
      headers: { "User-Agent": "BudgetBite/1.0 (meal planning app)" },
    });

    const data = await res.json();
    console.log(`[fetchNearbyStores] Found ${data.elements?.length || 0} stores:`, 
      data.elements?.map(e => e.tags?.name || e.tags?.brand || 'unnamed').slice(0, 10) || []);
    return Response.json({ elements: data.elements || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});