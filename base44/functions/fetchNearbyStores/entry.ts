Deno.serve(async (req) => {
  try {
    const { lat, lng, radius = 3000 } = await req.json();

    // Simple query: just supermarkets with known brands nearby
    const query = `[out:json][timeout:20];(node["shop"="supermarket"](around:${radius},${lat},${lng});way["shop"="supermarket"](around:${radius},${lat},${lng}););out center;`;

    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://overpass.kumi.systems/api/interpreter?data=${encoded}`, {
      method: "GET",
      headers: { "User-Agent": "BudgetBite/1.0 (meal planning app)" },
    });

    const data = await res.json();
    return Response.json({ elements: data.elements || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});