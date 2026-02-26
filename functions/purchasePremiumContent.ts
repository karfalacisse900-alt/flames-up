import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content_id, creator_email, coin_amount } = await req.json();

    if (!content_id || !creator_email || !coin_amount || coin_amount < 1) {
      return Response.json({ error: 'Invalid purchase data' }, { status: 400 });
    }

    // Check buyer's coin balance
    const buyer_wallet = await base44.entities.CoinWallet.filter({ user_email: user.email });
    if (!buyer_wallet?.length || buyer_wallet[0].balance < coin_amount) {
      return Response.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    // Deduct from buyer
    await base44.entities.CoinWallet.update(buyer_wallet[0].id, {
      balance: buyer_wallet[0].balance - coin_amount,
    });

    // Add to creator (80% goes to creator, 20% platform fee)
    const creator_share = Math.floor(coin_amount * 0.8);
    const creator_wallet = await base44.entities.CoinWallet.filter({ user_email: creator_email });
    if (creator_wallet?.length) {
      await base44.entities.CoinWallet.update(creator_wallet[0].id, {
        balance: creator_wallet[0].balance + creator_share,
      });
    }

    // Log transactions
    await base44.entities.CoinTransaction.create({
      user_email: user.email,
      amount: -coin_amount,
      type: 'art_purchase',
      description: 'Purchased premium content',
      ref_id: content_id,
    });

    await base44.entities.CoinTransaction.create({
      user_email: creator_email,
      amount: creator_share,
      type: 'art_sale',
      description: 'Sold premium content',
      ref_id: content_id,
    });

    return Response.json({ success: true, message: 'Content unlocked' });
  } catch (error) {
    console.error('Purchase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});