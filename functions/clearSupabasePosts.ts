import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete all posts from Supabase community_posts table
    const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/community_posts?id=gt.0`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      console.error("Delete failed:", deleteRes.status, errText);
      return Response.json({ error: "Delete failed", details: errText }, { status: 500 });
    }

    console.log("Cleared all posts from Supabase community_posts table");
    return Response.json({ 
      success: true, 
      message: "All posts cleared from Supabase community_posts table" 
    });

  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});