/**
 * Upload images to Cloudflare Images API.
 * Accepts a file URL (from base44 UploadFile) and pushes it to Cloudflare Images.
 * Returns { file_url, image_id }
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

    const { file_url: sourceUrl } = await req.json();

    if (!sourceUrl) {
      return Response.json({ error: 'No file_url provided' }, { status: 400 });
    }

    // Fetch the file from the temporary base44 URL
    const fileRes = await fetch(sourceUrl);
    if (!fileRes.ok) {
      console.error("[uploadToCloudflare] Failed to fetch source file:", fileRes.status);
      return Response.json({ error: 'Failed to fetch source file' }, { status: 400 });
    }

    const fileBlob = await fileRes.blob();
    const contentType = fileBlob.type || "image/jpeg";
    const ext = contentType.split("/")[1]?.split("+")[0] || "jpg";

    // Upload to Cloudflare Images
    const cfForm = new FormData();
    cfForm.append("file", new File([fileBlob], `upload.${ext}`, { type: contentType }));
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
    // Always construct URL from scratch: https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/public
    // Strip any trailing slashes or extra path segments from DELIVERY_URL
    const baseUrl = DELIVERY_URL.replace(/\/$/, "").replace(/\/<[^>]+>/g, "");
    const file_url = `${baseUrl}/${imageId}/public`;

    console.log(`[uploadToCloudflare] ✓ image ${imageId} uploaded for ${user.email}`);
    return Response.json({ file_url, image_id: imageId });

  } catch (err) {
    console.error("[uploadToCloudflare] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});