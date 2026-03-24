import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { username } = await req.json();
  if (!username) return Response.json({ available: true });

  const normalized = username.startsWith("@") ? username : `@${username}`;

  // Check UserProfile entity
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ username: normalized });
  const taken = profiles.some(p => p.user_email !== user.email);

  return Response.json({ available: !taken });
});