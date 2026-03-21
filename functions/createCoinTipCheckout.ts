import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const stripe = await import('npm:stripe@17.2.0').then(m => new m.default(Deno.env.get("STRIPE_SECRET_KEY")));

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

    const { coins, recipientEmail, postId } = await req.json();

    if (!coins || coins < 1 || !recipientEmail) {
      return Response.json({ error: 'Invalid coins or recipient' }, { status: 400 });
    }

    // Price: $1 = 100 coins, so 1 coin = $0.01
    const priceInCents = Math.round(coins * 0.01 * 100);

    console.log(`Creating tip session: ${coins} coins ($${(priceInCents / 100).toFixed(2)}) from ${user.email} to ${recipientEmail}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${coins} Coins Tip`,
              description: `Tip for a creator post`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `https://${req.headers.get("host") || "app"}/Home?tip_success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${req.headers.get("host") || "app"}/Home`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_email: user.email,
        user_name: user.full_name || user.email,
        recipient_email: recipientEmail,
        post_id: postId,
        coins: coins.toString(),
        transaction_type: 'tip',
      },
    });

    console.log(`Checkout session created: ${session.id}`);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});