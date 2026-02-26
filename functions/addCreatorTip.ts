import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { creator_email, amount, tipper_name } = await req.json();

    if (!creator_email || !amount || amount < 1) {
      return Response.json({ error: 'Invalid tip data' }, { status: 400 });
    }

    // Get tipper's wallet and deduct
    const tipper_wallet = await base44.entities.CoinWallet.filter({ user_email: user.email });
    if (!tipper_wallet?.length || tipper_wallet[0].balance < amount) {
      return Response.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    await base44.entities.CoinWallet.update(tipper_wallet[0].id, {
      balance: tipper_wallet[0].balance - amount,
    });

    // Add to creator's wallet
    const creator_wallet = await base44.entities.CoinWallet.filter({ user_email: creator_email });
    if (creator_wallet?.length) {
      await base44.entities.CoinWallet.update(creator_wallet[0].id, {
        balance: creator_wallet[0].balance + amount,
      });
    }

    // Log transaction for tipper
    await base44.entities.CoinTransaction.create({
      user_email: user.email,
      amount: -amount,
      type: 'gift_sent',
      description: `Tipped ${amount} coins to ${creator_email}`,
    });

    // Log transaction for creator
    await base44.entities.CoinTransaction.create({
      user_email: creator_email,
      amount,
      type: 'gift_received',
      description: `Received tip of ${amount} coins from ${tipper_name}`,
    });

    return Response.json({ success: true, message: 'Tip sent successfully' });
  } catch (error) {
    console.error('Tip error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});