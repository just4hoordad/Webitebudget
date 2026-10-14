import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { TIER_CREDITS } from "../../shared/stripe.ts";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ active: false });
    const email = user.email;
    if (!email) return Response.json({ active: false });

    const records = await base44.asServiceRole.entities.ProSubscription.filter({ email });
    const rec = records?.[0];
    if (!rec) return Response.json({ active: false });

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
      active: rec.active,
      tier,
      creditsRemaining,
      periodEnd,
      email,
    });
  } catch (error) {
    console.error("getProStatus error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}