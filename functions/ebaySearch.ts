import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// In-memory token cache
let tokenCache = null;
let tokenExpiry = 0;
let tokenBaseUrl = "https://api.ebay.com";

// In-memory search cache (10 min TTL)
const searchCache = {};
const CACHE_TTL = 10 * 60 * 1000;

async function getEbayToken() {
  if (tokenCache && Date.now() < tokenExpiry) return tokenCache;

  const clientId = Deno.env.get("EBAY_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("EBAY_CLIENT_SECRET")?.trim();

  if (!clientId || !clientSecret) throw new Error("eBay credentials not configured");

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const body = "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope";
  const headers = {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": "application/x-www-form-urlencoded"
  };

  // Try production first, fall back to sandbox
  for (const endpoint of [
    "https://api.ebay.com/identity/v1/oauth2/token",
    "https://api.sandbox.ebay.com/identity/v1/oauth2/token",
  ]) {
    const res = await fetch(endpoint, { method: "POST", headers, body });
    if (res.ok) {
      const data = await res.json();
      tokenCache = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
      const env = endpoint.includes("sandbox") ? "sandbox" : "production";
      console.log(`eBay token obtained (${env})`);
      return tokenCache;
    }
    const errText = await res.text();
    console.warn(`eBay token failed for ${endpoint}:`, errText);
  }

  throw new Error("eBay authentication failed on both production and sandbox endpoints");
}

// Mixed category search — rotate through multiple queries to get diverse results
const MIXED_QUERIES = [
  "wireless headphones",
  "laptop computer",
  "smartphone",
  "gaming console",
  "smartwatch",
  "tablet",
  "bluetooth speaker",
  "mechanical keyboard",
  "action camera",
  "earbuds",
];

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

    let allItems = [];

    if (mixed) {
      // Fetch from multiple categories for a mixed feed
      const queries = MIXED_QUERIES.slice(0, 6);
      const perQuery = Math.ceil(limit / queries.length);

      const results = await Promise.allSettled(queries.map(async (q) => {
        const params = new URLSearchParams({ q, limit: String(perQuery), offset: "0" });
        const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
          },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.itemSummaries || [];
      }));

      // Interleave results from different categories
      const categoryResults = results
        .filter(r => r.status === "fulfilled")
        .map(r => r.value);

      const maxLen = Math.max(...categoryResults.map(a => a.length));
      for (let i = 0; i < maxLen; i++) {
        for (const arr of categoryResults) {
          if (arr[i]) allItems.push(arr[i]);
        }
      }
      allItems = allItems.slice(0, limit);
    } else {
      const params = new URLSearchParams({ q: query, limit: String(limit), offset: String(offset) });
      const searchRes = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
      });

      if (!searchRes.ok) {
        const errText = await searchRes.text();
        console.error("eBay search error:", searchRes.status, errText);
        return Response.json({ error: "eBay search failed", details: errText }, { status: 500 });
      }

      const data = await searchRes.json();
      allItems = data.itemSummaries || [];
    }

    const items = allItems
      .map(item => {
        // Get real eBay image — prefer thumbnailImages, then image
        const imageUrl = item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || null;
        // Only include items with real images
        if (!imageUrl || imageUrl.includes("placeholder") || imageUrl.includes("no-image")) return null;
        // Make sure the URL links to real eBay (not sandbox)
        let itemUrl = item.itemWebUrl || "";
        // Force production eBay URLs
        itemUrl = itemUrl.replace("sandbox.ebay.com", "ebay.com");

        return {
          id: item.itemId,
          title: item.title,
          price: item.price?.value,
          currency: item.price?.currency || "USD",
          image: imageUrl,
          url: itemUrl,
          condition: item.condition,
          seller: item.seller?.username,
        };
      })
      .filter(Boolean);

    const result = { items, total: items.length, offset, limit };
    searchCache[cacheKey] = { data: result, ts: Date.now() };

    console.log(`eBay "${query}" (mixed=${mixed}): ${items.length} results with images`);
    return Response.json(result);
  } catch (error) {
    console.error("ebaySearch error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});