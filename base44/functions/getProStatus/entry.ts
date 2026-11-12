import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { TIER_CREDITS } from "../../shared/stripe.ts";
import { getFreeUserCredits } from "../../shared/aiQuota.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) =>
      e?.status === 401 ? null : Promise.reject(e)
    );
    if (!user) return Response.json({ active: false });

    const email = user.email;
    if (!email) {
      const freeCreditsRemaining = await getFreeUserCredits(base44, user.id);
      return Response.json({ active: false, freeCreditsRemaining });
    }

    const records = await base44.asServiceRole.entities.ProSubscription.filter({ email });
    const rec = Array.isArray(records) ? records[0] : records?.items?.[0];
    if (!rec || !rec.active) {
      const freeCreditsRemaining = await getFreeUserCredits(base44, user.id);
      return Response.json({ active: false, freeCreditsRemaining });
    }

    // Auto-reset monthly credits if the billing period has ended.
    let creditsRemaining = rec.creditsRemaining;
    let periodEnd = rec.periodEnd;
    const tier = rec.tier || "pro";
    if (rec.active && periodEnd && new Date(periodEnd) < new Date()) {
      creditsRemaining = TIER_CREDITS[tier] || TIER_CREDITS.pro;
      periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();
      await base44.asServiceRole.entities.ProSubscription.update(rec.id, {
        creditsRemaining,
        periodEnd,
      });
    }

    return Response.json({
      active: Boolean(rec.active),
      tier,
      creditsRemaining,
      periodEnd,
      email,
    });
  } catch (error: any) {
    console.error("getProStatus error:", error?.message || error);
    return Response.json({ error: error?.message || "Failed to fetch subscription status" }, { status: 500 });
  }
}