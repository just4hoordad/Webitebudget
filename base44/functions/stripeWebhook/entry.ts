import Stripe from 'npm:stripe@14.21.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook Error', { status: 400 });
  }

  console.log('Stripe event received:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details?.email || session.customer_email;

    if (customerEmail) {
      try {
        const base44 = createClientFromRequest(req);
        // Find user by email and set role to 'pro'
        const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
        if (users && users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, { role: 'pro' });
          console.log(`Activated Pro for user: ${customerEmail}`);
        } else {
          console.log(`No user found for email: ${customerEmail}`);
        }
      } catch (err) {
        console.error('Failed to activate Pro:', err.message);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    try {
      const stripe2 = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
      const customer = await stripe2.customers.retrieve(subscription.customer);
      const customerEmail = customer.email;
      if (customerEmail) {
        const base44 = createClientFromRequest(req);
        const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
        if (users && users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, { role: 'user' });
          console.log(`Revoked Pro for user: ${customerEmail}`);
        }
      }
    } catch (err) {
      console.error('Failed to revoke Pro:', err.message);
    }
  }

  return Response.json({ received: true });
});