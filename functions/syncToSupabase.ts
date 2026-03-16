import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Retry a fetch-based operation up to `maxRetries` times with exponential backoff
async function withRetry(fn, maxRetries = 3, label = "operation") {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`[syncToSupabase] ${label} failed (attempt ${attempt}/${maxRetries}): ${err.message}`);
      if (attempt < maxRetries) {
        const delay = 500 * Math.pow(2, attempt - 1); // 500ms, 1s, 2s
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

async function supabaseUpsert(table, record) {
  await withRetry(async () => {
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
  }, 3, `upsert:${table}`);
}

async function supabaseDelete(table, id) {
  await withRetry(async () => {
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
  }, 3, `delete:${table}`);
}

// Verify Supabase connectivity before proceeding
async function checkSupabaseConnection() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase unreachable: ${res.status}`);
}

Deno.serve(async (req) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[syncToSupabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return Response.json({ error: "Supabase credentials not configured" }, { status: 500 });
    }

    const payload = await req.json();
    const { event, data } = payload;
    const entityName = event?.entity_name;
    const eventType = event?.type;
    const id = String(data?.id || event?.entity_id);

    console.log(`[syncToSupabase] entity=${entityName} event=${eventType} id=${id}`);

    // Check connection before doing anything
    await checkSupabaseConnection();

    if (eventType === "delete") {
      if (entityName === "Post" || entityName === "CommunityPost") await supabaseDelete("posts", id);
      else if (entityName === "User") await supabaseDelete("profiles", id);
      else if (entityName === "Group") await supabaseDelete("communities", id);
      return Response.json({ ok: true, action: "delete", entity: entityName });
    }

    if (entityName === "User") {
      const record = {
        id,
        email: data.email || 'unknown@flames-up.com',
        full_name: data.full_name || data.display_name || data.username || 'Anonymous User',
        avatar_url: data.avatar_url || '',
      };
      console.log(`[syncToSupabase] Syncing User → profiles:`, JSON.stringify(record));
      await supabaseUpsert("profiles", record);

    } else if (entityName === "Post" || entityName === "CommunityPost") {
      const record = {
        id,
        content: data.body || data.text || null,
        created_at: data.created_date || new Date().toISOString(),
        user_id: String(data.created_by_id || data.author_email || data.created_by || null),
        media_url: data.video_url || data.image_url || (data.image_urls?.length > 0 ? data.image_urls[0] : null),
      };
      console.log(`[syncToSupabase] Syncing ${entityName} → posts:`, JSON.stringify(record));
      await supabaseUpsert("posts", record);

    } else if (entityName === "Group") {
      const record = {
        id,
        name: data.name || null,
        description: data.description || null,
      };
      console.log(`[syncToSupabase] Syncing Group → communities:`, JSON.stringify(record));
      await supabaseUpsert("communities", record);

    } else {
      return Response.json({ ok: true, skipped: true, entity: entityName });
    }

    return Response.json({ ok: true, entity: entityName, id });
  } catch (error) {
    console.error(`[syncToSupabase] Fatal error:`, error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});