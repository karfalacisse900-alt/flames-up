import React, { useState } from "react";
import { Music, Disc3, Mic2, Play, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { AudioPreviewPlayer } from "./AudioPreviewPlayer";
import { useAudio } from "@/components/AudioContext";

export default function SearchResultCard({ item, onShare }) {
  const [coverClicked, setCoverClicked] = useState(false);
  const { setCurrentTrack } = useAudio();

  const handleCoverClick = (e) => {
    e.stopPropagation();
    if (item.media_type !== "music" || !item.preview_url) return;
    setCoverClicked(v => !v);
  };

  const isTrack = item.media_type === "music";
  const isAlbum = item.media_type === "album";
  const isArtist = item.media_type === "artist";

  const icon = isTrack ? <Music className="w-5 h-5" /> : isAlbum ? <Disc3 className="w-5 h-5" /> : <Mic2 className="w-5 h-5" />;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>

      {/* Cover/Image */}
      <div className="shrink-0 relative" onClick={handleCoverClick}>
        {item.cover_url ? (
          <img src={item.cover_url} alt={item.title}
            className="w-16 rounded-xl object-cover" style={{ height: 72 }} />
        ) : (
          <div className="w-16 rounded-xl flex items-center justify-center"
            style={{ height: 72, backgroundColor: "var(--bg-subtle)" }}>
            {icon}
          </div>
        )}
        {isTrack && item.preview_url && !coverClicked && (
          <div className="absolute inset-0 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.35)", cursor: "pointer" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1DB954" }}>
              <Play className="w-3.5 h-3.5 text-black" fill="black" style={{ marginLeft: 1 }} />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className="text-sm font-semibold leading-snug flex-1 truncate" style={{ color: "var(--text-primary)" }}>
            {item.title}
          </p>
          <span className="text-[9px] px-1.5 py-0.5 rounded-md whitespace-nowrap font-medium"
            style={{
              backgroundColor: isTrack ? "#E8F2EC" : isAlbum ? "#FEE8E0" : "#F0E8F2",
              color: isTrack ? "#2E6B4F" : isAlbum ? "#D98B62" : "#6B4F8B"
            }}>
            {isTrack ? "Track" : isAlbum ? "Album" : "Artist"}
          </span>
        </div>

        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
          {isArtist ? (
            <span>🎤 {item.genres?.join(", ") || "Artist"}</span>
          ) : (
            <span>🎤 {item.artist}</span>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {!isArtist && item.album && (
            <span className="text-[10px] truncate max-w-[120px]" style={{ color: "var(--text-hint)" }}>
              💿 {item.album}
            </span>
          )}
          {isArtist && item.followers && (
            <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>
              👥 {(item.followers / 1000).toFixed(0)}K followers
            </span>
          )}
          {item.release_year && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {item.release_year}
            </span>
          )}
          {isAlbum && item.total_tracks && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {item.total_tracks} tracks
            </span>
          )}
        </div>

        {/* Audio preview for tracks */}
        {isTrack && item.preview_url && (
          <AudioPreviewPlayer
            previewUrl={item.preview_url}
            trackTitle={item.title}
            autoPlay={coverClicked}
            track={{ title: item.title, artist: item.artist }}
            onPlayingTrack={track => setCurrentTrack(track)}
          />
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {item.spotify_url ? (
            <a href={item.spotify_url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
              style={{ backgroundColor: "#1DB954", color: "#fff" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              View on Spotify
            </a>
          ) : (
            <span className="text-[10px] italic" style={{ color: "var(--text-hint)" }}>Searching…</span>
          )}
          {/* Share button */}
          <button
            onClick={e => { e.stopPropagation(); onShare && onShare(item); }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-medium transition-all active:scale-95"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
            <Share2 className="w-3 h-3" /> Share
          </button>
        </div>
      </div>
    </motion.div>
  );
}