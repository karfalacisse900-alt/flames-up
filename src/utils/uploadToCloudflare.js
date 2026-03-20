import { base44 } from "@/api/base44Client";

/**
 * Upload an image file to Cloudflare Images.
 * Returns { file_url, image_id }
 *
 * Cloudflare Images automatically:
 * - Stores originals securely
 * - Serves via global CDN with edge caching
 * - Converts to WebP on supported browsers
 * - Resizes via URL variants (e.g. /public, /thumbnail, /avatar)
 *   Configure variants at: dash.cloudflare.com → Images → Variants
 */
export async function uploadToCloudflare(file) {
  const { file_url, image_id } = await base44.integrations.Core.UploadFile({ file });

  // UploadFile gives us a temporary base44 URL — we then re-upload to Cloudflare
  // using the backend function which fetches from that URL
  const res = await base44.functions.invoke("uploadToCloudflare", { file });

  if (res.data?.error) throw new Error(res.data.error);
  return res.data; // { file_url, image_id }
}