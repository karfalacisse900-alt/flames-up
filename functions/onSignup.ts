import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

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

    return Response.json({ success: true, ...updates });
  } catch (error) {
    console.error("onSignup error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});