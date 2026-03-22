/**
 * Poll Cloudflare Stream to check if a video has finished processing.
 * Returns { status: "processing" | "ready" | "error" }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { video_id } = await req.json();
    if (!video_id) return Response.json({ error: 'video_id required' }, { status: 400 });

    const ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const STREAM_TOKEN = Deno.env.get("CLOUDFLARE_STREAM_TOKEN");

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${video_id}`,
      { headers: { Authorization: `Bearer ${STREAM_TOKEN}` } }
    );

    const data = await res.json();

    if (!data.success) {
      console.error("[checkVideoStatus] CF error:", JSON.stringify(data.errors));
      return Response.json({ status: "error" });
    }

    const state = data.result?.status?.state;
    // Cloudflare states: pendingupload, downloading, queued, inprogress, ready, error
    const status = state === "ready" ? "ready"
      : state === "error" ? "error"
      : "processing";

    console.log(`[checkVideoStatus] video=${video_id} state=${state} → ${status}`);
    return Response.json({ status, state });

  } catch (err) {
    console.error("[checkVideoStatus] Error:", err.message);
    return Response.json({ status: "error", error: err.message }, { status: 500 });
  }
});