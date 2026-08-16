import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { verifyStripeSignature, PRO_MONTHLY_CREDITS } from "../../shared/stripe.ts";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.text();
    const signature = req.headers.get("stripe-signature") || "";
    const webhookSecret = secrets.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("stripeWebhook: STRIPE_WEBHOOK_SECRET not set");
      return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const verified = await verifyStripeSignature(payload, signature, webhookSecret);
    if (!verified) {
      console.error("stripeWebhook: invalid signature");
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(payload);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.mode === "subscription") {
        const email = session.customer_email || session.customer_details?.email;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        if (!email) {
          console.error("stripeWebhook: subscription session missing email");
          return Response.json({ error: "Missing email" }, { status: 400 });
        }

        const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();
        const existing = await base44.asServiceRole.entities.ProSubscription.filter({ email });
        const rec = existing?.[0];

        if (rec) {
          await base44.asServiceRole.entities.ProSubscription.update(rec.id, {
            active: true,
            creditsRemaining: PRO_MONTHLY_CREDITS,
            periodEnd,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          });
        } else {
          await base44.asServiceRole.entities.ProSubscription.create({
            email,
            active: true,
            creditsRemaining: PRO_MONTHLY_CREDITS,
            periodEnd,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          });
        }
      } else {
        // One-time payment = donation
        const email = session.customer_email || session.customer_details?.email || "";
        const amountTotal = session.amount_total || 0;
        const amount = amountTotal / 100;
        await base44.asServiceRole.entities.Donation.create({
          email,
          amount,
          currency: session.currency || "eur",
          stripeSessionId: session.id,
        });
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      const customerId = subscription.customer;

      let rec = null;
      const bySub = await base44.asServiceRole.entities.ProSubscription.filter({
        stripeSubscriptionId: subscriptionId,
      });
      rec = bySub?.[0];
      if (!rec) {
        const byCust = await base44.asServiceRole.entities.ProSubscription.filter({
          stripeCustomerId: customerId,
        });
        rec = byCust?.[0];
      }
      if (rec) {
        await base44.asServiceRole.entities.ProSubscription.update(rec.id, { active: false });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("stripeWebhook error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}