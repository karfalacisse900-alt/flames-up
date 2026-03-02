import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// In-memory token cache
let tokenCache = null;
let tokenExpiry = 0;
let tokenIsSandbox = false;

// In-memory search cache (15 min TTL)
const searchCache = {};
const CACHE_TTL = 15 * 60 * 1000;

// Mixed category queries - always return a variety of product types
const MIXED_QUERIES = [
  "headphones", "sneakers", "laptop", "smartphone", "watch",
  "gaming controller", "wireless earbuds", "backpack", "sunglasses", "keyboard"
];

async function getEbayToken() {
  if (tokenCache && Date.now() < tokenExpiry) return { token: tokenCache, sandbox: tokenIsSandbox };

  const clientId = Deno.env.get("EBAY_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("EBAY_CLIENT_SECRET")?.trim();

  if (!clientId || !clientSecret) throw new Error("eBay credentials not configured");

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const body = "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope";
  const headers = { "Authorization": `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" };

  // Try production first
  const prodRes = await fetch("https://api.ebay.com/identity/v1/oauth2/token", { method: "POST", headers, body });
  if (prodRes.ok) {
    const data = await prodRes.json();
    tokenCache = data.access_token;
    tokenIsSandbox = false;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    console.log("eBay token: PRODUCTION");
    return { token: tokenCache, sandbox: false };
  }
  console.warn("eBay production auth failed, trying sandbox...");

  // Fall back to sandbox
  const sandboxBody = "grant_type=client_credentials&scope=https%3A%2F%2Fapi.sandbox.ebay.com%2Foauth%2Fapi_scope";
  const sandboxRes = await fetch("https://api.sandbox.ebay.com/identity/v1/oauth2/token", { method: "POST", headers, body: sandboxBody });
  if (sandboxRes.ok) {
    const data = await sandboxRes.json();
    tokenCache = data.access_token;
    tokenIsSandbox = true;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    console.log("eBay token: SANDBOX");
    return { token: tokenCache, sandbox: true };
  }

  const err = await sandboxRes.text();
  console.error("Both eBay auth attempts failed:", err);
  throw new Error("eBay authentication failed. Check EBAY_CLIENT_ID and EBAY_CLIENT_SECRET secrets.");
}

async function searchSingleQuery(token, q, limit, offset) {
  const params = new URLSearchParams({
    q,
    limit: String(limit),
    offset: String(offset),
    filter: "buyingOptions:{FIXED_PRICE},price:[5..500]",
  });

  const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`eBay search error for "${q}":`, err);
    return [];
  }

  const data = await res.json();
  return (data.itemSummaries || [])
    .filter(item => item.image?.imageUrl && !item.image.imageUrl.includes("no-image"))
    .map(item => ({
      id: item.itemId,
      title: item.title,
      price: item.price?.value,
      currency: item.price?.currency || "USD",
      image: item.image?.imageUrl,
      url: item.itemWebUrl,
      condition: item.condition,
      seller: item.seller?.username,
    }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { query, limit = 20, offset = 0, mixed = false } = await req.json();
    if (!query) return Response.json({ error: "Query required" }, { status: 400 });

    const cacheKey = `${query}:${limit}:${offset}:${mixed}`;
    if (searchCache[cacheKey] && Date.now() - searchCache[cacheKey].ts < CACHE_TTL) {
      console.log("eBay cache hit for:", query);
      return Response.json(searchCache[cacheKey].data);
    }

    const token = await getEbayToken();

    let items = [];
    let total = 0;

    if (mixed) {
      // Fetch from multiple categories and mix results
      const perCategory = Math.ceil(limit / MIXED_QUERIES.length);
      const promises = MIXED_QUERIES.slice(0, 6).map(q => searchSingleQuery(token, q, perCategory, 0));
      const results = await Promise.all(promises);
      
      // Interleave results (1 from each category at a time)
      const maxLen = Math.max(...results.map(r => r.length));
      for (let i = 0; i < maxLen; i++) {
        for (const arr of results) {
          if (arr[i]) items.push(arr[i]);
        }
      }
      // Deduplicate by id
      const seen = new Set();
      items = items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      items = items.slice(0, limit);
      total = items.length;
    } else {
      // Single query search
      const perPage = limit;
      items = await searchSingleQuery(token, query, perPage, offset);
      total = items.length + offset + (items.length === perPage ? perPage : 0);
    }

    const result = { items, total, offset, limit };
    searchCache[cacheKey] = { data: result, ts: Date.now() };

    console.log(`eBay search "${query}" (production): ${items.length} results`);
    return Response.json(result);
  } catch (error) {
    console.error("ebaySearch error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});