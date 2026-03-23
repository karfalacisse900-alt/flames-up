import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { AwsClient } from 'npm:aws4fetch@1.0.20';

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");

// Always use the public r2.dev URL — never the private cloudflarestorage.com endpoint
const R2_PUBLIC_URL = "https://pub-5c0e57dc88eb46819ec80aaa6fc3e681.r2.dev";

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  region: "auto",
  service: "s3",
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "bin";
    const folder = formData.get("folder") || "uploads";
    const key = `${folder}/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;

    const arrayBuffer = await file.arrayBuffer();

    const response = await r2.fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Length": String(arrayBuffer.byteLength),
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("R2 upload failed:", response.status, errorText);
      return Response.json({ error: "Upload to R2 failed", details: errorText }, { status: 500 });
    }

    // Always return the public CDN URL
    const file_url = `${R2_PUBLIC_URL}/${key}`;
    console.log("Uploaded to R2:", file_url);
    return Response.json({ file_url });

  } catch (error) {
    console.error("uploadToR2 error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});