/**
 * One-time fix: sets allowedOrigins=["*"] on ALL existing Cloudflare Stream videos
 * so they can be embedded anywhere. Admin-only.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const STREAM_TOKEN = Deno.env.get("CLOUDFLARE_STREAM_TOKEN");

    // Fetch all videos (paginated)
    let page = 1;
    let totalFixed = 0;
    let hasMore = true;

    while (hasMore) {
      const listRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream?per_page=50&page=${page}`,
        { headers: { Authorization: `Bearer ${STREAM_TOKEN}` } }
      );
      const listData = await listRes.json();

      if (!listData.success) {
        console.error("[fixStreamEmbedding] List error:", JSON.stringify(listData.errors));
        return Response.json({ error: listData.errors?.[0]?.message }, { status: 500 });
      }

      const videos = listData.result || [];
      if (videos.length === 0) { hasMore = false; break; }

      // Update each video that doesn't already allow all origins
      for (const video of videos) {
        const alreadyOpen = video.allowedOrigins?.includes("*");
        if (!alreadyOpen) {
          await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${video.uid}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${STREAM_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ allowedOrigins: ["*"] }),
            }
          );
          totalFixed++;
          console.log(`[fixStreamEmbedding] Fixed video ${video.uid}`);
        }
      }

      // CF Stream returns all pages if total < 50*page
      hasMore = videos.length === 50;
      page++;
    }

    return Response.json({ success: true, fixed: totalFixed });
  } catch (err) {
    console.error("[fixStreamEmbedding] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});