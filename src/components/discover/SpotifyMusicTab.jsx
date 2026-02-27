import React, { useState, useRef, useCallback } from "react";
import { Search, Music, X, Play, Pause, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WorthItButton from "./WorthItButton";
import ShareModal from "./ShareModal.jsx";

const GENRE_FILTERS = ["All", "Pop", "Hip-Hop", "R&B", "Rock", "Afrobeats", "Latin", "K-Pop", "Classical", "Dance", "Emotional"];

const GENRE_KEYWORDS = {
  "Pop": ["pop", "taylor", "dua", "ed sheeran", "bts", "rose", "bruno", "justin", "billie", "sheeran", "wham", "abba", "cyndi", "rick", "phil", "celine", "lewis", "benson", "duncan", "stephen"],
  "Hip-Hop": ["rap", "hip hop", "50 cent", "usher", "coolio", "2pac", "outkast", "jay-z", "eminem", "ludacris", "kanye", "drake", "kendrick"],
  "R&B": ["r&b", "the weeknd", "rihanna", "khalid", "lady gaga", "beyonce"],
  "Rock": ["rock", "arctic monkeys", "coldplay", "keane", "foreigner", "survivor", "police", "a-ha", "nirvana", "queen", "metallica"],
  "Afrobeats": ["afro", "burna boy", "p-square", "innoss", "wizkid", "davido", "rema", "ckay"],
  "Latin": ["latin", "daddy yankee", "reggaeton", "despacito", "bachata", "salsa"],
  "K-Pop": ["k-pop", "bts", "rosé", "jennie", "blackpink", "exo", "twice", "stray kids"],
  "Classical": ["classical", "beethoven", "mozart", "bach", "chopin", "orchestra", "symphony"],
  "Dance": ["dance", "disco", "electronic", "edm", "house", "techno", "dua lipa", "calvin harris"],
  "Emotional": ["sad", "emotional", "ballad", "heartbreak", "someone you loved", "another love", "lovely"],
};

const formatDuration = (ms) => {
  if (!ms) return null;
  const mins = Math.floor(ms / 60000);
  const secs = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${mins}:${secs}`;
};

function MiniPlayer({ track, isPlaying, onToggle, onClose }) {
  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      exit={{ y: 80 }}
      className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
      style={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {track.cover_url ? (
        <img src={track.cover_url} alt={track.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
          <Music className="w-5 h-5 text-white/60" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{track.title}</p>
        <p className="text-[10px] text-white/60 truncate">{track.artist}</p>
      </div>
      <button onClick={onToggle} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#1DB954" }}>
        {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
      </button>
      <button onClick={onClose} className="text-white/50 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function TrackCard({ track, isCurrentTrack, isPlaying, onPlay, onShare }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: isCurrentTrack ? "rgba(29,185,84,0.08)" : "var(--bg-card)", border: `1px solid ${isCurrentTrack ? "#1DB95430" : "var(--border-light)"}` }}
    >
      {/* Album art + play button */}
      <div className="relative shrink-0 cursor-pointer" onClick={onPlay}>
        {track.cover_url ? (
          <img src={track.cover_url} alt={track.title} className="w-16 h-16 rounded-xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <Music className="w-7 h-7" style={{ color: "var(--text-hint)" }} />
          </div>
        )}
        {track.preview_url && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
            {isCurrentTrack && isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
          </div>
        )}
        {isCurrentTrack && isPlaying && (
          <div className="absolute bottom-1 right-1 flex gap-px items-end">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-1 rounded-full bg-green-400 wave-bar" style={{ height: 8 }} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug truncate" style={{ color: "var(--text-primary)" }}>{track.title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>{track.artist}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {track.album && <span className="text-[10px] truncate max-w-[100px]" style={{ color: "var(--text-hint)" }}>💿 {track.album}</span>}
          {track.duration && <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>{track.duration}</span>}
          {track.release_year && <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>{track.release_year}</span>}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {track.preview_url && (
            <button onClick={onPlay} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95" style={{ backgroundColor: "#1DB954", color: "#fff" }}>
              <Play className="w-3 h-3" /> Preview
            </button>
          )}
          {track.itunes_url && (
            <a href={track.itunes_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
              style={{ backgroundColor: "#FC3C44", color: "#fff" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.25 14.375a.625.625 0 01-.625-.625V8.25l-5 1.25V17a.625.625 0 01-.625.625.625.625 0 01-.625-.625V9.875a.625.625 0 01.469-.605l6.25-1.563A.625.625 0 0115.875 8.25v7.5a.625.625 0 01-.625.625z"/></svg>
              iTunes
            </a>
          )}
          <WorthItButton contentType="song" contentId={`${track.title}|${track.artist}`} />
          <button onClick={e => { e.stopPropagation(); onShare && onShare(track); }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-medium"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
            Share
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function SpotifyMusicTab() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const fetchItunes = useCallback(async (url) => {
    // Try direct first, fall back to allorigins proxy
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("bad status");
      return await res.json();
    } catch {
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxy);
      const wrapper = await res.json();
      return JSON.parse(wrapper.contents);
    }
  }, []);

  const mapTrack = (t) => ({
    id: String(t.trackId || `${t.trackName}|${t.artistName}`),
    title: t.trackName,
    artist: t.artistName,
    album: t.collectionName,
    cover_url: t.artworkUrl100?.replace("100x100", "300x300"),
    itunes_url: t.trackViewUrl,
    preview_url: t.previewUrl,
    duration: formatDuration(t.trackTimeMillis),
    release_year: t.releaseDate ? new Date(t.releaseDate).getFullYear() : null,
    genre: t.primaryGenreName,
  });

  const searchItunes = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults(null); return; }
    setLoading(true);
    setError(null);
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=25&media=music&country=US`;
      const data = await fetchItunes(url);
      setSearchResults(data.results.map(mapTrack));
    } catch (err) {
      setError("Could not load results. Check your connection.");
    }
    setLoading(false);
  }, [fetchItunes]);

  const handleSearch = (e) => { e.preventDefault(); searchItunes(query); };

  const handlePlay = (track) => {
    if (!track.preview_url) return;
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(track.preview_url);
    audioRef.current.play();
    audioRef.current.onended = () => setIsPlaying(false);
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleClosePlayer = () => {
    audioRef.current?.pause();
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  // Curated browseable tracks (fetch on demand per genre)
  const [browseTracks, setBrowseTracks] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  const loadBrowse = useCallback(async (g) => {
    setBrowseLoading(true);
    setBrowseTracks([]);
    const terms = {
      "All": "top hits 2024",
      "Pop": "pop hits",
      "Hip-Hop": "hip hop rap",
      "R&B": "r&b soul",
      "Rock": "rock classic",
      "Afrobeats": "afrobeats afropop",
      "Latin": "latin reggaeton",
      "K-Pop": "k-pop",
      "Classical": "classical piano",
      "Dance": "dance electronic",
      "Emotional": "sad emotional ballad",
    };
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(terms[g] || g)}&entity=song&limit=30&media=music&country=US`;
      const data = await fetchItunes(url);
      setBrowseTracks(data.results.map(mapTrack));
    } catch (err) {
      setError("Failed to load tracks.");
    }
    setBrowseLoading(false);
  }, []);

  React.useEffect(() => {
    if (!searchResults) loadBrowse(genre);
  }, [genre]);

  const displayList = searchResults || browseTracks;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FC3C44" }}>
          <Music className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Music Discovery</p>
          <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>Powered by iTunes · 30s previews included</p>
        </div>
      </div>

      {/* Genre chips */}
      <div className="px-5 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-1">
          {GENRE_FILTERS.map(g => (
            <button key={g} onClick={() => { setGenre(g); setSearchResults(null); setQuery(""); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
              style={{
                backgroundColor: genre === g && !searchResults ? "#FC3C44" : "var(--bg-card)",
                color: genre === g && !searchResults ? "#fff" : "var(--text-secondary)",
                borderColor: genre === g && !searchResults ? "#FC3C44" : "var(--border-light)",
              }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="px-5 mb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search any song or artist…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setSearchResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
              </button>
            )}
          </div>
          <button type="submit" disabled={!query.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: "#FC3C44", color: "#fff" }}>
            {loading ? "…" : "Go"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mx-5 mb-3 p-3 rounded-xl text-xs text-center" style={{ backgroundColor: "#FEF0E6", color: "#D98B62" }}>{error}</div>
      )}

      <p className="px-5 mb-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
        {searchResults ? `${displayList.length} results for "${query}"` : `${displayList.length} tracks · ${genre}`}
      </p>

      {loading || browseLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "#FC3C44", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div className="px-5 space-y-2">
          <AnimatePresence>
            {displayList.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                isCurrentTrack={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPlay={() => handlePlay(track)}
                onShare={setShareItem}
              />
            ))}
          </AnimatePresence>
          {searchResults && (
            <button onClick={() => { setSearchResults(null); setQuery(""); }}
              className="w-full py-2 text-xs font-medium text-center" style={{ color: "var(--text-hint)" }}>
              ← Back to browse
            </button>
          )}
          {displayList.length === 0 && !loading && !browseLoading && (
            <div className="py-12 text-center">
              <p className="text-3xl mb-3">🎵</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No tracks found</p>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-center px-5 mt-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        Music data provided by <span style={{ color: "#FC3C44", fontWeight: 600 }}>Apple iTunes</span>. 30-second previews are for discovery only. All links open Apple Music. No music is hosted in this app.
      </p>

      <AnimatePresence>
        {currentTrack && (
          <MiniPlayer track={currentTrack} isPlaying={isPlaying} onToggle={() => handlePlay(currentTrack)} onClose={handleClosePlayer} />
        )}
      </AnimatePresence>

      {shareItem && <ShareModal item={shareItem} onClose={() => setShareItem(null)} />}
    </div>
  );
}