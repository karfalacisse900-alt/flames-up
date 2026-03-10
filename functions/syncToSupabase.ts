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
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsert to '${table}' failed: ${res.status} - ${err}`);
  }
  console.log(`Upserted record into Supabase table '${table}':`, record.id);
}

async function supabaseDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase delete from '${table}' failed: ${res.status} - ${err}`);
  }
  console.log(`Deleted record ${id} from Supabase table '${table}'`);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
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
      return Response.json({ error: "No entity data in payload" }, { status: 400 });
    }

    if (entityName === "User") {
      // Sync user → profiles table
      // This also fires your Supabase profile-creation trigger if the row is new
      const record = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role || "user",
        created_at: data.created_date,
        updated_at: data.updated_date,
      };
      await supabaseUpsert("profiles", record);

    } else if (entityName === "Post") {
      const record = {
        id: data.id,
        type: data.type,
        text: data.text,
        author_email: data.author_email,
        author_name: data.author_name,
        is_anonymous: data.is_anonymous ?? false,
        like_count: data.like_count ?? 0,
        reply_count: data.reply_count ?? 0,
        created_at: data.created_date,
        updated_at: data.updated_date,
      };
      await supabaseUpsert("posts", record);

    } else if (entityName === "Group") {
      const record = {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        group_type: data.group_type,
        creator_email: data.creator_email,
        creator_name: data.creator_name,
        member_count: data.member_count ?? 0,
        is_private: data.is_private ?? false,
        is_active: data.is_active ?? true,
        created_at: data.created_date,
        updated_at: data.updated_date,
      };
      await supabaseUpsert("communities", record);

    } else {
      console.log(`[syncToSupabase] Unhandled entity: ${entityName}`);
      return Response.json({ skipped: true, entity: entityName });
    }

    return Response.json({ success: true, action: eventType, entity: entityName });
  } catch (error) {
    console.error("[syncToSupabase] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});