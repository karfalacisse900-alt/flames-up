import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('Scanning all entities in the project...');

    // List of all possible entities based on the schema
    const entityNames = [
      'User',
      'Post',
      'CommunityPost',
      'Reply',
      'ArtPiece',
      'DiscoverItem',
      'LiveRoom',
      'LiveMessage',
      'GameStats',
      'Report',
      'Follow',
      'DirectMessage',
      'ArtTrade',
      'VoiceReply',
      'CoinWallet',
      'CoinTransaction',
      'ArtVoiceComment',
      'DiscoverReview',
      'DiscoverPost',
      'DiscoverPostReply',
      'SavedItem',
      'CategoryFollow',
      'Referral',
      'Notification',
      'ServicePerson',
      'ServicePersonReview',
      'ServicePersonPortfolio',
      'UserCollection',
      'CollectionItem',
      'ArtFightEntry',
      'ArtFightVote',
      'ModerationReport',
      'ArtFightFavorite',
      'ArtFightHistory',
      'DiscoverFeedback',
      'Product',
      'MediaItem',
      'MediaRating',
      'MediaSave',
      'CommunityComment',
      'CommunityDebate',
      'ModerationRule',
      'Artwork',
      'ArtComment',
      'StoreVote',
      'ContentRating',
      'Game',
      'UserSubmittedMedia',
      'UserMediaReview',
      'DidYouKnow',
      'PhotoChallenge',
      'ChallengeEntry',
      'BoostOrder',
      'Group',
      'GroupMember',
      'GroupEvent',
      'GroupPostReport',
      'GroupGame',
      'GroupReaction',
      'PostDraft',
      'SavedPost',
      'DYKComment',
      'DailyChallenge',
      'SavedPlace',
      'HostReview',
      'BlockedUser',
      'LocationPresence',
      'LocationTip',
      'LocationFollow',
      'CreatorApplication',
      'LiveStream',
      'LiveStreamChat',
      'MusicTrack',
      'GroupChat',
      'GroupMessage',
      'CreatorStatus',
      'UserProfile',
      'Poll',
      'GroupReview',
    ];

    const results = [];

    for (const entityName of entityNames) {
      try {
        const records = await base44.asServiceRole.entities[entityName].list();
        const count = records.length;
        
        if (count > 0) {
          console.log(`✅ ${entityName}: ${count} records`);
          results.push({
            entity: entityName,
            count: count,
            sample: records.slice(0, 2).map(r => ({
              id: r.id,
              created_date: r.created_date,
              ...Object.keys(r).slice(0, 3).reduce((acc, key) => {
                acc[key] = r[key];
                return acc;
              }, {})
            }))
          });
        } else {
          console.log(`⚪ ${entityName}: 0 records`);
        }
      } catch (err) {
        console.log(`❌ ${entityName}: Error - ${err.message}`);
      }
    }

    const summary = {
      total_entities_checked: entityNames.length,
      entities_with_data: results.length,
      results: results.sort((a, b) => b.count - a.count),
      timestamp: new Date().toISOString()
    };

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));

    return Response.json(summary, { status: 200 });
  } catch (error) {
    console.error('Fatal error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});