import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Starting auto-discovery sync...');

    const errors = [];

    // All possible entity names from the schema
    const allEntityNames = [
      'User', 'Post', 'CommunityPost', 'Reply', 'ArtPiece', 'DiscoverItem',
      'LiveRoom', 'LiveMessage', 'GameStats', 'Report', 'Follow', 'DirectMessage',
      'ArtTrade', 'VoiceReply', 'CoinWallet', 'CoinTransaction', 'ArtVoiceComment',
      'DiscoverReview', 'DiscoverPost', 'DiscoverPostReply', 'SavedItem',
      'CategoryFollow', 'Referral', 'Notification', 'ServicePerson',
      'ServicePersonReview', 'ServicePersonPortfolio', 'UserCollection',
      'CollectionItem', 'ArtFightEntry', 'ArtFightVote', 'ModerationReport',
      'ArtFightFavorite', 'ArtFightHistory', 'DiscoverFeedback', 'Product',
      'MediaItem', 'MediaRating', 'MediaSave', 'CommunityComment',
      'CommunityDebate', 'ModerationRule', 'Artwork', 'ArtComment', 'StoreVote',
      'ContentRating', 'Game', 'UserSubmittedMedia', 'UserMediaReview',
      'DidYouKnow', 'PhotoChallenge', 'ChallengeEntry', 'BoostOrder', 'Group',
      'GroupMember', 'GroupEvent', 'GroupPostReport', 'GroupGame', 'GroupReaction',
      'PostDraft', 'SavedPost', 'DYKComment', 'DailyChallenge', 'SavedPlace',
      'HostReview', 'BlockedUser', 'LocationPresence', 'LocationTip',
      'LocationFollow', 'CreatorApplication', 'LiveStream', 'LiveStreamChat',
      'MusicTrack', 'GroupChat', 'GroupMessage', 'CreatorStatus', 'UserProfile',
      'Poll', 'GroupReview'
    ];

    // Step 1: Discover entities with target counts
    console.log('Discovering entities...');
    const entityCounts = {};
    let userEntityName = null;
    let postEntityName = null;

    for (const entityName of allEntityNames) {
      try {
        const records = await base44.asServiceRole.entities[entityName].list();
        const count = records.length;
        entityCounts[entityName] = count;
        
        if (count === 11) {
          console.log(`✅ Found entity with 11 records: ${entityName}`);
          userEntityName = entityName;
        }
        if (count === 33) {
          console.log(`✅ Found entity with 33 records: ${entityName}`);
          postEntityName = entityName;
        }
        
        if (count > 0) {
          console.log(`  ${entityName}: ${count} records`);
        }
      } catch (err) {
        // Entity doesn't exist or error accessing it
      }
    }

    console.log(`\nUser entity: ${userEntityName || 'NOT FOUND'}`);
    console.log(`Post entity: ${postEntityName || 'NOT FOUND'}`);

    if (!userEntityName) {
      errors.push({
        type: 'discovery',
        error: 'Could not find entity with exactly 11 records',
        entity_counts: entityCounts
      });
    }

    if (!postEntityName) {
      errors.push({
        type: 'discovery',
        error: 'Could not find entity with exactly 33 records',
        entity_counts: entityCounts
      });
    }

    let usersSynced = 0;
    let postsSynced = 0;

    // Step 2: Sync users if found
    if (userEntityName) {
      const allUsers = await base44.asServiceRole.entities[userEntityName].list();
      console.log(`\nSyncing ${allUsers.length} users from ${userEntityName}...`);

      for (let i = 0; i < allUsers.length; i++) {
        const u = allUsers[i];
        try {
          console.log(`[${i + 1}/${allUsers.length}] User: ${u.email || u.id}`);
          
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
              entity: userEntityName,
              id: String(u.id),
              error: error.message
            });
          } else {
            console.log(`  ✅ SUCCESS`);
            usersSynced++;
          }
        } catch (err) {
          console.error(`  ❌ EXCEPTION:`, err.message);
          errors.push({
            type: 'user',
            entity: userEntityName,
            id: String(u.id),
            error: err.message
          });
        }
      }
    }

    // Step 3: Sync posts if found
    if (postEntityName) {
      const allPosts = await base44.asServiceRole.entities[postEntityName].list();
      console.log(`\nSyncing ${allPosts.length} posts from ${postEntityName}...`);

      for (let i = 0; i < allPosts.length; i++) {
        const post = allPosts[i];
        try {
          console.log(`[${i + 1}/${allPosts.length}] Post: ${post.id}`);
          
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
              entity: postEntityName,
              id: String(post.id),
              error: error.message
            });
          } else {
            console.log(`  ✅ SUCCESS`);
            postsSynced++;
          }
        } catch (err) {
          console.error(`  ❌ EXCEPTION:`, err.message);
          errors.push({
            type: 'post',
            entity: postEntityName,
            id: String(post.id),
            error: err.message
          });
        }
      }
    }

    const summary = {
      success: true,
      discovery: {
        user_entity: userEntityName,
        post_entity: postEntityName,
        all_entity_counts: Object.entries(entityCounts)
          .filter(([_, count]) => count > 0)
          .reduce((acc, [name, count]) => ({ ...acc, [name]: count }), {})
      },
      users: {
        entity: userEntityName,
        synced: usersSynced,
        failed: userEntityName ? (11 - usersSynced) : 0,
      },
      posts: {
        entity: postEntityName,
        synced: postsSynced,
        failed: postEntityName ? (33 - postsSynced) : 0,
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