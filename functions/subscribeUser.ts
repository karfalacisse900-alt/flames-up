import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, coin_cost } = await req.json();

    if (!tier || !coin_cost || coin_cost < 1) {
      return Response.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Check wallet balance
    const wallet = await base44.entities.CoinWallet.filter({ user_email: user.email });
    if (!wallet?.length || wallet[0].balance < coin_cost) {
      return Response.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    // Deduct coins
    await base44.entities.CoinWallet.update(wallet[0].id, {
      balance: wallet[0].balance - coin_cost,
    });

    // Log transaction
    await base44.entities.CoinTransaction.create({
      user_email: user.email,
      amount: -coin_cost,
      type: 'boost_post',
      description: `Subscribed to ${tier} plan`,
    });

    return Response.json({ success: true, message: 'Subscription activated' });
  } catch (error) {
    console.error('Subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});