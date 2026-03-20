/**
 * Normalizes media URLs to use the correct public Cloudflare R2 CDN URL.
 * Fixes posts that were saved with the private cloudflarestorage.com endpoint.
 */
const PRIVATE_R2_PATTERN = /^https:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com\/[^/]+\//;
const PUBLIC_R2_BASE = "https://pub-5c0e57dc88eb46819ec80aaa6fc3e681.r2.dev/";

export function normalizeMediaUrl(url) {
  if (!url) return url;
  // Replace private S3 endpoint with public CDN URL
  if (PRIVATE_R2_PATTERN.test(url)) {
    return url.replace(PRIVATE_R2_PATTERN, PUBLIC_R2_BASE);
  }
  return url;
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