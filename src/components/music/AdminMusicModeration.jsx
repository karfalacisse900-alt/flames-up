import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Flag, Music2, Loader2 } from "lucide-react";

export default function AdminMusicModeration() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending"); // pending | reported | all

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["adminMusicTracks", filter],
    queryFn: async () => {
      if (filter === "pending") return base44.entities.MusicTrack.filter({ is_approved: false, is_disabled: false }, "-created_date", 50);
      if (filter === "reported") return base44.entities.MusicTrack.filter({ is_disabled: false }, "-report_count", 50).then((t) => t.filter((x) => (x.report_count || 0) > 0));
      return base44.entities.MusicTrack.list("-created_date", 80);
    },
  });

  const approve = async (track) => {
    await base44.entities.MusicTrack.update(track.id, { is_approved: true, is_disabled: false });
    qc.invalidateQueries({ queryKey: ["adminMusicTracks"] });
    qc.invalidateQueries({ queryKey: ["musicTracks"] });
  };

  const disable = async (track) => {
    await base44.entities.MusicTrack.update(track.id, { is_disabled: true, is_approved: false });
    qc.invalidateQueries({ queryKey: ["adminMusicTracks"] });
    qc.invalidateQueries({ queryKey: ["musicTracks"] });
  };

  const setTrending = async (track) => {
    await base44.entities.MusicTrack.update(track.id, { is_trending: !track.is_trending });
    qc.invalidateQueries({ queryKey: ["adminMusicTracks"] });
  };

  const TABS = [
    { id: "pending", label: "Pending Review" },
    { id: "reported", label: "Reported" },
    { id: "all", label: "All Tracks" },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        Music Moderation
      </h2>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className="flex-1 py-2 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: filter === t.id ? "var(--accent-primary)" : "var(--bg-card)",
              color: filter === t.id ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${filter === t.id ? "var(--accent-primary)" : "var(--border-light)"}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} /></div>
      ) : tracks.length === 0 ? (
        <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>Nothing here</p>
      ) : (
        <div className="space-y-3">
          {tracks.map((track) => (
            <div key={track.id} className="rounded-2xl p-4 space-y-3"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-start gap-3">
                {/* Cover */}
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: "var(--bg-subtle)" }}>
                  {track.cover_url
                    ? <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                    : <Music2 className="w-5 h-5" style={{ color: "var(--text-hint)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{track.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{track.artist_name} · {track.category}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${track.is_disabled ? "text-red-600 bg-red-50" : track.is_approved ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
                      {track.is_disabled ? "Disabled" : track.is_approved ? "✓ Live" : "Pending"}
                    </span>
                    {(track.report_count || 0) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 text-red-500 bg-red-50">
                        <Flag className="w-2.5 h-2.5" /> {track.report_count} reports
                      </span>
                    )}
                    {track.is_trending && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "rgba(249,115,22,0.1)", color: "#f97316" }}>🔥 Trending</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Audio player */}
              {track.audio_url && (
                <audio controls src={track.audio_url} className="w-full h-8" style={{ accentColor: "var(--accent-primary)" }} />
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {!track.is_approved && !track.is_disabled && (
                  <button onClick={() => approve(track)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                    style={{ backgroundColor: "var(--accent-primary)" }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                {!track.is_disabled && (
                  <button onClick={() => disable(track)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                    <XCircle className="w-3.5 h-3.5" /> Disable
                  </button>
                )}
                {track.is_disabled && (
                  <button onClick={() => approve(track)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    style={{ backgroundColor: "rgba(46,107,79,0.1)", color: "var(--accent-primary)" }}>
                    Restore
                  </button>
                )}
                <button onClick={() => setTrending(track)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold"
                  style={{
                    backgroundColor: track.is_trending ? "rgba(249,115,22,0.1)" : "var(--bg-subtle)",
                    color: track.is_trending ? "#f97316" : "var(--text-secondary)",
                  }}>
                  {track.is_trending ? "🔥 Remove Trend" : "Set Trending"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}