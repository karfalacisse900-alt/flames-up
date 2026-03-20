/**
 * Normalizes media URLs to use the correct public Cloudflare R2 CDN URL.
 * Fixes posts that were saved with the private cloudflarestorage.com endpoint.
 *
 * Private URL format (two variants):
 *   https://<account_id>.r2.cloudflarestorage.com/<bucket>/<key>
 *   https://<account_id>.r2.cloudflarestorage.com/<key>
 */
const PRIVATE_R2_PATTERN = /^https:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com\/[^/]+\//;
const PUBLIC_R2_BASE = "https://pub-5c0e57dc88eb46819ec80aaa6fc3e681.r2.dev/";

export function normalizeMediaUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("r2.cloudflarestorage.com")) return url;

  // Extract everything after the bucket name segment
  // Pattern: https://<acct>.r2.cloudflarestorage.com/<bucket>/<rest...>
  const match = url.match(/^https:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/);
  if (match) {
    return PUBLIC_R2_BASE + match[1];
  }
  // Fallback: just replace the base
  return url.replace(PRIVATE_R2_PATTERN, PUBLIC_R2_BASE);
}

export function normalizePost(post) {
  if (!post) return post;
  return {
    ...post,
    image_url: normalizeMediaUrl(post.image_url),
    video_url: normalizeMediaUrl(post.video_url),
    image_urls: post.image_urls?.map(normalizeMediaUrl),
  };
}