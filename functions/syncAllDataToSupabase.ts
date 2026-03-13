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
    const LIMIT = 100; // Sync all users and posts

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
          content: post.content || post.text || null,
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