import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Starting focused sync (limit 5 for testing)...');

    const errors = [];
    const LIMIT = 5; // Test with 5 records first

    // Hard-coded entity names based on schema
    const USER_ENTITY = 'User';
    const POST_ENTITY = 'CommunityPost';

    let usersSynced = 0;
    let postsSynced = 0;

    // Step 1: Sync users
    console.log(`\nFetching users from ${USER_ENTITY}...`);
    const allUsers = await base44.asServiceRole.entities[USER_ENTITY].list();
    const usersToSync = allUsers.slice(0, LIMIT);
    console.log(`Syncing ${usersToSync.length} of ${allUsers.length} users...`);

    for (let i = 0; i < usersToSync.length; i++) {
      const u = usersToSync[i];
      try {
        console.log(`[${i + 1}/${usersToSync.length}] User: ${u.email || u.id}`);
        
        const userData = {
          id: String(u.id),
          email: u.email || '',
          full_name: u.full_name || null,
          display_name: u.display_name || null,
          username: u.username || null,
          avatar_url: u.avatar_url || null,
          bio: u.bio || null,
          about_me: u.about_me || null,
          role: u.role || 'user',
          is_creator: Boolean(u.is_creator),
          profile_theme: u.profile_theme || 'default',
          badges: Array.isArray(u.badges) ? u.badges : [],
          created_at: u.created_date || new Date().toISOString(),
          updated_at: u.updated_date || u.created_date || new Date().toISOString(),
        };

        const { error } = await supabase
          .from('profiles')
          .upsert(userData, { onConflict: 'id', ignoreDuplicates: false });

        if (error) {
          console.error(`  ❌ FAILED:`, error.message);
          errors.push({
            type: 'user',
            email: u.email,
            id: String(u.id),
            error: error.message,
            details: error
          });
        } else {
          console.log(`  ✅ SUCCESS`);
          usersSynced++;
        }
      } catch (err) {
        console.error(`  ❌ EXCEPTION:`, err.message);
        errors.push({
          type: 'user',
          email: u.email,
          id: String(u.id),
          error: err.message
        });
      }
    }

    // Step 2: Sync posts
    console.log(`\nFetching posts from ${POST_ENTITY}...`);
    const allPosts = await base44.asServiceRole.entities[POST_ENTITY].list();
    const postsToSync = allPosts.slice(0, LIMIT);
    console.log(`Syncing ${postsToSync.length} of ${allPosts.length} posts...`);

    for (let i = 0; i < postsToSync.length; i++) {
      const post = postsToSync[i];
      try {
        console.log(`[${i + 1}/${postsToSync.length}] Post: ${post.id}`);
        
        const postData = {
          id: String(post.id),
          author_email: post.author_email || '',
          author_name: post.author_name || null,
          type: post.type || 'text',
          content: post.content || post.text || null,
          media_urls: Array.isArray(post.media_urls) ? post.media_urls : [],
          location_name: post.location_name || null,
          location_city: post.location_city || null,
          location_lat: post.location_lat || null,
          location_lng: post.location_lng || null,
          upvotes: Number(post.upvotes) || 0,
          upvoted_by: Array.isArray(post.upvoted_by) ? post.upvoted_by : [],
          downvotes: Number(post.downvotes) || 0,
          comment_count: Number(post.comment_count) || 0,
          engagement_score: Number(post.engagement_score) || 0,
          group_id: post.group_id ? String(post.group_id) : null,
          is_pinned: Boolean(post.is_pinned),
          moderation_status: post.moderation_status || 'approved',
          created_at: post.created_date || new Date().toISOString(),
          updated_at: post.updated_date || post.created_date || new Date().toISOString(),
        };

        const { error } = await supabase
          .from('posts')
          .upsert(postData, { onConflict: 'id', ignoreDuplicates: false });

        if (error) {
          console.error(`  ❌ FAILED:`, error.message);
          errors.push({
            type: 'post',
            id: String(post.id),
            author: post.author_email,
            error: error.message,
            details: error
          });
        } else {
          console.log(`  ✅ SUCCESS`);
          postsSynced++;
        }
      } catch (err) {
        console.error(`  ❌ EXCEPTION:`, err.message);
        errors.push({
          type: 'post',
          id: String(post.id),
          author: post.author_email,
          error: err.message
        });
      }
    }

    const summary = {
      success: true,
      mode: `TEST MODE (limit: ${LIMIT})`,
      users: {
        total_available: allUsers.length,
        synced: usersSynced,
        failed: usersToSync.length - usersSynced,
      },
      posts: {
        total_available: allPosts.length,
        synced: postsSynced,
        failed: postsToSync.length - postsSynced,
      },
      errors: errors,
      error_count: errors.length,
      timestamp: new Date().toISOString(),
    };

    console.log('\n=== SYNC COMPLETE ===');
    console.log(JSON.stringify(summary, null, 2));

    return Response.json(summary, { status: 200 });
  } catch (error) {
    console.error('Fatal sync error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});