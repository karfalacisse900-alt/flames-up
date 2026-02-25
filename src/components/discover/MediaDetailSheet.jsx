import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Square, ExternalLink, Star } from "lucide-react";

// ── tiny preview player ────────────────────────────────────────────────────
function PreviewPlayer({ url }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const tickRef = useRef(null);

  const toggle = () => {
    if (!url) return;
    if (playing) {
      audioRef.current?.pause();
      clearInterval(tickRef.current);
      setPlaying(false);
      setProgress(0);
    } else {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setPlaying(true);
      tickRef.current = setInterval(() => setProgress(((audio.currentTime || 0) / 30) * 100), 150);
      audio.onended = () => { setPlaying(false); setProgress(0); clearInterval(tickRef.current); };
    }
  };

  React.useEffect(() => () => {
    audioRef.current?.pause();
    clearInterval(tickRef.current);
  }, []);

  return (
    <button onClick={toggle}
      className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold overflow-hidden transition-all active:scale-95 w-full justify-center"
      style={{ backgroundColor: playing ? "#111" : "#E8F2EC", color: playing ? "#1DB954" : "var(--accent-primary)", border: "1px solid var(--border-light)" }}>
      {playing && <div className="absolute inset-0 opacity-20 rounded-xl" style={{ width: `${progress}%`, backgroundColor: "#1DB954", transition: "width 0.15s" }} />}
      <span className="relative z-10 flex items-center gap-2">
        {playing ? <Square className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4" fill="currentColor" />}
        {playing ? "Stop Preview" : "▶ Play 30s Preview"}
      </span>
    </button>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────
function Tag({ children, accent }) {
  return (
    <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
      style={{ backgroundColor: accent ? "var(--accent-primary-light)" : "var(--bg-subtle)", color: accent ? "var(--accent-primary)" : "var(--text-secondary)" }}>
      {children}
    </span>
  );
}

function ActionButton({ href, label, color, icon }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
      style={{ backgroundColor: color, color: "#fff" }}>
      {icon}
      {label}
    </a>
  );
}

// ── Spotify Music detail ───────────────────────────────────────────────────
function MusicDetail({ item }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start">
        {item.cover_url ? (
          <img src={item.cover_url} alt={item.title} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shrink-0" style={{ backgroundColor: "var(--bg-subtle)" }}>🎵</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{item.title}</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>🎤 {item.artist}</p>
          {item.album && <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>💿 {item.album}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.duration_str && <Tag>{item.duration_str}</Tag>}
            {item.release_year && <Tag>{item.release_year}</Tag>}
          </div>
        </div>
      </div>

      {item.preview_url && <PreviewPlayer url={item.preview_url} />}

      {item.spotify_url && (
        <ActionButton href={item.spotify_url} label="Listen on Spotify"
          color="#1DB954"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>}
        />
      )}
    </div>
  );
}

// ── Open Library Book detail ───────────────────────────────────────────────
function BookDetail({ item }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start">
        {item.cover_url ? (
          <img src={item.cover_url} alt={item.title} className="w-20 rounded-xl object-cover shrink-0" style={{ height: 110 }} />
        ) : (
          <div className="w-20 rounded-xl flex items-center justify-center text-4xl shrink-0" style={{ height: 110, backgroundColor: "var(--bg-subtle)" }}>📚</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{item.title}</p>
          {item.author && <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>✍️ {item.author}</p>}
          {item.year && <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>📅 {item.year}</p>}
          {item.publisher && <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{item.publisher}</p>}
        </div>
      </div>

      {item.subjects?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.subjects.slice(0, 8).map(s => <Tag key={s}>{s}</Tag>)}
        </div>
      )}

      {item.description && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
      )}

      {item.ol_url && (
        <ActionButton href={item.ol_url} label="Read / Buy on Open Library"
          color="#2980b9"
          icon={<span>📖</span>}
        />
      )}
    </div>
  );
}

// ── TMDb Movie / Show detail ───────────────────────────────────────────────
function MovieDetail({ item }) {
  const isTV = item.media_type === "tv";
  const PLATFORMS = [
    { name: "Netflix", color: "#E50914", url: (t) => `https://www.netflix.com/search?q=${encodeURIComponent(t)}` },
    { name: "Disney+", color: "#006E99", url: (t) => `https://www.disneyplus.com/search/${encodeURIComponent(t)}` },
    { name: "Prime Video", color: "#00A8E1", url: (t) => `https://www.amazon.com/s?k=${encodeURIComponent(t)}&i=instant-video` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start">
        {item.poster_url ? (
          <img src={item.poster_url} alt={item.title} className="w-24 rounded-2xl object-cover shrink-0" style={{ height: 140 }} />
        ) : (
          <div className="w-24 rounded-2xl flex items-center justify-center text-4xl shrink-0" style={{ height: 140, backgroundColor: "var(--bg-subtle)" }}>{isTV ? "📺" : "🎬"}</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{item.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[11px] px-2 py-0.5 rounded-md font-medium"
              style={{ backgroundColor: isTV ? "#E8F2EC" : "#FFF3E0", color: isTV ? "var(--accent-primary)" : "#D98B62" }}>
              {isTV ? "📺 Show" : "🎬 Movie"}
            </span>
            {item.release_year && <span className="text-xs" style={{ color: "var(--text-hint)" }}>{item.release_year}</span>}
            {item.vote_average && (
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#F5A623" }}>
                <Star className="w-3 h-3 fill-current" />{item.vote_average}
              </span>
            )}
          </div>
        </div>
      </div>

      {item.overview && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.overview}</p>
      )}

      {item.tmdb_url && (
        <ActionButton href={item.tmdb_url} label="View on TMDb" color="#01B4E4"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M0 12C0 5.373 5.373 0 12 0s12 5.373 12 12-5.373 12-12 12S0 18.627 0 12z"/></svg>}
        />
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Search on streaming platforms</p>
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map(p => (
            <a key={p.name} href={p.url(item.title)} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 min-w-[80px]"
              style={{ backgroundColor: p.color, color: "#fff" }}>
              {p.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Static catalogue Game / Movie/Show detail ──────────────────────────────
function StaticMediaDetail({ item }) {
  const isGame = item.media_type === "game";
  const isBook = item.media_type === "book";

  const searchUrl = isGame
    ? `https://www.igdb.com/search?type=1&q=${encodeURIComponent(item.title)}`
    : `https://www.google.com/search?q=${encodeURIComponent(item.title + " " + (item.media_type === "movie" ? "movie" : "TV show"))}`;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0" style={{ backgroundColor: "var(--bg-subtle)" }}>
          {{ movie: "🎬", show: "📺", book: "📚", game: "🎮", music: "🎵" }[item.media_type] || "🎭"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{item.title}</p>
          {item.creator && <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>👤 {item.creator}</p>}
          {item.release_year && <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>📅 {item.release_year}</p>}
        </div>
      </div>

      {(item.genre?.length > 0 || item.mood_tags?.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {item.genre?.map(g => <Tag key={g} accent>{g}</Tag>)}
          {item.mood_tags?.map(m => <Tag key={m}>{m}</Tag>)}
        </div>
      )}

      {item.description && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
      )}

      {item.suggested_audience && (
        <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-hint)" }}>Best for</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.suggested_audience}</p>
        </div>
      )}

      {item.similar_items?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-hint)" }}>You might also like</p>
          <div className="flex flex-wrap gap-1.5">
            {item.similar_items.map(s => <Tag key={s}>{s}</Tag>)}
          </div>
        </div>
      )}

      <ActionButton href={searchUrl} label={isGame ? "View on IGDB" : `Search "${item.title}"`}
        color="var(--accent-primary)" icon={<ExternalLink className="w-4 h-4" />} />
    </div>
  );
}

// ── Main sheet ─────────────────────────────────────────────────────────────
export default function MediaDetailSheet({ item, onClose }) {
  if (!item) return null;

  // Determine which detail view to render
  const renderContent = () => {
    // Spotify enriched track (has spotify_url or preview_url)
    if (item.spotify_url || item.preview_url || (item.media_type === "music" && item.artist)) {
      return <MusicDetail item={item} />;
    }
    // Open Library book (has ol_url)
    if (item.ol_url) {
      return <BookDetail item={item} />;
    }
    // TMDb item (has tmdb_url or poster_url)
    if (item.tmdb_url || item.poster_url) {
      return <MovieDetail item={item} />;
    }
    // Static catalogue item
    return <StaticMediaDetail item={item} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "88vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 pt-3 pb-2 flex flex-col items-center" style={{ backgroundColor: "var(--bg-modal)" }}>
          <div className="w-10 h-1 rounded-full mb-2" style={{ backgroundColor: "var(--border-medium)" }} />
          <button onClick={onClose} className="absolute right-4 top-3 p-1.5 rounded-full transition-all active:scale-90"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-8">
          {renderContent()}

          <p className="text-[10px] text-center mt-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
            Not affiliated with any studio, label, publisher, or developer. All media belongs to their respective owners.
          </p>
        </div>
      </motion.div>
    </div>
  );
}