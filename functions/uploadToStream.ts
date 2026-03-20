/**
 * Upload a video to Cloudflare Stream.
 * Accepts a file URL (from base44 UploadFile) and pushes it to Cloudflare Stream via URL upload.
 * Returns { video_id, stream_url, thumbnail_url }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const STREAM_TOKEN = Deno.env.get("CLOUDFLARE_STREAM_TOKEN");

    if (!ACCOUNT_ID || !STREAM_TOKEN) {
      console.error("[uploadToStream] Missing Cloudflare env vars");
      return Response.json({ error: 'Cloudflare Stream not configured' }, { status: 500 });
    }

    const { file_url: sourceUrl } = await req.json();

    if (!sourceUrl) {
      return Response.json({ error: 'No file_url provided' }, { status: 400 });
    }

    // Use Cloudflare Stream's URL upload (no need to re-download the file)
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/copy`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STREAM_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: sourceUrl,
          meta: { name: `upload-${user.email}-${Date.now()}` },
          creator: user.email,
        }),
      }
    );

    const result = await cfRes.json();

    if (!result.success) {
      console.error("[uploadToStream] CF error:", JSON.stringify(result.errors));
      return Response.json({ error: result.errors?.[0]?.message || 'Upload failed' }, { status: 500 });
    }

    const video = result.result;
    const video_id = video.uid;
    const stream_url = `https://customer-${video.playback?.hls?.split("customer-")[1] || `${ACCOUNT_ID}.cloudflarestream.com/${video_id}/manifest/video.m3u8`}`;
    const thumbnail_url = `https://customer-${video.thumbnail?.split("customer-")[1] || `${ACCOUNT_ID}.cloudflarestream.com/${video_id}/thumbnails/thumbnail.jpg`}`;

    console.log(`[uploadToStream] ✓ video ${video_id} queued for ${user.email}`);
    return Response.json({ video_id, stream_url, thumbnail_url });

  } catch (err) {
    console.error("[uploadToStream] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});