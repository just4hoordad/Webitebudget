import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { lat, lng, radius = 5000 } = await req.json();

    const query = `
      [out:json][timeout:25];
      (
        node["shop"="supermarket"](around:${radius},${lat},${lng});
        node["shop"="grocery"](around:${radius},${lat},${lng});
        node["shop"="discount"](around:${radius},${lat},${lng});
        node["brand"~"Aldi|Lidl|Rewe|Edeka|Penny|Netto|Kaufland|Norma",i](around:${radius},${lat},${lng});
        way["shop"="supermarket"](around:${radius},${lat},${lng});
        way["brand"~"Aldi|Lidl|Rewe|Edeka|Penny|Netto|Kaufland|Norma",i](around:${radius},${lat},${lng});
      );
      out center;
    `;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "BudgetBite/1.0",
        "Accept": "application/json",
      },
      body: "data=" + encodeURIComponent(query),
    });

    const data = await res.json();
    return Response.json({ elements: data.elements || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});