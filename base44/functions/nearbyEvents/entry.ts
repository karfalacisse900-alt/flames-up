Deno.serve(async (req) => {
  try {
    const { lat, lng, city = "New York City", borough = "all" } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 });

    const boroughQuery = borough !== "all" ? ` in ${borough}` : ` in ${city}`;

    // Multiple keyword searches to get diverse events
    const keywords = [
      "farmers market",
      "outdoor festival",
      "art exhibition",
      "local market",
      "community event",
      "outdoor movie",
      "street fair",
      "food festival",
      "cultural event",
      "free event",
    ];

    const allPlaces = new Map();

    await Promise.all(
      keywords.slice(0, 5).map(async (kw) => {
        const query = encodeURIComponent(`${kw}${boroughQuery}`);
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}${lat && lng ? `&location=${lat},${lng}&radius=40000` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results) {
          for (const p of data.results.slice(0, 8)) {
            if (!allPlaces.has(p.place_id)) {
              allPlaces.set(p.place_id, p);
            }
          }
        }
      })
    );

    // Second batch
    await Promise.all(
      keywords.slice(5).map(async (kw) => {
        const query = encodeURIComponent(`${kw}${boroughQuery}`);
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}${lat && lng ? `&location=${lat},${lng}&radius=40000` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results) {
          for (const p of data.results.slice(0, 8)) {
            if (!allPlaces.has(p.place_id)) {
              allPlaces.set(p.place_id, p);
            }
          }
        }
      })
    );

    const photoRef = (p) => p.photos?.[0]?.photo_reference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${p.photos[0].photo_reference}&key=${apiKey}`
      : null;

    // Additional photos from other photos array slots
    const extraPhotos = (p) =>
      (p.photos || []).slice(1, 4).map(ph =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${ph.photo_reference}&key=${apiKey}`
      );

    const events = Array.from(allPlaces.values()).slice(0, 35).map(p => {
      // Extract borough from address
      const addr = p.formatted_address || p.vicinity || "";
      let neighborhood = "NYC";
      if (addr.includes("Manhattan")) neighborhood = "Manhattan";
      else if (addr.includes("Brooklyn")) neighborhood = "Brooklyn";
      else if (addr.includes("Queens")) neighborhood = "Queens";
      else if (addr.includes("Bronx")) neighborhood = "The Bronx";
      else if (addr.includes("Staten Island")) neighborhood = "Staten Island";

      const mainPhoto = photoRef(p);
      const photos = mainPhoto ? [mainPhoto, ...extraPhotos(p)] : [];

      // Derive tags from types
      const tagMap = {
        "food": "Food", "store": "Shopping", "park": "Outdoor", "museum": "Culture",
        "art_gallery": "Art", "night_club": "Nightlife", "movie_theater": "Movies",
        "lodging": "Hotel", "tourist_attraction": "Attraction", "establishment": null
      };
      const tags = [...new Set(
        (p.types || [])
          .map(t => tagMap[t])
          .filter(Boolean)
          .slice(0, 3)
      )];
      if (tags.length === 0) tags.push("Event");

      return {
        id: p.place_id,
        name: p.name,
        description: p.editorial_summary?.overview || null,
        address: addr,
        neighborhood,
        rating: p.rating,
        user_ratings_total: p.user_ratings_total,
        photos,
        lat: p.geometry?.location?.lat,
        lng: p.geometry?.location?.lng,
        open_now: p.opening_hours?.open_now,
        price_level: p.price_level,
        types: p.types || [],
        tags,
        isFree: p.price_level === 0 || p.price_level === undefined,
      };
    });

    // Extract unique neighborhoods
    const neighborhoods = ["All", ...new Set(events.map(e => e.neighborhood).filter(n => n !== "NYC"))];

    return Response.json({ events, city, neighborhoods });
  } catch (error) {
    console.error("nearbyEvents error:", error.message);
    return Response.json({ error: error.message, events: [] }, { status: 500 });
  }
});