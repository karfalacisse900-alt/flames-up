import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

async function supabaseUpsert(table, record) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[syncToSupabase] Upsert to '${table}' FAILED (${res.status}):`, err);
    console.error(`[syncToSupabase] Record that failed:`, JSON.stringify(record));
    throw new Error(`Supabase upsert to '${table}' failed: ${res.status} - ${err}`);
  }
  console.log(`[syncToSupabase] Upserted to '${table}' id=${record.id}`);
}

async function supabaseDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${String(id)}`, {
    method: "DELETE",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[syncToSupabase] Delete from '${table}' FAILED (${res.status}):`, err);
    throw new Error(`Supabase delete from '${table}' failed: ${res.status} - ${err}`);
  }
  console.log(`[syncToSupabase] Deleted from '${table}' id=${id}`);
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { event, data } = payload;
    const entityName = event?.entity_name;
    const eventType = event?.type;
    const entityId = event?.entity_id;

    console.log(`[syncToSupabase] entity=${entityName} event=${eventType} id=${entityId}`);

    if (!entityName || !eventType) {
      return Response.json({ error: "Missing event info" }, { status: 400 });
    }

    // --- DELETE ---
    if (eventType === "delete") {
      const tableMap = { User: "profiles", Post: "posts", Group: "communities" };
      const table = tableMap[entityName];
      if (table) await supabaseDelete(table, entityId);
      return Response.json({ success: true, action: "deleted", entity: entityName });
    }

    // --- UPSERT (create / update) ---
    if (!data) {
      console.error(`[syncToSupabase] No data in payload for entity=${entityName} id=${entityId}`);
      return Response.json({ error: "No entity data in payload" }, { status: 400 });
    }

    // IMPORTANT: Base44 IDs are cast to String to ensure correct mapping to Supabase id column
    const id = String(data.id);

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
        user_id: data.created_by ? String(data.created_by) : null,
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
      console.log(`[syncToSupabase] Unhandled entity: ${entityName} — skipping`);
      return Response.json({ skipped: true, entity: entityName });
    }

    return Response.json({ success: true, action: eventType, entity: entityName, id });
  } catch (error) {
    console.error("[syncToSupabase] Fatal error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});