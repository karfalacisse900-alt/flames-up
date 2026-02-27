import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Square, ExternalLink, Star, BookOpen, Film, Music, Gamepad2 } from "lucide-react";

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
      setPlaying(false); setProgress(0);
    } else {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setPlaying(true);
      tickRef.current = setInterval(() => setProgress(((audio.currentTime || 0) / 30) * 100), 150);
      audio.onended = () => { setPlaying(false); setProgress(0); clearInterval(tickRef.current); };
    }
  };

  React.useEffect(() => () => { audioRef.current?.pause(); clearInterval(tickRef.current); }, []);

  return (
    <button onClick={toggle}
      className="relative flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold overflow-hidden transition-all active:scale-95 w-full justify-center"
      style={{ background: playing ? "linear-gradient(135deg, #111, #1a1a2e)" : "linear-gradient(135deg, #1DB95420, #1DB95410)", color: playing ? "#1DB954" : "#1DB954", border: "1.5px solid #1DB95430" }}>
      {playing && <div className="absolute inset-0 opacity-30 rounded-2xl transition-all" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #1DB954, #1ed760)" }} />}
      <span className="relative z-10 flex items-center gap-2">
        {playing ? <Square className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4" fill="currentColor" />}
        {playing ? "Stop Preview" : "▶ Play 30s Preview"}
      </span>
    </button>
  );
}

function MusicDetail({ item }) {
  return (
    <div>
      {/* Hero */}
      <div className="relative h-40 rounded-3xl overflow-hidden mb-4" style={{ background: "linear-gradient(135deg, #1DB954, #121212)" }}>
        {item.cover_url && <img src={item.cover_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
        <div className="absolute inset-0 flex items-end p-4">
          <div>
            <span className="text-green-300 text-xs font-bold uppercase tracking-widest">🎵 Music</span>
            <p className="text-white text-xl font-bold leading-tight">{item.title}</p>
            <p className="text-white/70 text-sm">{item.artist}</p>
          </div>
        </div>
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white, transparent)" }} />
      </div>

      <div className="space-y-3">
        {item.album && <p className="text-sm" style={{ color: "#64748B" }}>💿 {item.album}</p>}
        <div className="flex gap-2 flex-wrap">
          {item.duration_str && <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>{item.duration_str}</span>}
          {item.release_year && <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0" }}>{item.release_year}</span>}
        </div>
        {item.preview_url && <PreviewPlayer url={item.preview_url} />}
        {item.spotify_url && (
          <a href={item.spotify_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #1DB954, #1ed760)", boxShadow: "0 4px 20px #1DB95440" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            Listen on Spotify
          </a>
        )}
      </div>
    </div>
  );
}

function BookDetail({ item }) {
  return (
    <div>
      <div className="relative h-44 rounded-3xl overflow-hidden mb-4" style={{ background: "linear-gradient(135deg, #7C3AED, #DB2777)" }}>
        {item.cover_url && <img src={item.cover_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-40" style={{ objectPosition: "top" }} />}
        <div className="absolute inset-0 flex items-end p-4">
          <div>
            <span className="text-purple-200 text-xs font-bold uppercase tracking-widest">📚 Book</span>
            <p className="text-white text-xl font-bold leading-tight">{item.title}</p>
            {item.author && <p className="text-white/70 text-sm">✍️ {item.author}</p>}
          </div>
        </div>
        {item.cover_url && <img src={item.cover_url} alt="" className="absolute right-4 top-1/2 -translate-y-1/2 h-28 rounded-xl object-cover shadow-2xl" style={{ opacity: 0.9 }} />}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {item.year && <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: "#FAF5FF", color: "#7C3AED", border: "1px solid #DDD6FE" }}>📅 {item.year}</span>}
        </div>
        {item.subjects?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.subjects.slice(0, 8).map(s => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "#F5F3FF", color: "#6D28D9", border: "1px solid #EDE9FE" }}>{s}</span>
            ))}
          </div>
        )}
        {item.description && <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{item.description}</p>}
        {item.ol_url && (
          <a href={item.ol_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7C3AED, #DB2777)", boxShadow: "0 4px 20px #7C3AED40" }}>
            <BookOpen className="w-4 h-4" /> Read / Buy on Open Library
          </a>
        )}
      </div>
    </div>
  );
}

function MovieDetail({ item }) {
  const isTV = item.media_type === "tv";
  const PLATFORMS = [
    { name: "Netflix", color: "#E50914", url: (t) => `https://www.netflix.com/search?q=${encodeURIComponent(t)}` },
    { name: "Disney+", color: "#006E99", url: (t) => `https://www.disneyplus.com/search/${encodeURIComponent(t)}` },
    { name: "Prime", color: "#00A8E1", url: (t) => `https://www.amazon.com/s?k=${encodeURIComponent(t)}&i=instant-video` },
  ];
  const accent = isTV ? "#4F46E5" : "#E50914";
  const gradient = isTV ? "linear-gradient(135deg, #4F46E5, #7C3AED)" : "linear-gradient(135deg, #E50914, #FF6B35)";

  return (
    <div>
      <div className="relative h-52 rounded-3xl overflow-hidden mb-4" style={{ background: gradient }}>
        {item.poster_url && <img src={item.poster_url} alt={item.title} className="absolute inset-0 h-full w-full object-cover opacity-40" style={{ objectPosition: "top center" }} />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }} />
        <div className="absolute bottom-4 left-4 right-16">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: isTV ? "#A5B4FC" : "#FCA5A5" }}>{isTV ? "📺 TV Show" : "🎬 Movie"}</span>
          <p className="text-white text-xl font-bold leading-tight">{item.title}</p>
          <div className="flex items-center gap-2 mt-1">
            {item.release_year && <span className="text-white/60 text-xs">{item.release_year}</span>}
            {item.vote_average && <span className="flex items-center gap-1 text-xs font-bold text-yellow-300"><Star className="w-3 h-3 fill-current" />{item.vote_average}</span>}
          </div>
        </div>
        {item.poster_url && <img src={item.poster_url} alt="" className="absolute right-4 top-1/2 -translate-y-1/2 h-32 rounded-2xl object-cover shadow-2xl" />}
      </div>

      {item.overview && <p className="text-sm leading-relaxed mb-4" style={{ color: "#475569" }}>{item.overview}</p>}

      {item.tmdb_url && (
        <a href={item.tmdb_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white mb-3"
          style={{ background: "linear-gradient(135deg, #01B4E4, #0080C8)", boxShadow: "0 4px 20px #01B4E440" }}>
          <Film className="w-4 h-4" /> View on TMDb
        </a>
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>Search on streaming</p>
        <div className="flex gap-2">
          {PLATFORMS.map(p => (
            <a key={p.name} href={p.url(item.title)} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 rounded-2xl text-xs font-bold text-white"
              style={{ backgroundColor: p.color }}>
              {p.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StaticMediaDetail({ item }) {
  const configs = {
    movie: { gradient: "linear-gradient(135deg, #E50914, #FF6B35)", emoji: "🎬", label: "Movie" },
    show: { gradient: "linear-gradient(135deg, #4F46E5, #7C3AED)", emoji: "📺", label: "Show" },
    book: { gradient: "linear-gradient(135deg, #7C3AED, #DB2777)", emoji: "📚", label: "Book" },
    game: { gradient: "linear-gradient(135deg, #10B981, #3B82F6)", emoji: "🎮", label: "Game" },
    music: { gradient: "linear-gradient(135deg, #1DB954, #121212)", emoji: "🎵", label: "Music" },
  };
  const cfg = configs[item.media_type] || { gradient: "linear-gradient(135deg, #667EEA, #764BA2)", emoji: "🎭", label: "Media" };

  return (
    <div>
      <div className="relative h-32 rounded-3xl overflow-hidden mb-4" style={{ background: cfg.gradient }}>
        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">{cfg.emoji}</div>
        <div className="absolute inset-0 flex items-end p-4">
          <div>
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{cfg.emoji} {cfg.label}</span>
            <p className="text-white text-lg font-bold">{item.title}</p>
            {item.creator && <p className="text-white/70 text-sm">👤 {item.creator}</p>}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {item.genre?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.genre.map(g => <span key={g} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>{g}</span>)}
          </div>
        )}
        {item.description && <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{item.description}</p>}
        <a href={`https://www.google.com/search?q=${encodeURIComponent(item.title)}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white"
          style={{ background: cfg.gradient }}>
          <ExternalLink className="w-4 h-4" /> Search "{item.title}"
        </a>
      </div>
    </div>
  );
}

export default function MediaDetailSheet({ item, onClose }) {
  if (!item) return null;

  const renderContent = () => {
    if (item.tmdb_url || item.poster_url) return <MovieDetail item={item} />;
    if (item.spotify_url || item.preview_url || item.media_type === "music" || item.artist) return <MusicDetail item={item} />;
    if (item.ol_url) return <BookDetail item={item} />;
    return <StaticMediaDetail item={item} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="w-full max-w-lg mx-auto rounded-t-[2rem] overflow-hidden"
        style={{ backgroundColor: "#FAFAF8", maxHeight: "88vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 pt-3 pb-2 flex flex-col items-center" style={{ backgroundColor: "#FAFAF8" }}>
          <div className="w-10 h-1 rounded-full mb-2" style={{ backgroundColor: "#CBD5E1" }} />
          <button onClick={onClose} className="absolute right-4 top-3 p-2 rounded-full"
            style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pb-8">
          {renderContent()}
          <p className="text-[10px] text-center mt-6 leading-relaxed" style={{ color: "#CBD5E1" }}>
            Not affiliated with any studio, label, publisher, or developer.
          </p>
        </div>
      </motion.div>
    </div>
  );
}