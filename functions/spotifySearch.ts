import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getSpotifyToken() {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { query, type = "track", limit = 20 } = body;

    if (!query) return Response.json({ error: "Missing query" }, { status: 400 });

    const token = await getSpotifyToken();

    const searchTypes = type === "all" ? "track,artist,album" : type;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${searchTypes}&limit=${limit}&market=US`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    const results = {
      tracks: data.tracks?.items?.map(t => ({
        id: t.id,
        type: "track",
        title: t.name,
        artist: t.artists?.map(a => a.name).join(", "),
        album: t.album?.name,
        cover_url: t.album?.images?.[0]?.url,
        spotify_url: t.external_urls?.spotify,
        album_url: t.album?.external_urls?.spotify,
        duration_ms: t.duration_ms,
        preview_url: t.preview_url,
        release_year: t.album?.release_date?.split("-")[0],
        release_date: t.album?.release_date,
      })) || [],

      artists: data.artists?.items?.map(a => ({
        id: a.id,
        type: "artist",
        title: a.name,
        artist: a.name,
        genres: a.genres?.slice(0, 3),
        cover_url: a.images?.[0]?.url,
        spotify_url: a.external_urls?.spotify,
        followers: a.followers?.total,
      })) || [],

      albums: data.albums?.items?.map(a => ({
        id: a.id,
        type: "album",
        title: a.name,
        artist: a.artists?.map(ar => ar.name).join(", "),
        cover_url: a.images?.[0]?.url,
        spotify_url: a.external_urls?.spotify,
        release_year: a.release_date?.split("-")[0],
        release_date: a.release_date,
        total_tracks: a.total_tracks,
      })) || [],
    };

    return Response.json(results);
  } catch (error) {
    console.error("Spotify search error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});