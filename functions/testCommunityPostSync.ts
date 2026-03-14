import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Try to get authenticated user, fallback to test user
    let user;
    try {
      user = await base44.auth.me();
    } catch (e) {
      console.log('No authenticated user, using test data');
      user = { email: 'test@example.com', full_name: 'Test User', avatar_url: null };
    }

    console.log('Creating test community post for user:', user.email);

    // Create test post in Base44
    const newPost = await base44.entities.CommunityPost.create({
      type: "standard",
      body: "Test post with video created at " + new Date().toISOString(),
      video_url: "https://example.com/test-video.mp4",
      author_email: user.email,
      author_name: user.full_name || user.email,
      author_avatar_url: user.avatar_url || null,
      upvotes: 0,
      upvoted_by: [],
      comment_count: 0,
      is_anonymous: false,
      tags: ["test"],
    });

    console.log('Base44 post created with ID:', newPost.id);

    // Sync to Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    const supabaseData = {
      id: newPost.id,
      content: newPost.body,
      media_url: newPost.video_url || newPost.image_url || null,
      user_id: newPost.author_email,
      full_name: newPost.author_name,
      avatar_url: newPost.author_avatar_url,
    };

    const { error: supabaseError } = await supabase
      .from("posts")
      .upsert(supabaseData, { onConflict: "id" });

    if (supabaseError) {
      console.error('Supabase sync error:', supabaseError);
      return Response.json({
        success: true,
        base44_post_id: newPost.id,
        supabase_sync: 'failed',
        supabase_error: supabaseError.message,
      });
    }

    console.log('Successfully synced to Supabase');

    return Response.json({
      success: true,
      base44_post_id: newPost.id,
      supabase_sync: 'success',
      message: 'Test post created and synced',
      post_data: supabaseData,
    });

  } catch (error) {
    console.error('Test script error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
});