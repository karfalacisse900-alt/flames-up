/**
 * Cloudflare D1 sync function.
 * Syncs Base44 entity data into Cloudflare D1 for full data ownership.
 *
 * Call with: { table: "users"|"posts"|"comments"|"likes", operation: "upsert"|"delete", data: {...} }
 * Or trigger full resync: { operation: "full_resync", table: "users"|"posts"|"comments" }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CF_API = "https://api.cloudflare.com/client/v4";

async function d1Query(accountId, dbId, token, sql, params = []) {
  const res = await fetch(`${CF_API}/accounts/${accountId}/d1/database/${dbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const json = await res.json();
  if (!json.success) {
    console.error("D1 query failed:", JSON.stringify(json.errors));
    throw new Error(json.errors?.[0]?.message || "D1 query failed");
  }
  return json.result?.[0];
}

async function initSchema(accountId, dbId, token) {
  const migrations = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      username TEXT UNIQUE,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      bio TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author_email TEXT NOT NULL,
      author_name TEXT,
      type TEXT,
      body TEXT,
      image_url TEXT,
      video_url TEXT,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      is_anonymous INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (author_email) REFERENCES users(email)
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_email TEXT NOT NULL,
      author_name TEXT,
      body TEXT,
      type TEXT DEFAULT 'text',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (author_email) REFERENCES users(email)
    )`,
    `CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      post_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_email, post_id),
      FOREIGN KEY (user_email) REFERENCES users(email),
      FOREIGN KEY (post_id) REFERENCES posts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      follower_email TEXT NOT NULL,
      following_email TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(follower_email, following_email)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_email)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)`,
    `CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id)`,
    `CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_email)`,
  ];

  for (const sql of migrations) {
    await d1Query(accountId, dbId, token, sql);
  }
  console.log("D1 schema initialized successfully");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const dbId = Deno.env.get("CLOUDFLARE_D1_DATABASE_ID");
    const token = Deno.env.get("CLOUDFLARE_API_TOKEN");

    if (!dbId) {
      return Response.json({ error: "CLOUDFLARE_D1_DATABASE_ID not set. Create a D1 database and set the secret." }, { status: 500 });
    }

    const { operation, table, data } = await req.json();

    // Always ensure schema exists
    await initSchema(accountId, dbId, token);

    if (operation === "init_schema") {
      return Response.json({ success: true, message: "D1 schema initialized" });
    }

    if (operation === "full_resync") {
      let synced = 0;

      if (!table || table === "users") {
        const users = await base44.asServiceRole.entities.User.list("-created_date", 5000);
        for (const u of users) {
          await d1Query(accountId, dbId, token,
            `INSERT INTO users (id, email, full_name, username, avatar_url, role, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT(id) DO UPDATE SET
               full_name=excluded.full_name, username=excluded.username,
               avatar_url=excluded.avatar_url, role=excluded.role, updated_at=excluded.updated_at`,
            [u.id, u.email, u.full_name || "", u.username || null, u.avatar_url || null, u.role || "user"]
          );
          synced++;
        }
        console.log(`Synced ${synced} users to D1`);
      }

      if (!table || table === "posts") {
        synced = 0;
        const posts = await base44.asServiceRole.entities.CommunityPost.list("-created_date", 1000);
        for (const p of posts) {
          await d1Query(accountId, dbId, token,
            `INSERT INTO posts (id, author_email, author_name, type, body, image_url, like_count, comment_count, is_anonymous, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT(id) DO UPDATE SET
               like_count=excluded.like_count, comment_count=excluded.comment_count, updated_at=excluded.updated_at`,
            [p.id, p.author_email || "", p.author_name || "", p.type || "text", p.body || "", p.image_url || null,
             p.like_count || 0, p.comment_count || 0, p.is_anonymous ? 1 : 0, p.created_date || new Date().toISOString()]
          );
          synced++;
        }
        console.log(`Synced ${synced} posts to D1`);
      }

      if (!table || table === "comments") {
        synced = 0;
        const comments = await base44.asServiceRole.entities.CommunityComment.list("-created_date", 2000);
        for (const c of comments) {
          await d1Query(accountId, dbId, token,
            `INSERT INTO comments (id, post_id, author_email, author_name, body, type, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO NOTHING`,
            [c.id, c.post_id || "", c.author_email || "", c.author_name || "", c.body || "", c.type || "text", c.created_date || new Date().toISOString()]
          );
          synced++;
        }
        console.log(`Synced ${synced} comments to D1`);
      }

      return Response.json({ success: true, message: "Full resync complete" });
    }

    // Single record upsert/delete
    if (operation === "upsert" && data) {
      if (table === "users") {
        await d1Query(accountId, dbId, token,
          `INSERT INTO users (id, email, full_name, username, avatar_url, role, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET
             full_name=excluded.full_name, username=excluded.username,
             avatar_url=excluded.avatar_url, role=excluded.role, updated_at=excluded.updated_at`,
          [data.id, data.email, data.full_name || "", data.username || null, data.avatar_url || null, data.role || "user"]
        );
      } else if (table === "posts") {
        await d1Query(accountId, dbId, token,
          `INSERT INTO posts (id, author_email, author_name, type, body, image_url, like_count, comment_count, is_anonymous, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET
             like_count=excluded.like_count, comment_count=excluded.comment_count, updated_at=excluded.updated_at`,
          [data.id, data.author_email || "", data.author_name || "", data.type || "text", data.body || "",
           data.image_url || null, data.like_count || 0, data.comment_count || 0, data.is_anonymous ? 1 : 0, data.created_date || new Date().toISOString()]
        );
      } else if (table === "comments") {
        await d1Query(accountId, dbId, token,
          `INSERT INTO comments (id, post_id, author_email, author_name, body, type, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO NOTHING`,
          [data.id, data.post_id || "", data.author_email || "", data.author_name || "", data.body || "", data.type || "text", data.created_date || new Date().toISOString()]
        );
      } else if (table === "likes") {
        await d1Query(accountId, dbId, token,
          `INSERT INTO likes (id, user_email, post_id, created_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(user_email, post_id) DO NOTHING`,
          [data.id || `${data.user_email}_${data.post_id}`, data.user_email, data.post_id]
        );
      }
      return Response.json({ success: true });
    }

    if (operation === "delete" && data) {
      if (table === "posts") await d1Query(accountId, dbId, token, `DELETE FROM posts WHERE id=?`, [data.id]);
      if (table === "comments") await d1Query(accountId, dbId, token, `DELETE FROM comments WHERE id=?`, [data.id]);
      if (table === "likes") await d1Query(accountId, dbId, token, `DELETE FROM likes WHERE user_email=? AND post_id=?`, [data.user_email, data.post_id]);
      return Response.json({ success: true });
    }

    return Response.json({ error: "Unknown operation" }, { status: 400 });
  } catch (error) {
    console.error("D1 sync error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});