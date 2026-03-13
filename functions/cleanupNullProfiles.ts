import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admin can run cleanup
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all profiles where full_name is NULL
    const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?full_name=is.null&select=id,email,full_name`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      throw new Error(`Fetch failed: ${fetchRes.status} - ${errText}`);
    }

    const nullProfiles = await fetchRes.json();
    console.log(`Found ${nullProfiles.length} profiles with NULL full_name`);

    // Delete each one
    let deleted = 0;
    for (const profile of nullProfiles) {
      const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });

      if (deleteRes.ok) {
        deleted++;
        console.log(`Deleted profile: ${profile.id} (${profile.email})`);
      } else {
        console.error(`Failed to delete profile ${profile.id}:`, await deleteRes.text());
      }
    }

    return Response.json({ 
      success: true, 
      found: nullProfiles.length,
      deleted,
      message: `Cleanup complete: ${deleted}/${nullProfiles.length} NULL profiles deleted`
    });
  } catch (error) {
    console.error("Cleanup error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});