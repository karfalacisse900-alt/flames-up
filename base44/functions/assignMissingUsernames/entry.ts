import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ADJECTIVES = ["calm", "moon", "soft", "wild", "cool", "bright", "quiet", "swift", "deep", "warm", "crisp", "pure", "bold", "vast", "still", "brave", "keen", "wise", "sharp", "clear"];
const NOUNS = ["walker", "reader", "dreamer", "seeker", "thinker", "coder", "artist", "writer", "builder", "mover", "maker", "runner", "rider", "mind", "soul", "spark", "wave", "light", "star", "path"];

function generateUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${noun}${num}`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const allUsers = await base44.asServiceRole.entities.User.list("-created_date", 2000);
  const existingUsernames = new Set(allUsers.map(u => u.username).filter(Boolean));

  let assigned = 0;
  for (const u of allUsers) {
    if (u.username) continue;
    let username = generateUsername();
    let attempts = 0;
    while (existingUsernames.has(username) && attempts < 30) {
      username = generateUsername();
      attempts++;
    }
    existingUsernames.add(username);
    await base44.asServiceRole.entities.User.update(u.id, { username });
    assigned++;
  }

  return Response.json({ success: true, assigned });
});