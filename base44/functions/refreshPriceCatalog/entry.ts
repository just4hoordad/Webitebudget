import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { refreshBackgroundPrices } from "../../shared/backgroundPrices.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await refreshBackgroundPrices(base44, { previewOnly: body.previewOnly === true, limit: body.limit });
    return Response.json(result);
  } catch (error: any) {
    console.error("refreshPriceCatalog error:", error?.message || error);
    return Response.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}