import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admin users to run this sync
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    console.log('Starting full data sync to Supabase...');

    // 1. Sync all users to profiles table
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`Found ${allUsers.length} users to sync`);

    let usersSynced = 0;
    let usersSkipped = 0;

    for (const u of allUsers) {
      try {
        console.log(`Syncing user: ${u.email} (ID: ${u.id})`);
        
        const userData = {
          id: String(u.id),
          email: u.email,
          full_name: u.full_name || null,
          display_name: u.display_name || null,
          username: u.username || null,
          avatar_url: u.avatar_url || null,
          bio: u.bio || null,
          about_me: u.about_me || null,
          role: u.role || 'user',
          is_creator: u.is_creator || false,
          profile_theme: u.profile_theme || 'default',
          badges: u.badges || [],
          created_at: u.created_date,
          updated_at: u.updated_date || u.created_date,
        };

        console.log(`User data prepared:`, JSON.stringify(userData, null, 2));

        const { data, error } = await supabase
          .from('profiles')
          .upsert(userData, { 
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ Error syncing user ${u.email}:`, error);
          console.error(`Error details:`, JSON.stringify(error, null, 2));
          usersSkipped++;
        } else {
          console.log(`✅ Successfully synced user ${u.email}`);
          usersSynced++;
        }
      } catch (err) {
        console.error(`❌ Exception syncing user ${u.email}:`, err);
        console.error(`Exception stack:`, err.stack);
        usersSkipped++;
      }
    }

    // 2. Sync all community posts
    const allPosts = await base44.asServiceRole.entities.CommunityPost.list();
    console.log(`Found ${allPosts.length} community posts to sync`);

    let postsSynced = 0;
    let postsSkipped = 0;

    for (const post of allPosts) {
      try {
        console.log(`Syncing post: ${post.id} by ${post.author_email}`);
        
        const postData = {
          id: String(post.id),
          author_email: post.author_email,
          author_name: post.author_name || null,
          type: post.type || 'text',
          content: post.content || post.text || null,
          media_urls: post.media_urls || [],
          location_name: post.location_name || null,
          location_city: post.location_city || null,
          location_lat: post.location_lat || null,
          location_lng: post.location_lng || null,
          upvotes: post.upvotes || 0,
          upvoted_by: post.upvoted_by || [],
          downvotes: post.downvotes || 0,
          comment_count: post.comment_count || 0,
          engagement_score: post.engagement_score || 0,
          group_id: post.group_id ? String(post.group_id) : null,
          is_pinned: post.is_pinned || false,
          moderation_status: post.moderation_status || 'approved',
          created_at: post.created_date,
          updated_at: post.updated_date || post.created_date,
        };

        console.log(`Post data prepared:`, JSON.stringify(postData, null, 2));

        const { data, error } = await supabase
          .from('posts')
          .upsert(postData, { 
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ Error syncing post ${post.id}:`, error);
          console.error(`Error details:`, JSON.stringify(error, null, 2));
          postsSkipped++;
        } else {
          console.log(`✅ Successfully synced post ${post.id}`);
          postsSynced++;
        }
      } catch (err) {
        console.error(`❌ Exception syncing post ${post.id}:`, err);
        console.error(`Exception stack:`, err.stack);
        postsSkipped++;
      }
    }

    const summary = {
      success: true,
      users: {
        total: allUsers.length,
        synced: usersSynced,
        skipped: usersSkipped,
      },
      posts: {
        total: allPosts.length,
        synced: postsSynced,
        skipped: postsSkipped,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Sync completed:', summary);

    return Response.json(summary, { status: 200 });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});