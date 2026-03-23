import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 1);
    const posts = await base44.asServiceRole.entities.CommunityPost.list('-created_date', 1);

    const sampleUser = users?.[0] ?? null;
    const samplePost = posts?.[0] ?? null;

    console.log('DEBUG_BASE44_USER_RECORD', JSON.stringify(sampleUser, null, 2));
    console.log('DEBUG_BASE44_COMMUNITY_POST_RECORD', JSON.stringify(samplePost, null, 2));

    return Response.json({
      ok: true,
      sampleUser,
      samplePost,
    });
  } catch (error) {
    console.error('debugBase44Mappings error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});