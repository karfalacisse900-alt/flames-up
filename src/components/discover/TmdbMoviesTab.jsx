import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Film, Tv, Star, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MediaDetailSheet from "./MediaDetailSheet";

// TMDb genre IDs
const MOVIE_GENRES = [
  { label: "All", id: null },
  { label: "Action", id: 28 },
  { label: "Comedy", id: 35 },
  { label: "Drama", id: 18 },
  { label: "Horror", id: 27 },
  { label: "Romance", id: 10749 },
  { label: "Sci-Fi", id: 878 },
  { label: "Thriller", id: 53 },
  { label: "Animation", id: 16 },
  { label: "Documentary", id: 99 },
  { label: "Fantasy", id: 14 },
];

const TV_GENRES = [
  { label: "All", id: null },
  { label: "Action", id: 10759 },
  { label: "Comedy", id: 35 },
  { label: "Drama", id: 18 },
  { label: "Reality", id: 10764 },
  { label: "Sci-Fi", id: 10765 },
  { label: "Thriller", id: 80 },
  { label: "Animation", id: 16 },
  { label: "Documentary", id: 99 },
  { label: "Family", id: 10751 },
];

// Streaming platform suggestions (TMDb doesn't give direct links, we link to search)
const PLATFORMS = [
  { name: "Netflix", color: "#E50914", search: (t) => `https://www.netflix.com/search?q=${encodeURIComponent(t)}` },
  { name: "Disney+", color: "#006E99", search: (t) => `https://www.disneyplus.com/search/${encodeURIComponent(t)}` },
  { name: "Prime", color: "#00A8E1", search: (t) => `https://www.amazon.com/s?k=${encodeURIComponent(t)}&i=instant-video` },
];

function StarRating({ score }) {
  if (!score) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#F5A623" }}>
      <Star className="w-3 h-3 fill-current" />
      {score}
    </span>
  );
}

function MovieCard({ item }) {
  const [showPlatforms, setShowPlatforms] = useState(false);
  const isTV = item.media_type === "tv";

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
            {isTV ? <Tv className="w-7 h-7" style={{ color: "var(--text-hint)" }} /> : <Film className="w-7 h-7" style={{ color: "var(--text-hint)" }} />}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
            style={{ backgroundColor: isTV ? "#E8F2EC" : "#FFF3E0", color: isTV ? "var(--accent-primary)" : "#D98B62" }}>
            {isTV ? "📺 Show" : "🎬 Movie"}
          </span>
          {item.release_year && (
            <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>{item.release_year}</span>
          )}
          <StarRating score={item.vote_average} />
        </div>
        {item.overview && (
          <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {item.overview}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <a href={item.tmdb_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "#01B4E4", color: "#fff" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 12C0 5.373 5.373 0 12 0s12 5.373 12 12-5.373 12-12 12S0 18.627 0 12zm19.2-4.8a1.2 1.2 0 0 0-1.2-1.2H6a1.2 1.2 0 0 0-1.2 1.2v9.6A1.2 1.2 0 0 0 6 18h12a1.2 1.2 0 0 0 1.2-1.2V7.2z"/>
            </svg>
            TMDb
          </a>
          <button onClick={() => setShowPlatforms(p => !p)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all active:scale-95"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
            Watch ▾
          </button>
          {showPlatforms && PLATFORMS.map(p => (
            <a key={p.name} href={p.search(item.title)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
              style={{ backgroundColor: p.color, color: "#fff" }}>
              {p.name}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function TmdbMoviesTab({ defaultTab = "movie" }) {
  const [tab, setTab] = useState(defaultTab === "show" ? "tv" : "movie"); // "movie" | "tv"
  const [genre, setGenre] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSearch, setIsSearch] = useState(false);

  const genres = tab === "movie" ? MOVIE_GENRES : TV_GENRES;

  const fetchContent = async ({ q, gid, type, sort } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("tmdbSearch", {
        query: q || undefined,
        type: type || tab,
        genre_id: gid || undefined,
        sort_mode: sort || sortByRef.current,
        page: 1,
      });
      setResults(res.data?.results || []);
    } catch {
      setError("Failed to load content. Try again.");
    }
    setLoading(false);
  };

  const SORT_OPTIONS = [
    { key: "popularity", label: "🔥 Popular" },
    { key: "vote_average", label: "⭐ Top Rated" },
    { key: "release_date_desc", label: "📅 Newest" },
    { key: "release_date_asc", label: "📅 Oldest" },
  ];

  // Load on mount + tab change
  useEffect(() => {
    setGenre(null);
    setQuery("");
    setIsSearch(false);
    fetchContent({ type: tab });
  }, [tab]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearch(true);
    setGenre(null);
    fetchContent({ q: query.trim() });
  };

  const handleGenre = (g) => {
    setGenre(g.id);
    setQuery("");
    setIsSearch(false);
    fetchContent({ gid: g.id || undefined });
  };

  const handleSort = (key) => {
    setSortBy(key);
    sortByRef.current = key;
    setQuery("");
    setIsSearch(false);
    setGenre(null);
    fetchContent({ sort: key });
  };

  const clearSearch = () => {
    setQuery("");
    setIsSearch(false);
    setGenre(null);
    fetchContent({});
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#01B4E4" }}>
          <Film className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Movies & Shows</p>
          <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>Powered by TMDb · metadata &amp; posters only</p>
        </div>
      </div>

      {/* Movie / TV toggle */}
      <div className="px-5 mb-3 flex gap-2">
        {[{ key: "movie", label: "🎬 Movies" }, { key: "tv", label: "📺 Shows" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold border transition-all"
            style={{
              backgroundColor: tab === t.key ? "var(--accent-primary)" : "var(--bg-card)",
              color: tab === t.key ? "#fff" : "var(--text-secondary)",
              borderColor: tab === t.key ? "var(--accent-primary)" : "var(--border-light)",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Sort options */}
      <div className="px-5 mb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-1">
          {SORT_OPTIONS.map(s => (
            <button key={s.key} onClick={() => handleSort(s.key)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
              style={{
                backgroundColor: sortBy === s.key && !isSearch ? "var(--accent-primary)" : "var(--bg-card)",
                color: sortBy === s.key && !isSearch ? "#fff" : "var(--text-secondary)",
                borderColor: sortBy === s.key && !isSearch ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre chips */}
      <div className="px-5 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-1">
          {genres.map(g => (
            <button key={g.label} onClick={() => handleGenre(g)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
              style={{
                backgroundColor: genre === g.id && !isSearch ? "var(--accent-primary)" : "var(--bg-card)",
                color: genre === g.id && !isSearch ? "#fff" : "var(--text-secondary)",
                borderColor: genre === g.id && !isSearch ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="px-5 mb-3">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${tab === "tv" ? "shows" : "movies"}…`}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            {query && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
              </button>
            )}
          </div>
          <button type="submit" disabled={!query.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
            {loading ? "…" : "Go"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mx-5 mb-3 p-3 rounded-xl text-xs text-center" style={{ backgroundColor: "#FEF0E6", color: "#D98B62" }}>{error}</div>
      )}

      <p className="px-5 mb-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
        {isSearch ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"` : `${results.length} ${tab === "tv" ? "shows" : "movies"}`}
      </p>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
        </div>
      ) : results.length > 0 ? (
        <div className="px-5 space-y-2">
          <AnimatePresence>
            {results.map(item => (
              <div key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer">
                <MovieCard item={item} />
              </div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-12 text-center px-5">
          <p className="text-3xl mb-3">{tab === "tv" ? "📺" : "🎬"}</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No results found</p>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && <MediaDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>

      {/* TMDb Attribution (required) */}
      <div className="px-5 mt-6 flex items-center justify-center gap-2">
        <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
          alt="TMDb" style={{ height: 14, opacity: 0.6 }} />
        <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
          This product uses the TMDb API but is not endorsed or certified by TMDb.
        </p>
      </div>
    </div>
  );
}