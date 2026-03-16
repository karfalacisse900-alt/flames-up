import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function supabaseUpsert(table, record) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase upsert to '${table}' failed: ${res.status} - ${errText}`);
  }
  console.log(`[sync] upserted to ${table}:`, JSON.stringify(record));
}

async function supabaseDelete(table, id) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase delete from '${table}' failed: ${res.status} - ${errText}`);
  }
  console.log(`[sync] deleted from ${table} id=${id}`);
}

Deno.serve(async (req) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: "Supabase credentials not configured" }, { status: 500 });
    }

    const payload = await req.json();
    const { event, data } = payload;
    const entityName = event?.entity_name;
    const eventType = event?.type;
    const id = String(data?.id || event?.entity_id);

    console.log(`[sync] entity=${entityName} event=${eventType} id=${id}`);

    // ── DELETE ────────────────────────────────────────────────────────────
    if (eventType === "delete") {
      if (entityName === "CommunityPost") await supabaseDelete("posts", id);
      else if (entityName === "User") await supabaseDelete("profiles", id);
      else if (entityName === "Group") await supabaseDelete("communities", id);
      else if (entityName === "CommunityComment") await supabaseDelete("comments", id);
      else if (entityName === "Follow") await supabaseDelete("followers", id);
      // Likes are soft-deleted by the app; ignore hard delete
      return Response.json({ ok: true, action: "delete", entity: entityName });
    }

    // ── UPSERT ────────────────────────────────────────────────────────────
    if (entityName === "User") {
      await supabaseUpsert("profiles", {
        id,
        email: data.email || "unknown@flames-up.com",
        full_name: data.full_name || data.display_name || data.username || "Anonymous",
        avatar_url: data.avatar_url || null,
        created_at: data.created_date || new Date().toISOString(),
      });

    } else if (entityName === "CommunityPost") {
      await supabaseUpsert("posts", {
        id,
        content: data.body || data.text || null,
        user_id: String(data.author_email || data.created_by || ""),
        media_url: data.video_url || data.image_url || (data.image_urls?.length > 0 ? data.image_urls[0] : null) || null,
        community_id: data.group_id ? String(data.group_id) : null,
        created_at: data.created_date || new Date().toISOString(),
      });

    } else if (entityName === "Group") {
      await supabaseUpsert("communities", {
        id,
        name: data.name || null,
        description: data.description || null,
        created_at: data.created_date || new Date().toISOString(),
      });

    } else if (entityName === "CommunityComment") {
      await supabaseUpsert("comments", {
        id,
        post_id: String(data.post_id || ""),
        user_id: String(data.author_email || data.created_by || ""),
        content: data.body || data.text || null,
        created_at: data.created_date || new Date().toISOString(),
      });

    } else if (entityName === "Follow") {
      await supabaseUpsert("followers", {
        id,
        follower_id: String(data.follower_email || data.created_by || ""),
        following_id: String(data.following_email || ""),
        created_at: data.created_date || new Date().toISOString(),
      });

    } else if (entityName === "CoinTransaction" || entityName === "LikeEvent") {
      // generic like tracking — store in likes table if columns match
      await supabaseUpsert("likes", {
        id,
        post_id: String(data.ref_id || data.post_id || ""),
        user_id: String(data.user_email || data.created_by || ""),
        created_at: data.created_date || new Date().toISOString(),
      });

    } else {
      console.log(`[sync] skipped entity=${entityName}`);
      return Response.json({ ok: true, skipped: true, entity: entityName });
    }

    return Response.json({ ok: true, entity: entityName, id });
  } catch (error) {
    console.error(`[sync] Fatal:`, error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});