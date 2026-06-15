import Stripe from 'npm:stripe@14.21.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const base44 = createClientFromRequest(req);

    // Get user email if authenticated (optional — public app)
    let customerEmail;
    try {
      const authed = await base44.auth.isAuthenticated();
      if (authed) {
        const user = await base44.auth.me();
        customerEmail = user?.email;
      }
    } catch (_) {}

    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: 'price_1Thq6JGbWkHsHTlQ9itBKTzV', quantity: 1 }],
      success_url: `${origin}/meal-plan?pro=activated`,
      cancel_url: `${origin}/`,
      customer_email: customerEmail,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
    });

    console.log('Checkout session created:', session.id);
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createCheckoutSession error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});