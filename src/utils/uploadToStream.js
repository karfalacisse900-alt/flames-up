import { base44 } from "@/api/base44Client";

/**
 * Upload a video file to Cloudflare Stream.
 * Pipeline:
 * 1. Upload file to base44 temp storage → get a URL
 * 2. Backend function passes that URL to Cloudflare Stream for processing
 * 3. Returns { video_id, stream_url, thumbnail_url }
 *
 * @param {File} file - The video file to upload
 * @returns {{ video_id: string, stream_url: string, thumbnail_url: string }}
 */
export async function uploadToStream(file) {
  // Step 1: upload to base44 temp storage
  const { file_url: tempUrl } = await base44.integrations.Core.UploadFile({ file });

  // Step 2: hand off to Cloudflare Stream via backend function
  const res = await base44.functions.invoke("uploadToStream", { file_url: tempUrl });

  if (res.data?.error) throw new Error(res.data.error);
  return res.data; // { video_id, stream_url, thumbnail_url }
}