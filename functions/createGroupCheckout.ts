import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const stripe = await import('npm:stripe@14.8.0').then(m => m.default);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { group_id, group_name, monthly_fee } = await req.json();
    
    if (!group_id || !monthly_fee || monthly_fee < 0.99) {
      return new Response(JSON.stringify({ error: 'Invalid group or fee' }), { status: 400 });
    }

    const stripeClient = stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${group_name} Monthly Membership`,
            description: `Monthly membership for ${group_name}`,
          },
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
          unit_amount: Math.round(monthly_fee * 100),
        },
        quantity: 1,
      }],
      customer_email: user.email,
      success_url: `${new URL(req.url).origin}/Groups?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(req.url).origin}/Groups`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        group_id,
        group_name,
        user_email: user.email,
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), { status: 200 });
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});