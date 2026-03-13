import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Starting full data sync to Supabase...');

    const errors = [];

    // 1. Sync ALL users to profiles table
    console.log('Attempting to fetch users...');
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`Found ${allUsers.length} users in User entity`);

    let usersSynced = 0;

    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i];
      try {
        console.log(`[${i + 1}/${allUsers.length}] Syncing user: ${u.email} (ID: ${u.id})`);
        
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

        const { data, error } = await supabase
          .from('profiles')
          .upsert(userData, { 
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ FAILED user ${u.email}:`, error);
          errors.push({
            type: 'user',
            email: u.email,
            id: String(u.id),
            error: error.message,
            details: error
          });
        } else {
          console.log(`✅ SUCCESS user ${u.email}`);
          usersSynced++;
        }
      } catch (err) {
        console.error(`❌ EXCEPTION user ${u.email}:`, err);
        errors.push({
          type: 'user',
          email: u.email,
          id: String(u.id),
          error: err.message,
          stack: err.stack
        });
      }
    }

    // 2. Sync ALL posts - try both CommunityPost and Post entities
    console.log('Attempting to fetch posts...');
    let allPosts = [];
    try {
      allPosts = await base44.asServiceRole.entities.CommunityPost.list();
      console.log(`Found ${allPosts.length} posts in CommunityPost entity`);
    } catch (err) {
      console.log('CommunityPost entity not found, trying Post entity...');
      try {
        allPosts = await base44.asServiceRole.entities.Post.list();
        console.log(`Found ${allPosts.length} posts in Post entity`);
      } catch (err2) {
        console.error('Could not find posts in either CommunityPost or Post entity');
        errors.push({
          type: 'fatal',
          error: 'No post entity found',
          details: `CommunityPost error: ${err.message}, Post error: ${err2.message}`
        });
      }
    }

    let postsSynced = 0;

    for (let i = 0; i < allPosts.length; i++) {
      const post = allPosts[i];
      try {
        console.log(`[${i + 1}/${allPosts.length}] Syncing post: ${post.id}`);
        
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

        const { data, error } = await supabase
          .from('posts')
          .upsert(postData, { 
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ FAILED post ${post.id}:`, error);
          errors.push({
            type: 'post',
            id: String(post.id),
            author: post.author_email,
            error: error.message,
            details: error
          });
        } else {
          console.log(`✅ SUCCESS post ${post.id}`);
          postsSynced++;
        }
      } catch (err) {
        console.error(`❌ EXCEPTION post ${post.id}:`, err);
        errors.push({
          type: 'post',
          id: String(post.id),
          author: post.author_email,
          error: err.message,
          stack: err.stack
        });
      }
    }

    const summary = {
      success: true,
      users: {
        total: allUsers.length,
        synced: usersSynced,
        failed: allUsers.length - usersSynced,
      },
      posts: {
        total: allPosts.length,
        synced: postsSynced,
        failed: allPosts.length - postsSynced,
      },
      errors: errors,
      error_count: errors.length,
      timestamp: new Date().toISOString(),
    };

    console.log('Sync completed:', JSON.stringify(summary, null, 2));

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