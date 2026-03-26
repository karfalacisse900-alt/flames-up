import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
const NAMESPACE_ID = Deno.env.get("CLOUDFLARE_KV_NAMESPACE_ID");
const API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");
const KV_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}`;

async function kvGet(key) {
  const res = await fetch(`${KV_BASE}/values/${encodeURIComponent(key)}`, {
    headers: { "Authorization": `Bearer ${API_TOKEN}` }
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  try { return JSON.parse(await res.text()); } catch { return null; }
}

async function kvSet(key, value, ttl = 86400 * 7) { // 7-day cache
  await fetch(`${KV_BASE}/values/${encodeURIComponent(key)}?expiration_ttl=${ttl}`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${API_TOKEN}`, "Content-Type": "text/plain" },
    body: JSON.stringify(value),
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { place_name, city = "New York City", max_photos = 6 } = await req.json();
    if (!place_name) return Response.json({ error: 'place_name required' }, { status: 400 });

    const cacheKey = `photos:${place_name.toLowerCase().replace(/\s+/g, "_")}:${city.toLowerCase().replace(/\s+/g, "_")}`;

    // Check KV cache first
    const cached = await kvGet(cacheKey);
    if (cached && cached.photo_urls?.length > 0) {
      return Response.json({ ...cached, source: 'kv_cache' });
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    // Step 1: Text Search to get place_id
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${place_name} ${city}`)}&key=${apiKey}`
    );
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return Response.json({ photo_urls: [], photo_url: null });
    }

    const placeId = searchData.results[0].place_id;

    // Step 2: Place Details to get all photo references
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos,geometry&key=${apiKey}`
    );
    const detailsData = await detailsRes.json();
    const photoRefs = detailsData.result?.photos || [];

    if (photoRefs.length === 0) {
      const loc = searchData.results[0].geometry?.location;
      if (loc) {
        const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${loc.lat},${loc.lng}&key=${apiKey}&fov=80&pitch=10`;
        const result = { photo_urls: [svUrl], photo_url: svUrl };
        await kvSet(cacheKey, result);
        return Response.json({ ...result, source: 'streetview' });
      }
      return Response.json({ photo_urls: [], photo_url: null });
    }

    // Step 3: Resolve photo URLs
    const count = Math.min(photoRefs.length, max_photos);
    const photoUrls = [];

    for (let i = 0; i < count; i++) {
      const ref = photoRefs[i].photo_reference;
      const photoRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${apiKey}`,
        { redirect: 'follow' }
      );
      if (photoRes.url) photoUrls.push(photoRes.url);
    }

    const result = { photo_urls: photoUrls, photo_url: photoUrls[0] || null, count: photoUrls.length };

    // Cache in Cloudflare KV for 7 days
    if (photoUrls.length > 0) await kvSet(cacheKey, result);

    return Response.json({ ...result, source: 'places' });
  } catch (error) {
    console.error('getPlacePhoto error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});