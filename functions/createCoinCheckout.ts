import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const stripe = await import('npm:stripe@14.0.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, coins } = await req.json();

    if (!amount || !coins || amount < 100) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${coins} Coins`,
              description: `Purchase ${coins} coins for tipping creators`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${new URL(req.url).origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(req.url).origin}/wallet`,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
        coins: coins.toString(),
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});