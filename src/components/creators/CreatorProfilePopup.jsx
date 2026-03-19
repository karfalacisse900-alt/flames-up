import React from "react";
import { X, MapPin, Instagram, Youtube, Globe, Navigation } from "lucide-react";

const CATEGORY_LABELS = {
  painter: "🎨 Painter", dancer: "💃 Dancer", musician: "🎵 Musician",
  videographer: "🎬 Videographer", photographer: "📸 Photographer",
  street_performer: "🎭 Street Performer", comedian: "😂 Comedian",
  magician: "🪄 Magician", tattoo_artist: "✒️ Tattoo Artist",
  caricaturist: "✏️ Caricaturist", other: "🌟 Other"
};

export default function CreatorProfilePopup({ creator, coords, mapContainer, onClose }) {
  const containerWidth = mapContainer?.clientWidth || 400;
  const containerHeight = mapContainer?.clientHeight || 600;
  const POPUP_W = 280;
  const POPUP_H = 360;

  const left = Math.min(Math.max(coords.x - POPUP_W / 2, 8), containerWidth - POPUP_W - 8);
  const top = Math.max(coords.y - POPUP_H - 16, 70);

  const openDirections = () => {
    window.open(`https://www.google.com/maps?q=${creator.latitude},${creator.longitude}`, "_blank");
  };

  return (
    <div
      className="absolute z-40 rounded-3xl overflow-hidden"
      style={{
        left,
        top,
        width: POPUP_W,
        backgroundColor: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        border: "1px solid rgba(0,0,0,0.08)",
        pointerEvents: "auto",
      }}
    >
      {/* Header image / avatar */}
      <div className="relative h-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #E05C2A22, #F9731633)" }}>
        {creator.profile_image ? (
          <img src={creator.profile_image} alt={creator.full_name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {CATEGORY_LABELS[creator.category]?.split(" ")[0] || "🌟"}
          </div>
        )}
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <X className="w-3.5 h-3.5 text-white" />
        </button>
        {/* Live badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: "#16A34A", color: "white" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-bold text-base leading-tight" style={{ color: "#0F172A", fontFamily: "var(--font-serif)" }}>
          {creator.full_name}
        </h3>
        <p className="text-xs font-semibold mb-2" style={{ color: "#E05C2A" }}>
          {CATEGORY_LABELS[creator.category]}
        </p>

        {creator.description && (
          <p className="text-xs leading-relaxed mb-2 line-clamp-2" style={{ color: "#64748B" }}>
            {creator.description}
          </p>
        )}

        {creator.price && (
          <span className="inline-block text-xs font-bold px-2 py-1 rounded-full mb-2"
            style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
            💰 {creator.price}
          </span>
        )}

        {/* Social Links */}
        {(creator.instagram_url || creator.tiktok_url || creator.youtube_url || creator.website_url) && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {creator.instagram_url && (
              <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{ backgroundColor: "#FDF2F8", color: "#DB2777" }}>
                <Instagram className="w-3 h-3" /> IG
              </a>
            )}
            {creator.tiktok_url && (
              <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{ backgroundColor: "#F0FFFE", color: "#0D9488" }}>
                🎵 TT
              </a>
            )}
            {creator.youtube_url && (
              <a href={creator.youtube_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                <Youtube className="w-3 h-3" /> YT
              </a>
            )}
            {creator.website_url && (
              <a href={creator.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
                <Globe className="w-3 h-3" /> Web
              </a>
            )}
          </div>
        )}

        {/* Directions button */}
        <button
          onClick={openDirections}
          className="w-full py-2.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)", boxShadow: "0 4px 12px rgba(224,92,42,0.35)" }}>
          <Navigation className="w-4 h-4" />
          Get Directions
        </button>
      </div>
    </div>
  );
}