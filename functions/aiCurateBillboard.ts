import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Try to get user (optional – anonymous users still get a billboard)
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}

    // Fetch all approved discover items (service role so we get all)
    const allItems = await base44.asServiceRole.entities.DiscoverItem.filter(
      { is_approved: true }, '-created_date', 300
    );

    if (!allItems.length) return Response.json({ items: [], personalized: false });

    // Build behavior signals from user data
    let behaviorSignals = { isAnonymous: !user, interests: [], activityTypes: [] };

    if (user?.email) {
      const [gameStats, artPieces, transactions] = await Promise.all([
        base44.entities.GameStats.filter({ player_email: user.email }),
        base44.entities.ArtPiece.filter({ creator_email: user.email }),
        base44.entities.CoinTransaction.filter({ user_email: user.email }, '-created_date', 30),
      ]);

      const totalGames = gameStats.reduce((s, g) => s + (g.games_played || 0), 0);
      const activityTypes = [...new Set(transactions.map(t => t.type))];

      if (totalGames > 3) behaviorSignals.interests.push('gaming', 'entertainment');
      if (artPieces.length > 0) behaviorSignals.interests.push('art', 'design', 'creative');
      if (activityTypes.includes('daily_checkin')) behaviorSignals.interests.push('productivity');
      if (activityTypes.includes('live_host')) behaviorSignals.interests.push('social', 'streaming');

      behaviorSignals.activityTypes = activityTypes;
      behaviorSignals.gamesPlayed = totalGames;
      behaviorSignals.artCount = artPieces.length;
    }

    // Slim item catalog for the prompt
    const catalog = allItems.map(i => ({
      id: i.id,
      title: i.title,
      category: i.category,
      tags: i.tags || [],
      is_sponsored: !!i.is_sponsored,
      is_featured: !!i.is_featured,
      is_new: !!i.is_new,
      pricing: i.pricing || 'Unknown',
    }));

    const prompt = `You are a content curation AI for a discovery platform called "Discover".

User behavior signals:
${JSON.stringify(behaviorSignals, null, 2)}

Available tools/apps catalog (${catalog.length} items):
${JSON.stringify(catalog, null, 2)}

Your task: select exactly 8 item IDs for this user's personalized billboard carousel.

Rules:
1. If user has gaming interests → prioritize entertainment/gaming category items
2. If user creates art → prioritize design, creative tools (Figma, Midjourney, Adobe Firefly, etc.)
3. If user is active (daily_checkin) → mix productivity + developer_tools
4. Always include 1-2 sponsored items (is_sponsored=true) if available
5. Always include 1-2 editor picks (is_featured=true) if available
6. Always include 1-2 new items (is_new=true) for freshness
7. Ensure VARIETY: do NOT pick 8 items from the same category
8. For anonymous users: pick a general mix of top tools across all categories

Return item_ids in the order they should appear (best match first).`;

    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          item_ids: { type: "array", items: { type: "string" } },
          reason: { type: "string" },
        },
        required: ["item_ids"],
      },
    });

    const selectedIds = new Set(aiResult?.item_ids || []);
    let selectedItems = allItems.filter(i => selectedIds.has(i.id));

    // Order them as AI intended
    selectedItems.sort((a, b) => {
      const ai = aiResult.item_ids.indexOf(a.id);
      const bi = aiResult.item_ids.indexOf(b.id);
      return ai - bi;
    });

    // Fallback if AI returned too few
    if (selectedItems.length < 4) {
      const usedIds = new Set(selectedItems.map(i => i.id));
      const sponsored = allItems.filter(i => i.is_sponsored && !usedIds.has(i.id)).slice(0, 2);
      const featured = allItems.filter(i => i.is_featured && !usedIds.has(i.id)).slice(0, 2);
      const fresh = allItems.filter(i => !usedIds.has(i.id) && !sponsored.includes(i) && !featured.includes(i)).slice(0, 4);
      selectedItems = [...selectedItems, ...sponsored, ...featured, ...fresh].slice(0, 8);
    }

    return Response.json({
      items: selectedItems,
      personalized: behaviorSignals.interests.length > 0,
      reason: aiResult?.reason || 'Curated selection',
    });

  } catch (error) {
    console.error('Billboard curation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});