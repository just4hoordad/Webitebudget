Deno.serve(async (req) => {
  try {
    const { lat, lng, radius = 3000 } = await req.json();

    // Query supermarkets + drugstores (chemist) nearby
    const query = `[out:json][timeout:25];(node["shop"="supermarket"](around:${radius},${lat},${lng});way["shop"="supermarket"](around:${radius},${lat},${lng});node["shop"="chemist"](around:${radius},${lat},${lng});way["shop"="chemist"](around:${radius},${lat},${lng});node["shop"="drugstore"](around:${radius},${lat},${lng});way["shop"="drugstore"](around:${radius},${lat},${lng}););out center;`;

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