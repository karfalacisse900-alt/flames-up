import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Convert any string into a deterministic v4-format UUID so Supabase UUID columns accept it
async function toUUID(str) {
  if (!str) return null;
  // If already a valid UUID, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) return str;
  // Hash the string using SHA-256, then format first 32 hex chars as UUID
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  // Format as UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-${hex.slice(16,17)}${hex.slice(17,20)}-${hex.slice(20,32)}`;
}

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
  console.log(`[sync] ✅ upserted to ${table}:`, JSON.stringify(record));
}

async function supabaseDelete(table, id) {
  const uuid = await toUUID(id);
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${uuid}`;
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
  console.log(`[sync] 🗑 deleted from ${table} id=${uuid}`);
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
    const rawId = String(data?.id || event?.entity_id || "");

    console.log(`[sync] entity=${entityName} event=${eventType} rawId=${rawId}`);

    // ── DELETE ────────────────────────────────────────────────────────────
    if (eventType === "delete") {
      if (entityName === "CommunityPost") await supabaseDelete("posts", rawId);
      else if (entityName === "User") await supabaseDelete("profiles", rawId);
      else if (entityName === "Group") await supabaseDelete("communities", rawId);
      else if (entityName === "CommunityComment") await supabaseDelete("comments", rawId);
      else if (entityName === "Follow") await supabaseDelete("followers", rawId);
      return Response.json({ ok: true, action: "delete", entity: entityName });
    }

    // ── UPSERT — convert all IDs/emails to UUIDs ──────────────────────────
    const id = await toUUID(rawId);

    if (entityName === "User") {
      await supabaseUpsert("profiles", {
        id,
        email: data.email || "unknown@flames-up.com",
        full_name: data.full_name || data.display_name || data.username || "Anonymous",
        avatar_url: data.avatar_url || null,
        created_at: data.created_date || new Date().toISOString(),
      });

    } else if (entityName === "CommunityPost") {
      const userId = await toUUID(data.author_email || data.created_by || "");
      await supabaseUpsert("posts", {
        id,
        content: data.body || data.text || null,
        user_id: userId,
        media_url: data.video_url || data.image_url || (data.image_urls?.length > 0 ? data.image_urls[0] : null) || null,
        community_id: data.group_id ? await toUUID(data.group_id) : null,
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
      const userId = await toUUID(data.author_email || data.created_by || "");
      const postId = await toUUID(data.post_id || "");
      await supabaseUpsert("comments", {
        id,
        post_id: postId,
        user_id: userId,
        content: data.body || data.text || null,
        created_at: data.created_date || new Date().toISOString(),
      });

    } else if (entityName === "Follow") {
      const followerId = await toUUID(data.follower_email || data.created_by || "");
      const followingId = await toUUID(data.following_email || "");
      await supabaseUpsert("followers", {
        id,
        follower_id: followerId,
        following_id: followingId,
        created_at: data.created_date || new Date().toISOString(),
      });

    } else {
      console.log(`[sync] skipped entity=${entityName}`);
      return Response.json({ ok: true, skipped: true, entity: entityName });
    }

    return Response.json({ ok: true, entity: entityName, id });
  } catch (error) {
    console.error(`[sync] ❌ Fatal:`, error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});