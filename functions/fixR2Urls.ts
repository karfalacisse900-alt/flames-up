/**
 * One-time migration: rewrite all CommunityPost records that have
 * private r2.cloudflarestorage.com URLs → public r2.dev URLs.
 * 
 * Call this once as admin to fix existing data.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const PUBLIC_R2_BASE = "https://pub-5c0e57dc88eb46819ec80aaa6fc3e681.r2.dev/";

function fixUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("r2.cloudflarestorage.com")) return url;
  const match = url.match(/^https:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/);
  if (match) return PUBLIC_R2_BASE + match[1];
  return url;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    let offset = 0;
    const batchSize = 50;
    let fixed = 0;
    let checked = 0;

    while (true) {
      const posts = await base44.asServiceRole.entities.CommunityPost.list("-created_date", batchSize, offset);
      if (!posts || posts.length === 0) break;

      for (const post of posts) {
        checked++;
        const updates = {};
        let needsUpdate = false;

        const newImageUrl = fixUrl(post.image_url);
        if (newImageUrl !== post.image_url) { updates.image_url = newImageUrl; needsUpdate = true; }

        const newVideoUrl = fixUrl(post.video_url);
        if (newVideoUrl !== post.video_url) { updates.video_url = newVideoUrl; needsUpdate = true; }

        if (post.image_urls?.length > 0) {
          const newImageUrls = post.image_urls.map(fixUrl);
          if (newImageUrls.some((u, i) => u !== post.image_urls[i])) {
            updates.image_urls = newImageUrls;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await base44.asServiceRole.entities.CommunityPost.update(post.id, updates);
          fixed++;
          console.log(`[fixR2Urls] Fixed post ${post.id}`);
        }
      }

      if (posts.length < batchSize) break;
      offset += batchSize;
    }

    return Response.json({ success: true, checked, fixed });
  } catch (err) {
    console.error("[fixR2Urls] Error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});