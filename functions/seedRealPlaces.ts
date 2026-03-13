import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const REAL_PLACES = [
  {
    name: "Central Park",
    description: "Iconic urban park in Manhattan with lakes, walking paths, and green spaces",
    category: "park",
    address: "New York, NY 10024",
    city: "New York",
    region: "New York",
    country: "United States",
    lat: 40.785091,
    lng: -73.968285,
    cover_image_url: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800",
    is_verified: true,
    post_count: 0,
    follower_count: 0,
  },
  {
    name: "Bryant Park",
    description: "Public park in Midtown Manhattan with seasonal events and green lawn",
    category: "park",
    address: "New York, NY 10018",
    city: "New York",
    region: "New York",
    country: "United States",
    lat: 40.753597,
    lng: -73.983233,
    cover_image_url: "https://images.unsplash.com/photo-1615835360439-2e8e7c28e69f?w=800",
    is_verified: true,
    post_count: 0,
    follower_count: 0,
  },
  {
    name: "Stavros Niarchos Foundation Library",
    description: "Modern public library with collections, exhibitions, and community programs",
    category: "library",
    address: "476 5th Ave, New York, NY 10018",
    city: "New York",
    region: "New York",
    country: "United States",
    lat: 40.753182,
    lng: -73.983948,
    cover_image_url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800",
    is_verified: true,
    post_count: 0,
    follower_count: 0,
  },
  {
    name: "Brooklyn Bridge Park",
    description: "Waterfront park with stunning Manhattan skyline views and recreational areas",
    category: "park",
    address: "Brooklyn, NY 11201",
    city: "Brooklyn",
    region: "New York",
    country: "United States",
    lat: 40.701736,
    lng: -73.996864,
    cover_image_url: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800",
    is_verified: true,
    post_count: 0,
    follower_count: 0,
  },
  {
    name: "High Line",
    description: "Elevated linear park built on historic freight rail line above Manhattan streets",
    category: "park",
    address: "New York, NY 10011",
    city: "New York",
    region: "New York",
    country: "United States",
    lat: 40.747993,
    lng: -74.004764,
    cover_image_url: "https://images.unsplash.com/photo-1560719887-fe3105fa1e55?w=800",
    is_verified: true,
    post_count: 0,
    follower_count: 0,
  },
  {
    name: "Times Square",
    description: "Iconic commercial intersection and entertainment hub in Midtown Manhattan",
    category: "landmark",
    address: "Manhattan, NY 10036",
    city: "New York",
    region: "New York",
    country: "United States",
    lat: 40.758896,
    lng: -73.985130,
    cover_image_url: "https://images.unsplash.com/photo-1560093011-2d28d739a1f0?w=800",
    is_verified: true,
    post_count: 0,
    follower_count: 0,
  },
  {
    name: "The Metropolitan Museum of Art",
    description: "World-renowned art museum with vast collection spanning 5,000 years",
    category: "museum",
    address: "1000 5th Ave, New York, NY 10028",
    city: "New York",
    region: "New York",
    country: "United States",
    lat: 40.779437,
    lng: -73.963244,
    cover_image_url: "https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=800",
    is_verified: true,
    post_count: 0,
    follower_count: 0,
  },
  {
    name: "Prospect Park",
    description: "Brooklyn's flagship park with meadows, forests, and a lake",
    category: "park",
    address: "Brooklyn, NY 11225",
    city: "Brooklyn",
    region: "New York",
    country: "United States",
    lat: 40.660204,
    lng: -73.968857,
    cover_image_url: "https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=800",
    is_verified: true,
    post_count: 0,
    follower_count: 0,
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check existing places
    const existing = await base44.asServiceRole.entities.Place.list("-created_date", 100);
    const existingNames = new Set(existing.map(p => p.name));

    const created = [];
    for (const place of REAL_PLACES) {
      if (!existingNames.has(place.name)) {
        const newPlace = await base44.asServiceRole.entities.Place.create(place);
        created.push(newPlace.name);
      }
    }

    return Response.json({
      success: true,
      message: `Seeded ${created.length} new places`,
      created,
      skipped: REAL_PLACES.length - created.length,
    });
  } catch (error) {
    console.error("Seed error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});