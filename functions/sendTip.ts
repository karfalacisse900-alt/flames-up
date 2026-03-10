import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    const { postId, creatorEmail, coinsAmount, message } = await req.json();

    if (!postId || !creatorEmail || !coinsAmount || coinsAmount < 1) {
      return Response.json({ error: 'Invalid tip data' }, { status: 400 });
    }

    // Get user's wallet
    const wallets = await base44.entities.CoinWallet.filter({ user_email: user.email });
    const wallet = wallets[0];

    if (!wallet || wallet.balance < coinsAmount) {
      return Response.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    // Deduct coins from sender
    await base44.entities.CoinWallet.update(wallet.id, {
      balance: wallet.balance - coinsAmount,
    });

    // Add coins to creator
    const creatorWallets = await base44.entities.CoinWallet.filter({ user_email: creatorEmail });
    if (creatorWallets[0]) {
      await base44.entities.CoinWallet.update(creatorWallets[0].id, {
        balance: creatorWallets[0].balance + coinsAmount,
      });
    }

    // Record transaction for sender
    await base44.entities.CoinTransaction.create({
      user_email: user.email,
      amount: -coinsAmount,
      type: 'gift_sent',
      description: `Tipped ${coinsAmount} coins to creator`,
      ref_id: postId,
    });

    // Record transaction for creator
    await base44.entities.CoinTransaction.create({
      user_email: creatorEmail,
      amount: coinsAmount,
      type: 'gift_received',
      description: `Received ${coinsAmount} coins tip`,
      ref_id: postId,
    });

    // Create notification for creator
    await base44.entities.Notification.create({
      recipient_email: creatorEmail,
      sender_email: user.email,
      sender_name: user.full_name,
      type: 'tip',
      title: `${user.full_name} sent you ${coinsAmount} coins!`,
      description: message || 'Love your post!',
      post_id: postId,
      is_read: false,
    });

    return Response.json({ success: true, message: 'Tip sent!' });
  } catch (error) {
    console.error('Tip error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});