import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Delete rows where full_name is NULL
    const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?full_name=is.null`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Prefer": "return=representation",
      },
    });

    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      console.error("Cleanup failed:", deleteRes.status, errText);
      return Response.json({ error: `Cleanup failed: ${errText}` }, { status: deleteRes.status });
    }

    const deleted = await deleteRes.json();
    console.log(`Deleted ${deleted.length} NULL full_name profiles`);

    return Response.json({ 
      success: true, 
      deleted_count: deleted.length,
      deleted_ids: deleted.map(p => p.id),
      message: `Removed ${deleted.length} test/incomplete profile records`
    });
  } catch (error) {
    console.error("Cleanup error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});