import { base44 } from "@/api/base44Client";

/**
 * Upload an image file to Cloudflare Images.
 * Returns { file_url, image_id }
 * 
 * Cloudflare Images automatically:
 * - Stores the original
 * - Serves via global CDN
 * - Converts to WebP on supported browsers
 * - Resizes via URL variants (e.g. /public, /thumbnail, /avatar)
 */
export async function uploadToCloudflare(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${import.meta.env.VITE_API_URL || ""}/api/functions/uploadToCloudflare`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
    }
  );

  // Fallback: use base44 SDK invoke if direct fetch fails
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data; // { file_url, image_id }
}

/**
 * Build a Cloudflare Images URL for a specific variant.
 * Variants: 'public' (original), 'thumbnail' (small), 'avatar' (square crop)
 * Configure variants at: dash.cloudflare.com → Images → Variants
 */
export function cfImageUrl(imageId, variant = "public") {
  const base = import.meta.env.VITE_CF_IMAGE_DELIVERY_URL || "";
  if (!base || !imageId) return "";
  return `${base.replace(/\/$/, "")}/${imageId}/${variant}`;
}