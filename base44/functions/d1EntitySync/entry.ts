/**
 * Real-time D1 entity sync — triggered by entity automations.
 * Receives: { event: { type, entity_name, entity_id }, data, old_data }
 * Syncs CommunityPost, CommunityComment, User changes into Cloudflare D1.
 */

const CF_API = "https://api.cloudflare.com/client/v4";

async function d1Query(accountId, dbId, token, sql, params = []) {
  const res = await fetch(`${CF_API}/accounts/${accountId}/d1/database/${dbId}/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.errors?.[0]?.message || "D1 query failed");
  return json.result?.[0];
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { event, data } = body;

    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const dbId = Deno.env.get("CLOUDFLARE_D1_DATABASE_ID");
    const token = Deno.env.get("CLOUDFLARE_API_TOKEN");

    if (!dbId || !accountId || !token) {
      console.warn("D1 not configured — skipping sync");
      return Response.json({ skipped: true });
    }

    const { type, entity_name } = event || {};

    // ── Users ─────────────────────────────────────────────────────────────
    if (entity_name === "User") {
      if (type === "delete") {
        await d1Query(accountId, dbId, token, `DELETE FROM users WHERE id=?`, [event.entity_id]);
        console.log(`D1: deleted user ${event.entity_id}`);
      } else if (data) {
        await d1Query(accountId, dbId, token,
          `INSERT INTO users (id, email, full_name, username, avatar_url, role, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET
             full_name=excluded.full_name, username=excluded.username,
             avatar_url=excluded.avatar_url, role=excluded.role, updated_at=excluded.updated_at`,
          [data.id, data.email || "", data.full_name || "", data.username || null, data.avatar_url || null, data.role || "user"]
        );
        console.log(`D1: upserted user ${data.email}`);
      }
    }

    // ── Community Posts ────────────────────────────────────────────────────
    else if (entity_name === "CommunityPost") {
      if (type === "delete") {
        await d1Query(accountId, dbId, token, `DELETE FROM posts WHERE id=?`, [event.entity_id]);
        await d1Query(accountId, dbId, token, `DELETE FROM comments WHERE post_id=?`, [event.entity_id]);
        await d1Query(accountId, dbId, token, `DELETE FROM likes WHERE post_id=?`, [event.entity_id]);
        console.log(`D1: deleted post ${event.entity_id} + cascade`);
      } else if (data) {
        await d1Query(accountId, dbId, token,
          `INSERT INTO posts (id, author_email, author_name, type, body, image_url, like_count, comment_count, is_anonymous, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET
             like_count=excluded.like_count, comment_count=excluded.comment_count,
             body=excluded.body, updated_at=excluded.updated_at`,
          [data.id, data.author_email || "", data.author_name || "", data.type || "text",
           data.body || "", data.image_url || null, data.like_count || 0,
           data.comment_count || 0, data.is_anonymous ? 1 : 0, data.created_date || new Date().toISOString()]
        );
        console.log(`D1: upserted post ${data.id}`);
      }
    }

    // ── Community Comments ─────────────────────────────────────────────────
    else if (entity_name === "CommunityComment") {
      if (type === "delete") {
        await d1Query(accountId, dbId, token, `DELETE FROM comments WHERE id=?`, [event.entity_id]);
        console.log(`D1: deleted comment ${event.entity_id}`);
      } else if (type === "create" && data) {
        await d1Query(accountId, dbId, token,
          `INSERT INTO comments (id, post_id, author_email, author_name, body, type, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO NOTHING`,
          [data.id, data.post_id || "", data.author_email || "", data.author_name || "",
           data.body || "", data.type || "text", data.created_date || new Date().toISOString()]
        );
        console.log(`D1: inserted comment ${data.id}`);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("D1 entity sync error:", error.message);
    // Return 200 so automation doesn't retry infinitely
    return Response.json({ error: error.message, success: false });
  }
});