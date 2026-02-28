import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// In-memory token cache
let tokenCache = null;
let tokenExpiry = 0;

// In-memory search cache (15 min TTL)
const searchCache = {};
const CACHE_TTL = 15 * 60 * 1000;

async function getEbayToken() {
  if (tokenCache && Date.now() < tokenExpiry) return tokenCache;

  const clientId = Deno.env.get("EBAY_CLIENT_ID");
  const clientSecret = Deno.env.get("EBAY_CLIENT_SECRET");
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("eBay token error:", err);
    throw new Error("Failed to get eBay token");
  }

  const data = await res.json();
  tokenCache = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return tokenCache;
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

    const token = await getEbayToken();
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      offset: String(offset),
      fieldgroups: "MATCHING_ITEMS",
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
      console.error("eBay search error:", err);
      return Response.json({ error: "eBay search failed" }, { status: 500 });
    }

    const data = await res.json();
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

    console.log(`eBay search "${query}": ${items.length} results`);
    return Response.json(result);
  } catch (error) {
    console.error("ebaySearch error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});