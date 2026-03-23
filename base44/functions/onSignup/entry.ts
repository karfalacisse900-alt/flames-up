import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const ADJECTIVES = ["calm", "moon", "soft", "wild", "cool", "bright", "quiet", "swift", "deep", "warm", "crisp", "pure", "bold", "vast", "still"];
const NOUNS = ["walker", "reader", "dreamer", "seeker", "thinker", "coder", "artist", "writer", "builder", "mover", "maker", "runner", "rider", "mind", "soul"];

function generateUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${noun}${num}`;
}

function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += "-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only run if user doesn't already have a username/referral code
    if (user.username && user.referral_code) {
      return Response.json({ message: "Already initialized", username: user.username, referral_code: user.referral_code });
    }

    const updates = {};

    // Generate unique username
    if (!user.username) {
      const allUsers = await base44.asServiceRole.entities.User.list("-created_date", 1000);
      const existingUsernames = new Set(allUsers.map(u => u.username).filter(Boolean));
      let username = generateUsername();
      let attempts = 0;
      while (existingUsernames.has(username) && attempts < 20) {
        username = generateUsername();
        attempts++;
      }
      updates.username = username;
    }

    // Generate unique referral code
    if (!user.referral_code) {
      const allUsers = await base44.asServiceRole.entities.User.list("-created_date", 1000);
      const existingCodes = new Set(allUsers.map(u => u.referral_code).filter(Boolean));
      let code = generateReferralCode();
      let attempts = 0;
      while (existingCodes.has(code) && attempts < 20) {
        code = generateReferralCode();
        attempts++;
      }
      updates.referral_code = code;
    }

    if (Object.keys(updates).length > 0) {
      await base44.auth.updateMe(updates);
      console.log(`Initialized user ${user.email}: username=${updates.username}, referral=${updates.referral_code}`);
    }

    // Sync new user to Supabase profiles table - await properly
    try {
      const freshUser = await base44.auth.me();
      
      // Deterministic UUID from user id — same user always maps to same Supabase row
      const encoder = new TextEncoder();
      const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(String(freshUser.id)));
      const hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,"0")).join("");
      const profileId = `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-${hex.slice(16,17)}${hex.slice(17,20)}-${hex.slice(20,32)}`;

      const profileRecord = {
        id: profileId,
        email: freshUser.email || 'unknown@flames-up.com',
        full_name: freshUser.full_name || freshUser.display_name || freshUser.username || freshUser.email?.split('@')[0] || 'User',
        avatar_url: freshUser.avatar_url || null,
        updated_at: new Date().toISOString(),
      };
      
      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates",
        },
        body: JSON.stringify(profileRecord),
      });
      
      if (!sbRes.ok) {
        const errText = await sbRes.text();
        console.error("Supabase profile sync failed:", sbRes.status, errText);
      } else {
        console.log(`Synced new user ${freshUser.email} to Supabase profiles`);
      }
    } catch (sbErr) {
      console.error("Supabase sync error (non-fatal):", sbErr.message);
    }

    return Response.json({ success: true, ...updates });
  } catch (error) {
    console.error("onSignup error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});