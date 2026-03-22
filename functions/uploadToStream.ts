/**
 * Upload a video to Cloudflare Stream using Direct Upload (not URL copy).
 * Direct upload sends the video bytes immediately to Cloudflare — video is
 * ready to stream in seconds, not minutes.
 *
 * Flow:
 *   1. Client calls this endpoint with { file_url } (base44 temp URL)
 *   2. We fetch the file bytes here on the server
 *   3. We upload as multipart/form-data directly to Cloudflare Stream
 *   4. Video is encoded and ready almost instantly
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

    console.log(`[uploadToStream] Fetching video bytes from: ${sourceUrl}`);

    // Step 1: Download the video file bytes from base44 storage
    const fileRes = await fetch(sourceUrl);
    if (!fileRes.ok) {
      console.error("[uploadToStream] Failed to fetch source file:", fileRes.status);
      return Response.json({ error: 'Could not fetch source video' }, { status: 500 });
    }

    const fileBlob = await fileRes.blob();
    const contentType = fileRes.headers.get("content-type") || "video/mp4";
    console.log(`[uploadToStream] File size: ${fileBlob.size} bytes, type: ${contentType}`);

    // Step 2: Direct upload to Cloudflare Stream as multipart form
    const formData = new FormData();
    formData.append("file", fileBlob, `upload-${Date.now()}.mp4`);
    formData.append("meta", JSON.stringify({
      name: `upload-${user.email}-${Date.now()}`,
    }));
    formData.append("creator", user.email);
    formData.append("allowedOrigins", JSON.stringify(["*"]));
    // requireSignedURLs=false so the video plays publicly
    formData.append("requireSignedURLs", "false");

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STREAM_TOKEN}`,
          // Do NOT set Content-Type — fetch sets it with boundary for multipart
        },
        body: formData,
      }
    );

    const result = await cfRes.json();

    if (!result.success) {
      console.error("[uploadToStream] CF direct upload error:", JSON.stringify(result.errors));
      return Response.json({ error: result.errors?.[0]?.message || 'Upload failed' }, { status: 500 });
    }

    const video = result.result;
    const video_id = video.uid;
    const stream_url = video_id;
    const thumbnail_url = video.thumbnail || `https://videodelivery.net/${video_id}/thumbnails/thumbnail.jpg`;

    console.log(`[uploadToStream] ✓ Direct upload complete: video ${video_id} for ${user.email}`, 
      `readyToStream: ${video.readyToStream}`);

    return Response.json({ video_id, stream_url, thumbnail_url });

  } catch (err) {
    console.error("[uploadToStream] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});