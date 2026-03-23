import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // Get all art pieces
    const artPieces = await base44.asServiceRole.entities.ArtPiece.list("-like_count", 100);

    // Filter for pieces created today
    const todayArt = artPieces.filter(a => a.created_date?.startsWith(todayStr));
    const pool = todayArt.length > 0 ? todayArt : artPieces;

    if (pool.length === 0) {
      return Response.json({ message: "No art to judge today" });
    }

    // Find winner (most liked)
    const winner = pool.reduce((best, a) => (a.like_count || 0) > (best.like_count || 0) ? a : best, pool[0]);

    if (!winner?.creator_email && !winner?.owner_email) {
      return Response.json({ message: "Winner has no email" });
    }

    const winnerEmail = winner.creator_email || winner.owner_email;

    // Award 50 coins to winner
    const wallets = await base44.asServiceRole.entities.CoinWallet.filter({ user_email: winnerEmail });
    if (wallets.length > 0) {
      await base44.asServiceRole.entities.CoinWallet.update(wallets[0].id, {
        balance: (wallets[0].balance || 0) + 50
      });
    } else {
      await base44.asServiceRole.entities.CoinWallet.create({
        user_email: winnerEmail,
        balance: 150 // 100 default + 50 prize
      });
    }

    // Log the transaction
    await base44.asServiceRole.entities.CoinTransaction.create({
      user_email: winnerEmail,
      amount: 50,
      type: "game_win",
      description: `🏆 Daily Art Champion - "${winner.title}" won Today's Vote Arena!`,
      ref_id: winner.id,
    });

    // Send notification
    const users = await base44.asServiceRole.entities.User.filter({ email: winnerEmail });
    if (users.length > 0) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: winnerEmail,
        type: "achievement",
        title: "🏆 You're Today's Art Champion!",
        body: `Your artwork "${winner.title}" won the Daily Vote Arena! +50 coins awarded.`,
        is_read: false,
      });
    }

    console.log(`Daily winner: ${winnerEmail} - "${winner.title}" - +50 coins`);
    return Response.json({ success: true, winner: winner.title, email: winnerEmail });
  } catch (error) {
    console.error("dailyArtWinner error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});