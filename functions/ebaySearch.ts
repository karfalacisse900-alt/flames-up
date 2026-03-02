import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// In-memory token cache
let tokenCache = null;
let tokenExpiry = 0;
let usingSandbox = false;

// In-memory search cache (15 min TTL)
const searchCache = {};
const CACHE_TTL = 15 * 60 * 1000;

async function getEbayToken() {
  if (tokenCache && Date.now() < tokenExpiry) return { token: tokenCache, sandbox: usingSandbox };

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
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    usingSandbox = false;
    console.log("eBay token obtained from PRODUCTION");
    return { token: tokenCache, sandbox: false };
  }

  const prodErr = await prodRes.text();
  console.error("eBay production token failed:", prodErr);

  // Fall back to sandbox
  const sandboxRes = await fetch("https://api.sandbox.ebay.com/identity/v1/oauth2/token", { method: "POST", headers, body });
  if (sandboxRes.ok) {
    const data = await sandboxRes.json();
    tokenCache = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    usingSandbox = true;
    console.log("eBay token obtained from SANDBOX");
    return { token: tokenCache, sandbox: true };
  }

  const sandboxErr = await sandboxRes.text();
  console.error("eBay sandbox token also failed:", sandboxErr);
  throw new Error("eBay authentication failed. Please verify your EBAY_CLIENT_ID and EBAY_CLIENT_SECRET secrets.");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { query, limit = 20, offset = 0 } = await req.json();
    if (!query) return Response.json({ error: "Query required" }, { status: 400 });

    const cacheKey = `${query}:${limit}:${offset}`;
    if (searchCache[cacheKey] && Date.now() - searchCache[cacheKey].ts < CACHE_TTL) {
      console.log("eBay cache hit for:", query);
      return Response.json(searchCache[cacheKey].data);
    }

    const { token, sandbox } = await getEbayToken();
    const baseUrl = sandbox
      ? "https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search"
      : "https://api.ebay.com/buy/browse/v1/item_summary/search";

    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      offset: String(offset),
    });

    const searchRes = await fetch(`${baseUrl}?${params}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        "Content-Type": "application/json",
      },
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      console.error("eBay search error (status " + searchRes.status + "):", err);
      return Response.json({ error: "eBay search failed", details: err }, { status: 500 });
    }

    const data = await searchRes.json();
    const items = (data.itemSummaries || []).map(item => ({
      id: item.itemId,
      title: item.title,
      price: item.price?.value,
      currency: item.price?.currency || "USD",
      image: item.image?.imageUrl,
      url: item.itemWebUrl,
      condition: item.condition,
      seller: item.seller?.username,
      thumbnail: item.thumbnailImages?.[0]?.imageUrl || item.image?.imageUrl,
    }));

    const result = { items, total: data.total || 0, offset, limit };
    searchCache[cacheKey] = { data: result, ts: Date.now() };

    console.log(`eBay search "${query}" (${sandbox ? "sandbox" : "production"}): ${items.length} results`);
    return Response.json(result);
  } catch (error) {
    console.error("ebaySearch error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});