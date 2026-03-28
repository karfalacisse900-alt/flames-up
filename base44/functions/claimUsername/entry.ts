import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const FULLNAME_RE = /^[a-zA-Z ]{3,50}$/;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { username, full_name } = await req.json();

    // ── Validate username ──────────────────────────────────────────────────
    if (!username || !USERNAME_RE.test(username)) {
      return Response.json({
        error: "Username must be 3–20 characters and contain only letters, numbers, or underscores."
      }, { status: 400 });
    }

    // ── Validate full name ─────────────────────────────────────────────────
    if (!full_name || !FULLNAME_RE.test(full_name.trim())) {
      return Response.json({
        error: "Full name must be 3–50 characters and contain only letters and spaces."
      }, { status: 400 });
    }

    const normalizedUsername = username.toLowerCase();

    // ── Check uniqueness (case-insensitive, atomic read) ───────────────────
    // Fetch all users with this username (ignoring the requesting user)
    const existing = await base44.asServiceRole.entities.User.list("-created_date", 5000);
    // Only block if another user has explicitly confirmed/claimed this username
    // Auto-generated usernames (from onSignup) are not confirmed and don't block claims
    const taken = existing.some(
      u => u.username?.toLowerCase() === normalizedUsername &&
           u.email !== user.email &&
           u.username_confirmed === true
    );

    if (taken) {
      return Response.json({ error: "That username is already taken. Please choose another." }, { status: 409 });
    }

    // ── Prevent username changes after it's been set (non-generated) ───────
    // Auto-generated usernames follow the pattern: adjective+noun+3digits
    // Users can claim once; after that, changing requires admin approval
    const GENERATED_PATTERN = /^[a-z]+[a-z]+\d{3}$/;
    if (user.username && !GENERATED_PATTERN.test(user.username) && user.username !== username) {
      return Response.json({
        error: "Username cannot be changed after it has been set. Contact support for assistance."
      }, { status: 403 });
    }

    // ── Persist ────────────────────────────────────────────────────────────
    await base44.auth.updateMe({
      username: normalizedUsername,
      full_name: full_name.trim(),
      username_confirmed: true,
    });

    console.log(`Username claimed: ${normalizedUsername} by ${user.email}`);
    return Response.json({ success: true, username: normalizedUsername });

  } catch (error) {
    console.error("claimUsername error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});