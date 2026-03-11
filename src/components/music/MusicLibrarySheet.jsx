import React, { useState, useRef, useEffect } from "react";
import { X, Search, Play, Pause, Check, Upload, Music2, Flag, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ArtistUploadModal from "./ArtistUploadModal";

const CATEGORIES = [
  { id: "all",            label: "All" },
  { id: "trending",       label: "🔥 Trending" },
  { id: "royalty_free",   label: "Free Use" },
  { id: "pop",            label: "Pop" },
  { id: "hip_hop",        label: "Hip Hop" },
  { id: "electronic",     label: "Electronic" },
  { id: "ambient",        label: "Ambient" },
  { id: "user_generated", label: "User Sounds" },
];

function fmtDur(s) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicLibrarySheet({ open, onClose, onSelectTrack, selectedTrack }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [playingId, setPlayingId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const audioRef = useRef(null);

  const { data: tracks = [], refetch } = useQuery({
    queryKey: ["musicTracks", category],
    queryFn: async () => {
      const filters = { is_approved: true, is_disabled: false };
      if (category !== "all" && category !== "trending") filters.category = category;
      const result = await base44.entities.MusicTrack.filter(filters, "-use_count", 60);
      return category === "trending" ? result.filter((t) => t.is_trending) : result;
    },
    enabled: open,
  });

  const filtered = tracks.filter(
    (t) =>
      !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.artist_name?.toLowerCase().includes(search.toLowerCase())
  );

  const togglePlay = (track) => {
    if (!audioRef.current) return;
    if (playingId === track.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = track.audio_url;
      audioRef.current.play().catch(() => {});
      setPlayingId(track.id);
    }
  };

  const handleReport = async (track) => {
    const user = await base44.auth.me().catch(() => null);
    if (!user) return;
    if (track.reported_by?.includes(user.email)) {
      alert("You've already reported this track.");
      return;
    }
    await base44.entities.MusicTrack.update(track.id, {
      report_count: (track.report_count || 0) + 1,
      reported_by: [...(track.reported_by || []), user.email],
    });
    alert("Track reported. Our team will review it shortly.");
  };

  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);
  useEffect(() => {
    if (!open && audioRef.current) { audioRef.current.pause(); setPlayingId(null); }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: "#0d0d0d" }}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4"
        style={{ paddingTop: "max(env(safe-area-inset-top,0px),16px)", paddingBottom: 14, borderBottom: "1px solid #1e1e1e" }}>
        <button onClick={() => { audioRef.current?.pause(); onClose(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#1e1e1e" }}>
          <X className="w-4 h-4 text-white" />
        </button>
        <h2 className="flex-1 text-base font-bold text-white">Add Sound</h2>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: "#2E6B4F" }}>
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "#1a1a1a" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sounds…"
            className="flex-1 bg-transparent outline-none text-sm text-white"
            style={{ caretColor: "#4CAF7D" }}
          />
          {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} /></button>}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex-shrink-0 px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              backgroundColor: category === cat.id ? "#2E6B4F" : "#1a1a1a",
              color: category === cat.id ? "#fff" : "rgba(255,255,255,0.5)",
            }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Selected track mini bar */}
      {selectedTrack && (
        <div className="flex-shrink-0 mx-4 mb-3 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
          style={{ backgroundColor: "rgba(46,107,79,0.25)", border: "1px solid rgba(46,107,79,0.5)" }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#4CAF7D" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{selectedTrack.title}</p>
            <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{selectedTrack.artist_name}</p>
          </div>
          <button onClick={() => onSelectTrack(null)} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
            Remove
          </button>
        </div>
      )}

      {/* Track list */}
      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-1.5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1e1e1e" }}>
              <Music2 className="w-7 h-7" style={{ color: "rgba(255,255,255,0.15)" }} />
            </div>
            <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
              {search ? `No results for "${search}"` : "No sounds in this category yet"}
            </p>
            <button onClick={() => setShowUpload(true)}
              className="px-5 py-2 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: "#2E6B4F" }}>
              Be the first to upload
            </button>
          </div>
        )}

        {filtered.map((track) => {
          const isPlaying = playingId === track.id;
          const isSelected = selectedTrack?.id === track.id;
          return (
            <div key={track.id}
              className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-all"
              style={{
                backgroundColor: isSelected ? "rgba(46,107,79,0.18)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isSelected ? "rgba(46,107,79,0.45)" : "transparent"}`,
              }}>
              {/* Cover */}
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: "#222" }}>
                {track.cover_url
                  ? <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                  : <Music2 className="w-5 h-5" style={{ color: "rgba(255,255,255,0.2)" }} />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {track.artist_name}
                  {track.duration_seconds ? ` · ${fmtDur(track.duration_seconds)}` : ""}
                  {track.bpm ? ` · ${track.bpm} BPM` : ""}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {track.is_trending && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(249,115,22,0.2)", color: "#f97316" }}>
                      🔥 Trending
                    </span>
                  )}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.28)" }}>
                    {track.license_type?.replace("_", " ")}
                  </span>
                  {track.use_count > 0 && (
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                      {track.use_count} uses
                    </span>
                  )}
                </div>
              </div>

              {/* Play */}
              <button onClick={() => togglePlay(track)}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: isPlaying ? "rgba(255,255,255,0.15)" : "#1e1e1e", border: "1px solid #2e2e2e" }}>
                {isPlaying
                  ? <Pause className="w-4 h-4 text-white" />
                  : <Play className="w-4 h-4 text-white" />}
              </button>

              {/* Select */}
              <button
                onClick={() => {
                  onSelectTrack(isSelected ? null : track);
                  audioRef.current?.pause();
                  setPlayingId(null);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ backgroundColor: isSelected ? "#2E6B4F" : "#1e1e1e", border: isSelected ? "none" : "1px solid #2e2e2e" }}>
                <Check className="w-4 h-4" style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.25)" }} />
              </button>

              {/* Report */}
              <button onClick={() => handleReport(track)}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                title="Report copyright issue">
                <Flag className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />
              </button>
            </div>
          );
        })}
      </div>

      {showUpload && (
        <ArtistUploadModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); refetch(); }}
        />
      )}
    </div>
  );
}