import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { place_name, city = "New York City" } = await req.json();
    if (!place_name) return Response.json({ error: 'place_name required' }, { status: 400 });

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    // Step 1: Find the place via Text Search
    const searchQuery = encodeURIComponent(`${place_name} ${city}`);
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${apiKey}`
    );
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return Response.json({ photo_url: null });
    }

    const place = searchData.results[0];
    const photos = place.photos;

    if (!photos || photos.length === 0) {
      // Fall back to Street View static image
      const lat = place.geometry?.location?.lat;
      const lng = place.geometry?.location?.lng;
      if (lat && lng) {
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&key=${apiKey}&fov=80&pitch=10`;
        return Response.json({ photo_url: streetViewUrl, source: 'streetview' });
      }
      return Response.json({ photo_url: null });
    }

    // Step 2: Build the photo URL using the photo_reference
    const photoRef = photos[0].photo_reference;
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${photoRef}&key=${apiKey}`;

    // Resolve the redirect to get the actual image URL
    const photoRes = await fetch(photoUrl, { redirect: 'follow' });
    const finalUrl = photoRes.url;

    return Response.json({ photo_url: finalUrl, source: 'places' });
  } catch (error) {
    console.error('getPlacePhoto error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});