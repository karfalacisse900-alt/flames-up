import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.email;
    console.log(`[deleteUserAccount] Starting deletion for ${email}`);

    // Delete all user-owned data in parallel
    const deleteAll = async (entityName, field) => {
      try {
        const records = await base44.asServiceRole.entities[entityName].filter({ [field]: email });
        await Promise.all(records.map(r => base44.asServiceRole.entities[entityName].delete(r.id)));
        console.log(`[deleteUserAccount] Deleted ${records.length} ${entityName} records`);
      } catch (err) {
        console.error(`[deleteUserAccount] Error deleting ${entityName}:`, err.message);
      }
    };

    await Promise.all([
      deleteAll('CommunityPost', 'author_email'),
      deleteAll('Post', 'author_email'),
      deleteAll('Reply', 'author_email'),
      deleteAll('VoiceReply', 'author_email'),
      deleteAll('Follow', 'follower_email'),
      deleteAll('Follow', 'following_email'),
      deleteAll('DirectMessage', 'sender_email'),
      deleteAll('DirectMessage', 'receiver_email'),
      deleteAll('Notification', 'recipient_email'),
      deleteAll('CoinTransaction', 'user_email'),
      deleteAll('ArtPiece', 'creator_email'),
      deleteAll('Report', 'reporter_email'),
      deleteAll('SavedPost', 'user_email'),
      deleteAll('SavedItem', 'user_email'),
      deleteAll('BlockedUser', 'blocker_email'),
      deleteAll('FriendRequest', 'sender_email'),
      deleteAll('FriendRequest', 'receiver_email'),
    ]);

    // Mark account as deleted — platform will handle auth cleanup
    await base44.auth.updateMe({ account_deleted: true, email_masked: true });

    console.log(`[deleteUserAccount] Done for ${email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('[deleteUserAccount] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});