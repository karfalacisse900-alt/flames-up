import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: "Supabase credentials not configured" }, { status: 500 });
    }

    // Delete profile row by email (the unique key we rely on)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(user.email)}`,
      {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[deleteProfile] Supabase delete failed: ${res.status} - ${errText}`);
      return Response.json({ error: "Failed to delete Supabase profile" }, { status: 500 });
    }

    console.log(`[deleteProfile] Deleted Supabase profile for ${user.email}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[deleteProfile] error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});