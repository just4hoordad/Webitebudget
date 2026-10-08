import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { queryFlink } from "../../shared/flinkPrices.ts";

// On-demand Flink price check for the admin UI. Accepts a list of search
// terms and a supported city, runs the Apify actor, returns the normalized
// records + raw items (so the UI can show stock/category), and optionally
// persists valid results to PriceEstimate when save=true.
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me().catch(() => null);
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { searches, city, maxItems, save } = body as {
    searches?: string[];
    city?: string;
    maxItems?: number;
    save?: boolean;
  };

  const token = process.env.Apify_Flink_prices;
  if (!token) {
    return Response.json(
      { error: "Apify_Flink_prices secret not set — cannot run Flink check." },
      { status: 503 }
    );
  }

  const cleanSearches = Array.isArray(searches)
    ? searches.map((s) => String(s).trim()).filter(Boolean).slice(0, 12)
    : [];
  if (cleanSearches.length === 0) {
    return Response.json({ error: "Provide at least one search term." }, { status: 400 });
  }

  const cleanCity = typeof city === "string" ? city.trim().toLowerCase() : "";
  const validCities = [
    "aachen", "augsburg", "berlin", "bielefeld", "bochum", "bonn",
    "braunschweig", "bremen", "chemnitz", "cologne", "darmstadt",
    "dortmund", "dresden", "duisburg", "dusseldorf", "erfurt", "essen",
    "frankfurt", "freiburg", "gottingen", "hamburg", "hannover",
    "heidelberg", "kaiserslautern", "karlsruhe", "kassel", "kiel",
    "leipzig", "lubeck", "magdeburg", "mainz", "mannheim", "munich",
    "munster", "nuremberg", "oldenburg", "osnabruck", "potsdam",
    "regensburg", "stuttgart", "wiesbaden", "wuppertal",
  ];
  if (!validCities.includes(cleanCity)) {
    return Response.json(
      { error: `Unsupported city. Supported: ${validCities.join(", ")}` },
      { status: 400 }
    );
  }

  const cap = Math.min(Math.max(Number(maxItems) || 5, 1), 20);

  try {
    const result = await queryFlink(token, cleanSearches, cleanCity, cap);
    const records = result.records;

    let saved = 0;
    if (save && records.length > 0) {
      await base44.asServiceRole.entities.PriceEstimate.bulkCreate(records);
      saved = records.length;
    }

    return Response.json({
      status: "success",
      city: result.city,
      postal_code: result.postal_code,
      searched: cleanSearches,
      found: records.length,
      saved,
      items: records.map((r, i) => ({
        name: r.product_name,
        price: r.price,
        unit_price: r.unit_price,
        quantity: r.quantity,
        in_stock: (result.rawItems[i] as any)?.inStock,
        category: (result.rawItems[i] as any)?.category,
      })),
    });
  } catch (error: any) {
    console.error("checkFlinkPrices failed:", error?.message || error);
    return Response.json(
      { error: error?.message || "Flink price check failed" },
      { status: 500 }
    );
  }
}