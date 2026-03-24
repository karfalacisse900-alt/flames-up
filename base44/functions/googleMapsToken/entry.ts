import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const key = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!key) return Response.json({ error: "Google Maps API key not configured" }, { status: 500 });
    return Response.json({ key });
  } catch (error) {
    console.error("googleMapsToken error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});