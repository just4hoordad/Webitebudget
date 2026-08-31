import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { stripeHeaders, appId, safeOrigin } from "../../shared/stripe.ts";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let email = null;
    try {
      const me = await base44.auth.me();
      email = me?.email || null;
    } catch {
      /* public app */
    }

    const body = await req.json().catch(() => ({}));
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount < 1 || amount > 500) {
      return Response.json(
        { error: "Amount must be between €1 and €500" },
        { status: 400 }
      );
    }
    const unitAmount = Math.round(amount * 100);

    const origin = safeOrigin(body.origin, req.headers.get("origin"));

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "eur");
    params.set("line_items[0][price_data][unit_amount]", String(unitAmount));
    params.set("line_items[0][price_data][product_data][name]", "BudgetBite Donation");
    if (email) params.set("customer_email", email);
    params.set("success_url", `${origin}/?donation=success`);
    params.set("cancel_url", `${origin}/?donation=cancel`);
    params.set("metadata[base44_app_id]", appId());

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
      console.error("createDonationSession: Stripe error:", data?.error?.message);
      return Response.json(
        { error: data?.error?.message || "Failed to create donation session" },
        { status: 400 }
      );
    }

    return Response.json({ url: data.url, sessionId: data.id });
  } catch (error) {
    console.error("createDonationSession error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}