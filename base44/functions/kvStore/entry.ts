import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
const NAMESPACE_ID = Deno.env.get("CLOUDFLARE_KV_NAMESPACE_ID");
const API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");

const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}`;

const headers = {
  "Authorization": `Bearer ${API_TOKEN}`,
  "Content-Type": "application/json",
};

async function kvGet(key) {
  const res = await fetch(`${BASE_URL}/values/${encodeURIComponent(key)}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`KV GET failed: ${res.status}`);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function kvSet(key, value, ttlSeconds = null) {
  const url = ttlSeconds
    ? `${BASE_URL}/values/${encodeURIComponent(key)}?expiration_ttl=${ttlSeconds}`
    : `${BASE_URL}/values/${encodeURIComponent(key)}`;
  const body = typeof value === "string" ? value : JSON.stringify(value);
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${API_TOKEN}`, "Content-Type": "text/plain" },
    body,
  });
  if (!res.ok) throw new Error(`KV SET failed: ${res.status}`);
  return true;
}

async function kvDelete(key) {
  const res = await fetch(`${BASE_URL}/values/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`KV DELETE failed: ${res.status}`);
  return true;
}

async function kvList(prefix = "") {
  const url = prefix
    ? `${BASE_URL}/keys?prefix=${encodeURIComponent(prefix)}`
    : `${BASE_URL}/keys`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`KV LIST failed: ${res.status}`);
  const data = await res.json();
  return data.result?.map(k => k.name) || [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, key, value, ttl, prefix } = await req.json();

    if (!action) return Response.json({ error: 'action required' }, { status: 400 });

    if (action === "get") {
      const result = await kvGet(key);
      return Response.json({ result });
    }

    if (action === "set") {
      await kvSet(key, value, ttl || null);
      return Response.json({ success: true });
    }

    if (action === "delete") {
      await kvDelete(key);
      return Response.json({ success: true });
    }

    if (action === "list") {
      const keys = await kvList(prefix || "");
      return Response.json({ keys });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('kvStore error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});