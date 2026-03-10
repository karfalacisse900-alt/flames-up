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
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { event, data } = payload;
    const entityName = event?.entity_name;
    const eventType = event?.type;
    const id = String(data?.id || event?.entity_id);

    console.log(`[syncToSupabase] entity=${entityName} event=${eventType} id=${id}`);

    if (eventType === "delete") {
      if (entityName === "Post") await supabaseDelete("posts", id);
      else if (entityName === "User") await supabaseDelete("profiles", id);
      else if (entityName === "Group") await supabaseDelete("communities", id);
      return Response.json({ ok: true, action: "delete", entity: entityName });
    }

    if (entityName === "User") {
      const record = {
        id,
        email: data.email || null,
        full_name: data.full_name || null,
      };
      console.log(`[syncToSupabase] Syncing User → profiles:`, JSON.stringify(record));
      await supabaseUpsert("profiles", record);

    } else if (entityName === "Post") {
      const record = {
        id,
        content: data.text || null,
        user_id: data.created_by || null,
        created_at: data.created_date || null,
      };
      console.log(`[syncToSupabase] Syncing Post → posts:`, JSON.stringify(record));
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