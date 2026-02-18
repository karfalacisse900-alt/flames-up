import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@15.4.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Create service-role client for webhook operations
    const base44 = createClientFromRequest(req);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userEmail = session.metadata.user_email;
      const coins = parseInt(session.metadata.coins);

      console.log(`Processing payment for ${userEmail}: ${coins} coins`);

      // Add coins to user's wallet
      await base44.asServiceRole.entities.CoinWallet.filter({ user_email: userEmail }).then(async (wallets) => {
        if (wallets.length > 0) {
          const wallet = wallets[0];
          await base44.asServiceRole.entities.CoinWallet.update(wallet.id, {
            balance: (wallet.balance || 0) + coins,
          });
        } else {
          await base44.asServiceRole.entities.CoinWallet.create({
            user_email: userEmail,
            balance: coins,
          });
        }
      });

      // Record transaction
      await base44.asServiceRole.entities.CoinTransaction.create({
        user_email: userEmail,
        amount: coins,
        type: "coin_purchase",
        description: `Purchased ${coins} coins`,
      });

      console.log(`Successfully added ${coins} coins to ${userEmail}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});