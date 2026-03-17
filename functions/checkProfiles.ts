import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    // Fetch all profiles
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name,created_at&order=email.asc,created_at.asc`, {
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    });
    const profiles = await res.json();

    // Find duplicates by email
    const byEmail = {};
    for (const p of profiles) {
      if (!p.email) continue;
      if (!byEmail[p.email]) byEmail[p.email] = [];
      byEmail[p.email].push(p);
    }

    const duplicates = Object.entries(byEmail)
      .filter(([, rows]) => rows.length > 1)
      .map(([email, rows]) => ({ email, count: rows.length, rows }));

    // Auto-delete duplicate rows (keep the oldest one = first by created_at)
    const deleted = [];
    for (const { email, rows } of duplicates) {
      const toDelete = rows.slice(1); // keep first, delete rest
      for (const row of toDelete) {
        const delRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${row.id}`, {
          method: "DELETE",
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          }
        });
        console.log(`Deleted duplicate profile id=${row.id} email=${email} status=${delRes.status}`);
        deleted.push({ id: row.id, email });
      }
    }

    return Response.json({
      total_profiles: profiles.length,
      duplicate_emails: duplicates.length,
      duplicates: duplicates.map(d => ({ email: d.email, count: d.count, ids: d.rows.map(r => r.id) })),
      deleted_duplicates: deleted,
    });
  } catch (error) {
    console.error("checkProfiles error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});