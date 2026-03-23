import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const stripe = await import('npm:stripe@17.2.0').then(m => new m.default(Deno.env.get("STRIPE_SECRET_KEY")));

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No stripe signature found');
      return Response.json({ error: 'No signature' }, { status: 401 });
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    );

    console.log(`Processing Stripe event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_email, recipient_email, coins, post_id } = session.metadata;

      if (!coins || !recipient_email) {
        console.error('Missing required metadata in session');
        return Response.json({ error: 'Invalid metadata' }, { status: 400 });
      }

      const coinsAmount = parseInt(coins);

      // Record the transaction
      try {
        await base44.asServiceRole.entities.CoinTransaction.create({
          sender_email: user_email,
          recipient_email: recipient_email,
          amount: coinsAmount,
          type: 'tip_sent',
          description: `Tipped ${coinsAmount} coins on post`,
          post_id: post_id,
          transaction_id: session.id,
        });

        // Add coins to recipient wallet (we assume wallet system exists)
        // This is a simplified version - you may need to adjust based on your wallet implementation
        await base44.asServiceRole.functions.invoke('addCoinsToWallet', {
          email: recipient_email,
          amount: coinsAmount,
        });

        console.log(`Tip processed: ${coinsAmount} coins from ${user_email} to ${recipient_email}`);
      } catch (dbError) {
        console.error('Error recording transaction:', dbError.message);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});