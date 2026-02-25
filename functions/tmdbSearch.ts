import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w300";
const API_KEY = Deno.env.get("TMDB_API_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    console.log("TMDb request body:", JSON.stringify({ user: user?.email }));

    const { query, type = "movie", page = 1, genre_id, sort_mode } = await req.json();

    const mediaType = type === "tv" ? "tv" : "movie";
    let url;

    if (query) {
      // Text search
      const endpoint = type === "tv" ? "search/tv" : "search/movie";
      url = `${TMDB_BASE}/${endpoint}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    } else {
      // Discover with sort/filter
      let tmdbSort = "popularity.desc";
      if (sort_mode === "vote_average") tmdbSort = "vote_average.desc";
      else if (sort_mode === "release_date_desc") tmdbSort = "primary_release_date.desc";
      else if (sort_mode === "release_date_asc") tmdbSort = "primary_release_date.asc";

      let discoverUrl = `${TMDB_BASE}/discover/${mediaType}?api_key=${API_KEY}&sort_by=${tmdbSort}&page=${page}&vote_count.gte=50`;
      if (genre_id) discoverUrl += `&with_genres=${genre_id}`;
      url = discoverUrl;
    }

    const res = await fetch(url);
    const data = await res.json();

    const results = (data.results || []).map(item => {
      const isTV = item.media_type === "tv" || type === "tv";
      const title = item.title || item.name;
      const releaseDate = item.release_date || item.first_air_date;
      const year = releaseDate ? releaseDate.split("-")[0] : null;
      return {
        id: item.id,
        title,
        media_type: item.media_type || type,
        overview: item.overview,
        poster_url: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : null,
        backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : null,
        release_year: year,
        vote_average: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
        vote_count: item.vote_count,
        genre_ids: item.genre_ids || [],
        popularity: item.popularity,
        tmdb_url: isTV
          ? `https://www.themoviedb.org/tv/${item.id}`
          : `https://www.themoviedb.org/movie/${item.id}`,
      };
    });

    return Response.json({ results, total_results: data.total_results, total_pages: data.total_pages });
  } catch (error) {
    console.error("TMDb error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});