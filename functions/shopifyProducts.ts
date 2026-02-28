import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// In-memory cache (20 min TTL)
const cache = {};
const CACHE_TTL = 20 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { query = "", first = 20, after = null } = await req.json().catch(() => ({}));
    const cacheKey = `${query}:${first}:${after}`;

    if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < CACHE_TTL) {
      console.log("Shopify cache hit");
      return Response.json(cache[cacheKey].data);
    }

    const storeDomain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
    const token = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");

    if (!storeDomain || !token) {
      return Response.json({ error: "Shopify not configured" }, { status: 500 });
    }

    const graphqlQuery = `
      query Products($first: Int!, $query: String, $after: String) {
        products(first: $first, query: $query, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              title
              description
              handle
              onlineStoreUrl
              featuredImage { url altText }
              images(first: 5) { edges { node { url altText } } }
              priceRange {
                minVariantPrice { amount currencyCode }
                maxVariantPrice { amount currencyCode }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price { amount currencyCode }
                    availableForSale
                  }
                }
              }
              tags
              vendor
            }
          }
        }
      }
    `;

    const res = await fetch(`https://${storeDomain}/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query: graphqlQuery, variables: { first, query, after } }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Shopify API error:", err);
      return Response.json({ error: "Shopify API failed" }, { status: 500 });
    }

    const json = await res.json();
    if (json.errors) {
      console.error("Shopify GraphQL errors:", json.errors);
      return Response.json({ error: json.errors[0]?.message }, { status: 500 });
    }

    const products = json.data.products.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      handle: node.handle,
      url: node.onlineStoreUrl || `https://${storeDomain}/products/${node.handle}`,
      image: node.featuredImage?.url,
      images: node.images.edges.map(e => e.node.url),
      minPrice: node.priceRange.minVariantPrice.amount,
      maxPrice: node.priceRange.maxVariantPrice.amount,
      currency: node.priceRange.minVariantPrice.currencyCode,
      variants: node.variants.edges.map(e => e.node),
      tags: node.tags,
      vendor: node.vendor,
    }));

    const result = {
      products,
      pageInfo: json.data.products.pageInfo,
    };

    cache[cacheKey] = { data: result, ts: Date.now() };
    console.log(`Shopify products fetched: ${products.length}`);
    return Response.json(result);
  } catch (error) {
    console.error("shopifyProducts error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});