/**
 * Get a direct upload URL from Cloudflare Stream.
 * The browser then uploads directly to Cloudflare — no server relay needed.
 * Returns { uploadUrl, video_id }
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
      console.error("[getStreamUploadUrl] Missing Cloudflare env vars");
      return Response.json({ error: 'Cloudflare Stream not configured' }, { status: 500 });
    }

    const { file_size } = await req.json();

    // Request a direct upload URL from Cloudflare Stream
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STREAM_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxDurationSeconds: 3600,
          creator: user.email,
          requireSignedURLs: false,
          meta: {
            name: `upload-${user.email}-${Date.now()}`,
          },
        }),
      }
    );

    const result = await cfRes.json();

    if (!result.success) {
      console.error("[getStreamUploadUrl] CF error:", JSON.stringify(result.errors));
      return Response.json({ error: result.errors?.[0]?.message || 'Failed to get upload URL' }, { status: 500 });
    }

    const { uid: video_id, uploadURL: upload_url } = result.result;

    console.log(`[getStreamUploadUrl] ✓ Got upload URL for video ${video_id}`);

    return Response.json({ video_id, upload_url });

  } catch (err) {
    console.error("[getStreamUploadUrl] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});