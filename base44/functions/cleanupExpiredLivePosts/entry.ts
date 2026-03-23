import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allPosts = await base44.asServiceRole.entities.LivePost.list();
    const now = new Date();
    const expired = allPosts.filter(p => new Date(p.expires_at) <= now);

    console.log(`Found ${expired.length} expired live posts to delete`);

    let deleted = 0;
    for (const post of expired) {
      try {
        await base44.asServiceRole.entities.LivePost.delete(post.id);
        deleted++;
      } catch (err) {
        console.error(`Failed to delete post ${post.id}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      total_posts: allPosts.length,
      expired_posts: expired.length,
      deleted_posts: deleted,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});