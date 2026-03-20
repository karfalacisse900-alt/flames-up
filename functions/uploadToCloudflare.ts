/**
 * Upload images to Cloudflare Images API.
 * Returns a delivery URL with variant support (auto-resize, WebP, CDN).
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
    const API_TOKEN = Deno.env.get("CLOUDFLARE_IMAGES_TOKEN");
    const DELIVERY_URL = Deno.env.get("CLOUDFLARE_IMAGE_DELIVERY_URL");

    if (!ACCOUNT_ID || !API_TOKEN || !DELIVERY_URL) {
      console.error("[uploadToCloudflare] Missing Cloudflare env vars");
      return Response.json({ error: 'Cloudflare not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward the file to Cloudflare Images
    const cfForm = new FormData();
    cfForm.append("file", file);
    // Optional metadata
    cfForm.append("metadata", JSON.stringify({ uploaded_by: user.email }));

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: cfForm,
      }
    );

    const result = await cfRes.json();

    if (!result.success) {
      console.error("[uploadToCloudflare] CF error:", JSON.stringify(result.errors));
      return Response.json({ error: result.errors?.[0]?.message || 'Upload failed' }, { status: 500 });
    }

    const imageId = result.result.id;
    // Use 'public' variant — configure variants in your Cloudflare Images dashboard
    const file_url = `${DELIVERY_URL.replace(/\/$/, "")}/${imageId}/public`;

    console.log(`[uploadToCloudflare] Uploaded image ${imageId} for ${user.email}`);
    return Response.json({ file_url, image_id: imageId });

  } catch (err) {
    console.error("[uploadToCloudflare] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});