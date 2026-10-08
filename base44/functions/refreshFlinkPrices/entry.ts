import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { performFlinkPriceRefresh } from "../../shared/flinkPrices.ts";

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);

  // Admin-only: this pulls a paid Apify actor and writes shared price records.
  const user = await base44.auth.me().catch(() => null);
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const result = await performFlinkPriceRefresh(base44);
    return Response.json(result);
  } catch (error: any) {
    console.error("refreshFlinkPrices failed:", error?.message || error);
    return Response.json(
      { error: error?.message || "Flink price refresh failed" },
      { status: 500 }
    );
  }
}