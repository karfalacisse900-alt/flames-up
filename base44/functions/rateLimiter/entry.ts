/**
 * Cloudflare KV-based rate limiter.
 * Call this from other functions to protect endpoints from abuse.
 *
 * Payload: { key: string, limit: number, windowSeconds: number }
 * Returns: { allowed: boolean, remaining: number, resetAt: number }
 *
 * key examples:
 *   "ip:1.2.3.4:claimUsername"
 *   "user:email@x.com:createPost"
 *   "ip:1.2.3.4:auth"
 */

const CF_API = "https://api.cloudflare.com/client/v4";

async function kvGet(accountId, nsId, token, key) {
  const res = await fetch(`${CF_API}/accounts/${accountId}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  return res.text();
}

async function kvPut(accountId, nsId, token, key, value, ttlSeconds) {
  await fetch(`${CF_API}/accounts/${accountId}/storage/kv/namespaces/${nsId}/values/${encodeURIComponent(key)}?expiration_ttl=${ttlSeconds}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
    body: value,
  });
}

Deno.serve(async (req) => {
  try {
    const { key, limit = 10, windowSeconds = 60 } = await req.json();

    if (!key) return Response.json({ error: "key is required" }, { status: 400 });

    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const nsId = Deno.env.get("CLOUDFLARE_KV_NAMESPACE_ID");
    const token = Deno.env.get("CLOUDFLARE_API_TOKEN");

    if (!accountId || !nsId || !token) {
      // If CF KV not configured, allow all requests
      return Response.json({ allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 });
    }

    const rlKey = `rl:${key}`;
    const existing = await kvGet(accountId, nsId, token, rlKey);

    const now = Date.now();

    if (!existing) {
      // First request in window
      await kvPut(accountId, nsId, token, rlKey, JSON.stringify({ count: 1, windowStart: now }), windowSeconds);
      return Response.json({ allowed: true, remaining: limit - 1, resetAt: now + windowSeconds * 1000 });
    }

    const state = JSON.parse(existing);
    const count = state.count || 0;
    const windowStart = state.windowStart || now;
    const resetAt = windowStart + windowSeconds * 1000;

    if (count >= limit) {
      console.warn(`Rate limit exceeded for key: ${key} (${count}/${limit})`);
      return Response.json({ allowed: false, remaining: 0, resetAt });
    }

    await kvPut(accountId, nsId, token, rlKey, JSON.stringify({ count: count + 1, windowStart }), Math.ceil((resetAt - now) / 1000));

    return Response.json({ allowed: true, remaining: limit - count - 1, resetAt });
  } catch (error) {
    console.error("Rate limiter error:", error);
    // On error, allow the request (fail open) to avoid blocking legit users
    return Response.json({ allowed: true, remaining: 1, resetAt: Date.now() + 60000 });
  }
});