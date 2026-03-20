import { base44 } from "@/api/base44Client";

/**
 * Upload an image file to Cloudflare Images.
 * 
 * Pipeline:
 * 1. Upload file to base44 temporary storage → get a URL
 * 2. Backend function fetches that URL and pushes to Cloudflare Images
 * 3. Returns a permanent Cloudflare CDN delivery URL
 *
 * Cloudflare Images automatically:
 * - Serves via global CDN with edge caching
 * - Converts to WebP/AVIF on supported browsers
 * - Resizes via URL variants (configure at dash.cloudflare.com → Images → Variants)
 *   e.g. /public (original), /thumbnail, /avatar
 *
 * @param {File} file - The image file to upload
 * @returns {{ file_url: string, image_id: string }}
 */
export async function uploadToCloudflare(file) {
  // Step 1: upload to base44 temp storage to get a fetchable URL
  const { file_url: tempUrl } = await base44.integrations.Core.UploadFile({ file });

  // Step 2: hand off to Cloudflare Images via backend function
  const res = await base44.functions.invoke("uploadToCloudflare", { file_url: tempUrl });

  if (res.data?.error) throw new Error(res.data.error);
  return res.data; // { file_url, image_id }
}