import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { username } = await req.json();
  if (!username) return Response.json({ available: false, error: "No username provided" });

  // Validate format first
  const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
  if (!USERNAME_RE.test(username)) {
    return Response.json({ available: false, error: "Invalid username format" });
  }

  const normalized = username.toLowerCase();

  // Check User entity directly for uniqueness
  const allUsers = await base44.asServiceRole.entities.User.list("-created_date", 5000);
  // Only block if another user has EXPLICITLY claimed this username (username_confirmed = true)
  // Auto-generated usernames from onSignup are NOT confirmed and don't block claims
  const taken = allUsers.some(
    u => u.username?.toLowerCase() === normalized &&
         u.email !== user.email &&
         u.username_confirmed === true
  );

  return Response.json({ available: !taken });
});