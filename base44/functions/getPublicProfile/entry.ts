import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { email } = await req.json();
  if (!email) return Response.json({ error: 'email required' }, { status: 400 });

  // Check UserProfile entity first (public data, always up to date)
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: email });
  if (profiles.length > 0) {
    return Response.json({ profile: profiles[0] });
  }

  // Fallback: read from User entity with service role
  const allUsers = await base44.asServiceRole.entities.User.list("-created_date", 2000);
  const found = allUsers.find(u => u.email === email);
  if (!found) return Response.json({ profile: null });

  const profileData = {
    user_email: found.email,
    user_name: found.full_name || found.display_name || found.email?.split("@")[0] || "User",
    display_name: found.display_name || found.full_name || "",
    username: found.username || "",
    bio: found.bio || "",
    about_me: found.about_me || "",
    avatar_url: found.avatar_url || "",
    banner_url: found.banner_url || "",
    city: found.city || "",
    age: found.age ? String(found.age) : "",
    major: found.major || "",
    graduation_year: found.graduation_year ? String(found.graduation_year) : "",
    hobbies: found.hobbies || "",
    website: found.website || found.website_url || "",
    tiktok: found.tiktok || "",
    instagram: found.instagram || "",
    interests: found.interests || [],
    looking_for: found.looking_for || [],
    profile_theme: found.profile_theme || "default",
  };

  // Auto-create UserProfile for future fast lookups
  await base44.asServiceRole.entities.UserProfile.create(profileData).catch(() => {});

  return Response.json({ profile: profileData });
});