import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const { lat, lng, radius = 5000, type = "restaurant", keyword = "" } = await req.json();

    if (!lat || !lng) {
      return Response.json({ error: "lat and lng required" }, { status: 400 });
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 });

    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      key: apiKey,
      ...(type && type !== "all" ? { type } : {}),
      ...(keyword ? { keyword } : {}),
    });

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places API error:", data.status, data.error_message);
      return Response.json({ error: data.error_message || data.status, results: [] }, { status: 200 });
    }

    const places = (data.results || []).slice(0, 20).map(p => ({
      id: p.place_id,
      name: p.name,
      address: p.vicinity,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total,
      types: p.types,
      photo: p.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${apiKey}`
        : null,
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      open_now: p.opening_hours?.open_now,
      price_level: p.price_level,
    }));

    return Response.json({ results: places });
  } catch (error) {
    console.error("nearbyPlaces error:", error.message);
    return Response.json({ error: error.message, results: [] }, { status: 500 });
  }
});