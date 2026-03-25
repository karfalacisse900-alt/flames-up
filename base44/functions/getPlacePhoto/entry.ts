import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { place_name, city = "New York City", max_photos = 4 } = await req.json();
    if (!place_name) return Response.json({ error: 'place_name required' }, { status: 400 });

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    // Step 1: Find the place via Text Search
    const searchQuery = encodeURIComponent(`${place_name} ${city}`);
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${apiKey}`
    );
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return Response.json({ photo_urls: [], photo_url: null });
    }

    const place = searchData.results[0];
    const photos = place.photos || [];

    if (photos.length === 0) {
      // Fall back to Street View
      const lat = place.geometry?.location?.lat;
      const lng = place.geometry?.location?.lng;
      if (lat && lng) {
        const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&key=${apiKey}&fov=80&pitch=10`;
        return Response.json({ photo_urls: [svUrl], photo_url: svUrl, source: 'streetview' });
      }
      return Response.json({ photo_urls: [], photo_url: null });
    }

    // Step 2: Resolve multiple photo URLs (follow redirect to get final URL)
    const count = Math.min(photos.length, max_photos);
    const photoUrls = [];

    for (let i = 0; i < count; i++) {
      const ref = photos[i].photo_reference;
      const photoApiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${apiKey}`;
      const res = await fetch(photoApiUrl, { redirect: 'follow' });
      photoUrls.push(res.url);
    }

    return Response.json({ photo_urls: photoUrls, photo_url: photoUrls[0], source: 'places' });
  } catch (error) {
    console.error('getPlacePhoto error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});