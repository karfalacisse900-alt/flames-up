import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Star, Film, Tv } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const GENRE_FILTERS = ["All", "Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller", "Romance", "Animation", "Documentary", "Fantasy", "Crime"];

const QUICK_SEARCHES = ["Marvel", "Studio Ghibli", "Christopher Nolan", "Breaking Bad", "Disney", "Netflix"];

const TYPE_FILTERS = [
  { key: "multi", label: "All" },
  { key: "movie", label: "🎬 Movies" },
  { key: "tv", label: "📺 Shows" },
];

const GENRE_ID_MAP = {
  "Action": [28, 10759], "Comedy": [35], "Drama": [18], "Horror": [27],
  "Sci-Fi": [878, 10765], "Thriller": [53], "Romance": [10749],
  "Animation": [16], "Documentary": [99], "Fantasy": [14, 10765], "Crime": [80],
};

function MovieCard({ item }) {
  const isMovie = item.media_type === "movie";
  const searchQuery = encodeURIComponent(`${item.title} ${isMovie ? "movie" : "TV show"} ${item.release_year || ""}`);
  const imdbUrl = `https://www.imdb.com/find?q=${searchQuery}`;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>

      {/* Poster */}
      <div className="shrink-0">
        {item.poster_url ? (
          <img src={item.poster_url} alt={item.title}
            className="w-16 rounded-xl object-cover" style={{ height: 96 }} />
        ) : (
          <div className="w-16 rounded-xl flex items-center justify-center"
            style={{ height: 96, backgroundColor: "var(--bg-subtle)" }}>
            {isMovie ? <Film className="w-7 h-7" style={{ color: "var(--text-hint)" }} />
              : <Tv className="w-7 h-7" style={{ color: "var(--text-hint)" }} />}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
            {item.title}
          </p>
          <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: isMovie ? "#EEF3F0" : "#FFF3E8", color: isMovie ? "#3C6E5A" : "#D98B62" }}>
            {isMovie ? "Movie" : "Show"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {item.release_year && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {item.release_year}
            </span>
          )}
          {item.vote_average > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: "#FFF3E8", color: "#D98B62" }}>
              <Star className="w-2.5 h-2.5" fill="#D98B62" />
              {item.vote_average}
            </span>
          )}
          {item.genres?.slice(0, 2).map(g => (
            <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              {g}
            </span>
          ))}
        </div>

        {item.overview && (
          <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {item.overview}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <a href={imdbUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "#F5C518", color: "#000" }}>
            <span className="font-black text-[10px]">IMDb</span>
            View
          </a>
          <a href={`https://www.themoviedb.org/${isMovie ? "movie" : "tv"}/${item.id}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "#01B4E4", color: "#fff" }}>
            TMDb
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function TMDbMoviesTab({ defaultType = "multi" }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState(defaultType);
  const [genre, setGenre] = useState("All");
  const [results, setResults] = useState(null);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Load trending on mount
  useEffect(() => {
    const fetchTrending = async () => {
      setTrendingLoading(true);
      try {
        const res = await base44.functions.invoke("tmdbSearch", { query: "", type: "multi" });
        setTrending(res.data?.results || []);
      } catch { /* skip */ }
      setTrendingLoading(false);
    };
    fetchTrending();
  }, []);

  const doSearch = async (q, t = type) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("tmdbSearch", { query: q.trim(), type: t });
      setResults(res.data?.results || []);
    } catch {
      setError("Search failed. Please try again.");
    }
    setLoading(false);
  };

  const handleSearch = (e) => { e.preventDefault(); doSearch(query); };

  const handleTypeChange = (t) => {
    setType(t);
    if (results !== null) doSearch(query, t);
  };

  // Filter by genre (client-side on genre_ids)
  const displayList = (() => {
    const list = results ?? trending;
    if (genre === "All") return list;
    const ids = GENRE_ID_MAP[genre] || [];
    return list.filter(item => item.genre_ids?.some(id => ids.includes(id)) || item.genres?.includes(genre));
  })();

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ backgroundColor: "#01B4E4" }}>
          🎬
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Movies & Shows</p>
          <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
            Powered by TMDb · search titles, directors, actors
          </p>
        </div>
      </div>

      {/* Type filter */}
      <div className="px-5 mb-3 flex gap-2">
        {TYPE_FILTERS.map(t => (
          <button key={t.key} onClick={() => handleTypeChange(t.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              backgroundColor: type === t.key ? "var(--accent-primary)" : "var(--bg-card)",
              color: type === t.key ? "#fff" : "var(--text-secondary)",
              borderColor: type === t.key ? "var(--accent-primary)" : "var(--border-light)",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Genre chips */}
      <div className="px-5 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-1">
          {GENRE_FILTERS.map(g => (
            <button key={g} onClick={() => setGenre(g)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
              style={{
                backgroundColor: genre === g ? "#01B4E4" : "var(--bg-card)",
                color: genre === g ? "#fff" : "var(--text-secondary)",
                borderColor: genre === g ? "#01B4E4" : "var(--border-light)",
              }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="px-5 mb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search title, director, actor…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
              </button>
            )}
          </div>
          <button type="submit" disabled={!query.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: "#01B4E4", color: "#fff" }}>
            {loading ? "…" : "Go"}
          </button>
        </div>
      </form>

      {/* Quick search chips */}
      {!results && (
        <div className="px-5 mb-3 flex flex-wrap gap-2">
          {QUICK_SEARCHES.map(q => (
            <button key={q} onClick={() => { setQuery(q); doSearch(q); }}
              className="px-3 py-1 rounded-full text-xs border"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 p-3 rounded-xl text-xs text-center" style={{ backgroundColor: "#FEF0E6", color: "#D98B62" }}>{error}</div>
      )}

      {/* Count */}
      <p className="px-5 mb-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
        {results
          ? `${displayList.length} result${displayList.length !== 1 ? "s" : ""} for "${query}"`
          : trendingLoading ? "Loading trending…" : `${displayList.length} trending title${displayList.length !== 1 ? "s" : ""}`}
      </p>

      {/* Results */}
      {loading || trendingLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "#01B4E4", borderTopColor: "transparent" }} />
        </div>
      ) : displayList.length > 0 ? (
        <div className="px-5 space-y-2">
          <AnimatePresence>
            {displayList.map(item => <MovieCard key={item.id} item={item} />)}
          </AnimatePresence>
          {results && (
            <button onClick={() => { setResults(null); setQuery(""); }}
              className="w-full py-2 text-xs font-medium text-center" style={{ color: "var(--text-hint)" }}>
              ← Back to trending
            </button>
          )}
        </div>
      ) : (
        <div className="py-12 text-center px-5">
          <p className="text-3xl mb-3">🎭</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No results found</p>
        </div>
      )}

      {/* TMDb legal footer */}
      <div className="px-5 mt-6 flex flex-col items-center gap-1">
        <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
          alt="TMDb" style={{ height: 16, opacity: 0.5 }} />
        <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--text-hint)" }}>
          This product uses the TMDb API but is not endorsed or certified by TMDb. Movie data © The Movie Database.
        </p>
      </div>
    </div>
  );
}