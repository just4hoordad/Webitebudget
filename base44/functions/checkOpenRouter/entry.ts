import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { performPriceRefreshDryRun } from "../../shared/priceRefresh.ts";

// Admin-only on-demand OpenRouter check. Runs the same OpenRouter query the
// scheduled price refresh uses, but does NOT persist any records. Returns
// provider status, fallback flag, and a sample of parsed items so the admin
// can verify OpenRouter is responding.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const result = await performPriceRefreshDryRun(base44);
    return Response.json(result);
  } catch (error: any) {
    console.error("checkOpenRouter error:", error?.message || error);
    return Response.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}