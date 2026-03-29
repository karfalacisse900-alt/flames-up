import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const { lat, lng, radius = 5000, type = "restaurant", keyword = "", place_id } = await req.json();

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 });

    // If place_id provided, fetch full details including photos
    if (place_id) {
      const fields = "place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos,price_level,types,geometry,reviews,editorial_summary";
      const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${apiKey}`;
      const res = await fetch(detailUrl);
      const data = await res.json();
      if (data.status !== "OK") {
        console.error("Place Details error:", data.status, data.error_message);
        return Response.json({ error: data.status }, { status: 200 });
      }
      const p = data.result;
      const photos = (p.photos || []).slice(0, 6).map(ph =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ph.photo_reference}&key=${apiKey}`
      );
      return Response.json({
        detail: {
          id: p.place_id,
          name: p.name,
          address: p.formatted_address,
          phone: p.formatted_phone_number,
          website: p.website,
          rating: p.rating,
          user_ratings_total: p.user_ratings_total,
          types: p.types,
          photos,
          lat: p.geometry?.location?.lat,
          lng: p.geometry?.location?.lng,
          open_now: p.opening_hours?.open_now,
          weekday_text: p.opening_hours?.weekday_text,
          price_level: p.price_level,
          summary: p.editorial_summary?.overview,
          reviews: (p.reviews || []).slice(0, 3).map(r => ({
            author: r.author_name,
            text: r.text,
            rating: r.rating,
            time: r.relative_time_description,
          })),
        }
      });
    }

    if (!lat || !lng) {
      return Response.json({ error: "lat and lng required" }, { status: 400 });
    }

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
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${p.photos[0].photo_reference}&key=${apiKey}`
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