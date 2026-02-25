import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const API_KEY = Deno.env.get("TMDB_API_KEY");

function formatResult(item) {
  const isMovie = item.media_type === "movie" || item.title !== undefined;
  return {
    id: item.id,
    media_type: isMovie ? "movie" : "show",
    title: item.title || item.name,
    overview: item.overview,
    poster_url: item.poster_path ? `${TMDB_IMG}${item.poster_path}` : null,
    release_year: (item.release_date || item.first_air_date || "").split("-")[0],
    genre_ids: item.genre_ids || [],
    vote_average: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
    popularity: item.popularity,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { query, type = "multi", page = 1 } = await req.json();

    let url;
    if (query && query.trim()) {
      const endpoint = type === "movie" ? "movie" : type === "tv" ? "tv" : "multi";
      url = `${TMDB_BASE}/search/${endpoint}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
    } else {
      // Trending
      const endpoint = type === "tv" ? "tv" : type === "movie" ? "movie" : "all";
      url = `${TMDB_BASE}/trending/${endpoint}/week?api_key=${API_KEY}&page=${page}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    const results = (data.results || [])
      .filter(r => r.media_type !== "person")
      .map(formatResult);

    // Fetch genre list for mapping
    const [movieGenres, tvGenres] = await Promise.all([
      fetch(`${TMDB_BASE}/genre/movie/list?api_key=${API_KEY}`).then(r => r.json()),
      fetch(`${TMDB_BASE}/genre/tv/list?api_key=${API_KEY}`).then(r => r.json()),
    ]);

    const genreMap = {};
    [...(movieGenres.genres || []), ...(tvGenres.genres || [])].forEach(g => { genreMap[g.id] = g.name; });

    const enriched = results.map(r => ({
      ...r,
      genres: (r.genre_ids || []).map(id => genreMap[id]).filter(Boolean),
    }));

    return Response.json({ results: enriched, total_results: data.total_results });
  } catch (error) {
    console.error("TMDb error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});