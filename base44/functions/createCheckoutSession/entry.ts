import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { stripeHeaders, findProPriceId, appId, safeOrigin } from "../../shared/stripe.ts";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Optional auth — prefill customer email when the user is logged in.
    let email = null;
    try {
      const me = await base44.auth.me();
      email = me?.email || null;
    } catch {
      /* public app — may be unauthenticated */
    }

    const body = await req.json().catch(() => ({}));
    const origin = safeOrigin(body.origin, req.headers.get("origin"));

    const priceId = await findProPriceId();

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    if (email) params.set("customer_email", email);
    params.set("success_url", `${origin}/?pro=success`);
    params.set("cancel_url", `${origin}/?pro=cancel`);
    params.set("metadata[base44_app_id]", appId());
    params.set("subscription_data[metadata][base44_app_id]", appId());
    params.set("allow_promotion_codes", "true");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: stripeHeaders({
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": crypto.randomUUID(),
      }),
      body: params,
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("createCheckoutSession: Stripe error:", data?.error?.message);
      return Response.json(
        { error: data?.error?.message || "Failed to create checkout session" },
        { status: 400 }
      );
    }

    return Response.json({ url: data.url, sessionId: data.id });
  } catch (error) {
    console.error("createCheckoutSession error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}