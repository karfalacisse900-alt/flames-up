import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const allUsers = await base44.asServiceRole.entities.User.list("-created_date", 2000);
  const existingProfiles = await base44.asServiceRole.entities.UserProfile.list("-created_date", 2000);
  const profileMap = {};
  for (const p of existingProfiles) {
    profileMap[p.user_email] = p;
  }

  let created = 0, updated = 0;

  for (const u of allUsers) {
    if (!u.email) continue;
    const profileData = {
      user_email: u.email,
      user_name: u.full_name || u.display_name || u.email.split("@")[0],
      display_name: u.display_name || u.full_name || "",
      username: u.username || "",
      bio: u.bio || "",
      about_me: u.about_me || "",
      avatar_url: u.avatar_url || "",
      banner_url: u.banner_url || "",
      city: u.city || "",
      age: u.age ? String(u.age) : "",
      major: u.major || "",
      graduation_year: u.graduation_year ? String(u.graduation_year) : "",
      hobbies: u.hobbies || "",
      website: u.website || u.website_url || "",
      tiktok: u.tiktok || "",
      instagram: u.instagram || "",
      interests: u.interests || [],
      looking_for: u.looking_for || [],
      profile_theme: u.profile_theme || "default",
    };

    if (profileMap[u.email]) {
      // Update existing — merge so we don't overwrite richer data
      await base44.asServiceRole.entities.UserProfile.update(profileMap[u.email].id, profileData);
      updated++;
    } else {
      await base44.asServiceRole.entities.UserProfile.create(profileData);
      created++;
    }
  }

  return Response.json({ success: true, created, updated, total: allUsers.length });
});