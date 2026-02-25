import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Music, Disc, Mic2, X, Play, Pause, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SPOTIFY_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

function formatDuration(ms) {
  if (!ms) return "";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFollowers(n) {
  if (!n) return "";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M followers`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K followers`;
  return `${n} followers`;
}

// Global audio manager — only one preview at a time
let globalAudio = null;
let globalSetPlaying = null;

function PreviewButton({ previewUrl }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      clearInterval(intervalRef.current);
    };
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!previewUrl) return;

    // Stop any other playing preview
    if (globalAudio && globalAudio !== audioRef.current) {
      globalAudio.pause();
      globalAudio.currentTime = 0;
      if (globalSetPlaying) globalSetPlaying(false);
    }

    if (playing) {
      audioRef.current.pause();
      clearInterval(intervalRef.current);
      setPlaying(false);
      setProgress(0);
      audioRef.current.currentTime = 0;
      globalAudio = null;
      globalSetPlaying = null;
    } else {
      if (!audioRef.current) audioRef.current = new Audio(previewUrl);
      audioRef.current.src = previewUrl;
      audioRef.current.play();
      globalAudio = audioRef.current;
      globalSetPlaying = setPlaying;
      setPlaying(true);
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / 30) * 100);
        }
      }, 200);
      audioRef.current.onended = () => {
        setPlaying(false);
        setProgress(0);
        clearInterval(intervalRef.current);
        globalAudio = null;
        globalSetPlaying = null;
      };
    }
  };

  if (!previewUrl) return null;

  return (
    <button onClick={handleToggle}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 relative overflow-hidden shrink-0"
      style={{ backgroundColor: playing ? "#1a1a1a" : "var(--bg-subtle)", color: playing ? "#1DB954" : "var(--text-secondary)", border: "1px solid var(--border-light)", minWidth: 64 }}>
      {playing && (
        <div className="absolute left-0 top-0 bottom-0 rounded-xl opacity-20 transition-all"
          style={{ width: `${progress}%`, backgroundColor: "#1DB954" }} />
      )}
      <span className="relative z-10 flex items-center gap-1">
        {playing ? <Square className="w-3 h-3" fill="currentColor" /> : <Play className="w-3 h-3" fill="currentColor" />}
        {playing ? "Stop" : "Preview"}
      </span>
    </button>
  );
}

function TrackCard({ item }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="flex items-center gap-3 p-3">
        {item.cover_url ? (
          <img src={item.cover_url} alt={item.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <Music className="w-6 h-6" style={{ color: "var(--text-hint)" }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{item.artist}</p>
          {item.album && (
            <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-hint)" }}>
              💿 {item.album}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {item.release_year && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                {item.release_year}
              </span>
            )}
            {item.duration_ms && (
              <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>{formatDuration(item.duration_ms)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-end shrink-0">
          {item.preview_url && <PreviewButton previewUrl={item.preview_url} />}
          {item.spotify_url && (
            <a href={item.spotify_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ backgroundColor: "#1DB954", color: "#fff" }}>
              {SPOTIFY_ICON} Listen
            </a>
          )}
        </div>
      </div>
      {/* Album page link */}
      {item.album_url && (
        <div className="px-3 pb-2.5">
          <a href={item.album_url} target="_blank" rel="noopener noreferrer"
            className="text-[10px] flex items-center gap-1 hover:underline"
            style={{ color: "#1DB954" }}>
            View album on Spotify →
          </a>
        </div>
      )}
    </motion.div>
  );
}

function ArtistCard({ item }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      {item.cover_url ? (
        <img src={item.cover_url} alt={item.title} className="w-14 h-14 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <Mic2 className="w-6 h-6" style={{ color: "var(--text-hint)" }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{formatFollowers(item.followers)}</p>
        {item.genres?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {item.genres.map(g => (
              <span key={g} className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>{g}</span>
            ))}
          </div>
        )}
      </div>
      {item.spotify_url && (
        <a href={item.spotify_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0"
          style={{ backgroundColor: "#1DB954", color: "#fff" }}>
          {SPOTIFY_ICON} Open
        </a>
      )}
    </motion.div>
  );
}

function AlbumCard({ item }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="flex items-center gap-3 p-3">
        {item.cover_url ? (
          <img src={item.cover_url} alt={item.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <Disc className="w-6 h-6" style={{ color: "var(--text-hint)" }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{item.artist}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {item.release_date && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                📅 {item.release_date}
              </span>
            )}
            {item.total_tracks && (
              <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>{item.total_tracks} tracks</span>
            )}
          </div>
        </div>
        {item.spotify_url && (
          <a href={item.spotify_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0"
            style={{ backgroundColor: "#1DB954", color: "#fff" }}>
            {SPOTIFY_ICON} Open
          </a>
        )}
      </div>
    </motion.div>
  );
}

const SEARCH_TYPES = [
  { key: "track", label: "Tracks", icon: Music },
  { key: "artist", label: "Artists", icon: Mic2 },
  { key: "album", label: "Albums", icon: Disc },
];

const QUICK_SEARCHES = ["Hip-Hop", "Afrobeats", "R&B", "Pop hits", "Indie", "Classical", "Jazz", "Rock classics"];

export default function SpotifyMusicTab({ user }) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("track");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const doSearch = async (q, type) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("spotifySearch", { query: q.trim(), type, limit: 20 });
      setResults(res.data);
    } catch (e) {
      setError("Search failed. Please try again.");
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(query, searchType);
  };

  const items = results
    ? (searchType === "track" ? results.tracks : searchType === "artist" ? results.artists : results.albums) || []
    : [];

  return (
    <div className="pb-10">
      {/* Spotify branding header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Spotify Music</p>
          <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>Search tracks, artists & albums · 30-sec previews</p>
        </div>
      </div>

      {/* Type selector */}
      <div className="px-5 mb-3">
        <div className="flex gap-1 p-0.5 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
          {SEARCH_TYPES.map(t => (
            <button key={t.key} onClick={() => { setSearchType(t.key); if (query) doSearch(query, t.key); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: searchType === t.key ? "var(--bg-card)" : "transparent",
                color: searchType === t.key ? "var(--accent-primary)" : "var(--text-hint)",
                boxShadow: searchType === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
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
              placeholder={`Search ${searchType === "track" ? "songs" : searchType === "artist" ? "artists" : "albums"}...`}
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
            style={{ backgroundColor: "#1DB954", color: "#fff" }}>
            {loading ? "..." : "Go"}
          </button>
        </div>
      </form>

      {/* Preview note */}
      {searchType === "track" && !results && (
        <div className="mx-5 mb-3 flex items-center gap-2 p-2.5 rounded-xl text-[11px]"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
          <Play className="w-3 h-3 shrink-0" style={{ color: "#1DB954" }} />
          Search tracks to hear 30-second previews directly in the app (where available).
        </div>
      )}

      {/* Quick search chips */}
      {!results && (
        <div className="px-5 mb-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max pb-1">
            {QUICK_SEARCHES.map(q => (
              <button key={q} onClick={() => { setQuery(q); doSearch(q, searchType); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 p-3 rounded-xl text-xs text-center" style={{ backgroundColor: "#FEF0E6", color: "#D98B62" }}>{error}</div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "#1DB954", borderTopColor: "transparent" }} />
        </div>
      ) : items.length > 0 ? (
        <div className="px-5 space-y-2">
          <p className="text-[11px] mb-2" style={{ color: "var(--text-hint)" }}>{items.length} result{items.length !== 1 ? "s" : ""} for "{query}"</p>
          <AnimatePresence>
            {items.map(item => (
              searchType === "track" ? <TrackCard key={item.id} item={item} /> :
              searchType === "artist" ? <ArtistCard key={item.id} item={item} /> :
              <AlbumCard key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </div>
      ) : results && items.length === 0 ? (
        <div className="py-12 text-center px-5">
          <p className="text-3xl mb-3">🎵</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No results found for "{query}"</p>
        </div>
      ) : (
        <div className="py-10 text-center px-5">
          <p className="text-4xl mb-3">🎧</p>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Search anything on Spotify</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Tracks, artists, albums — all in one place</p>
        </div>
      )}

      {/* Spotify attribution */}
      <p className="text-[10px] text-center px-5 mt-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        Powered by <span style={{ color: "#1DB954", fontWeight: 600 }}>Spotify</span>. Music data © Spotify AB. 30-second previews provided by the Spotify API. This app is not affiliated with Spotify.
      </p>
    </div>
  );
}