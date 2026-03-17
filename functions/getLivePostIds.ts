import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Same deterministic UUID logic used by syncToSupabase
async function toUUID(str) {
  if (!str) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) return str;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-${hex.slice(16,17)}${hex.slice(17,20)}-${hex.slice(20,32)}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { base44_ids } = await req.json();

    if (!Array.isArray(base44_ids) || base44_ids.length === 0) {
      return Response.json({ live_ids: [] });
    }

    // Convert all base44 IDs to their deterministic Supabase UUIDs
    const idMap = {};
    for (const rawId of base44_ids) {
      const uuid = await toUUID(rawId);
      idMap[rawId] = uuid;
    }

    const uuids = Object.values(idMap).filter(Boolean);

    // Check which UUIDs still exist in Supabase posts table
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=id&id=in.(${uuids.join(",")})`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        }
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase query failed:", err);
      // Return all as live if Supabase unreachable — fail open
      return Response.json({ live_ids: base44_ids });
    }

    const rows = await res.json();
    const liveUuids = new Set(rows.map(r => r.id));

    // Map back: return base44 IDs whose UUID still exists in Supabase
    const live_ids = base44_ids.filter(rawId => liveUuids.has(idMap[rawId]));

    console.log(`[getLivePostIds] checked ${base44_ids.length} posts, ${live_ids.length} still live in Supabase`);
    return Response.json({ live_ids });
  } catch (error) {
    console.error("[getLivePostIds] error:", error.message);
    // Fail open — don't block the feed
    return Response.json({ live_ids: [] });
  }
});