import React, { useState } from "react";
import { X, Instagram, Youtube, Globe, Navigation, ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORY_LABELS = {
  painter: "🎨 Painter", dancer: "💃 Dancer", musician: "🎵 Musician",
  videographer: "🎬 Videographer", photographer: "📸 Photographer",
  street_performer: "🎭 Street Performer", comedian: "😂 Comedian",
  magician: "🪄 Magician", tattoo_artist: "✒️ Tattoo Artist",
  caricaturist: "✏️ Caricaturist", other: "🌟 Other"
};

export default function CreatorProfilePopup({ creator, coords, mapContainer, onClose }) {
  const [photoIdx, setPhotoIdx] = useState(0);

  const containerWidth = mapContainer?.clientWidth || 400;
  const POPUP_W = 290;

  const left = Math.min(Math.max(coords.x - POPUP_W / 2, 8), containerWidth - POPUP_W - 8);
  const top = Math.max(coords.y - 420, 70);

  const openDirections = () => {
    window.open(`https://www.google.com/maps?q=${creator.latitude},${creator.longitude}`, "_blank");
  };

  const photos = creator.portfolio_images?.length > 0
    ? creator.portfolio_images
    : creator.profile_image ? [creator.profile_image] : [];

  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); };
  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % photos.length); };

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
      {/* Status message talk bubble */}
      {creator.status_message && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-2xl relative"
          style={{ backgroundColor: "#FFF7ED", border: "1.5px solid #F97316" }}>
          <p className="text-xs font-semibold" style={{ color: "#C2410C" }}>💬 {creator.status_message}</p>
          {/* Tail */}
          <div style={{
            position: "absolute", bottom: -8, left: 16,
            width: 0, height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "8px solid #F97316",
          }} />
        </div>
      )}

      {/* Photo gallery */}
      <div className="relative mt-3 mx-3 rounded-2xl overflow-hidden"
        style={{ height: 140, background: "linear-gradient(135deg, #E05C2A22, #F9731633)" }}>
        {photos.length > 0 ? (
          <img
            src={photos[photoIdx]}
            alt=""
            className="w-full h-full object-cover"
            style={{ transition: "opacity 0.2s" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {CATEGORY_LABELS[creator.category]?.split(" ")[0] || "🌟"}
          </div>
        )}

        {/* Photo nav arrows */}
        {photos.length > 1 && (
          <>
            <button onClick={prevPhoto}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button onClick={nextPhoto}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {photos.map((_, i) => (
                <div key={i} className="rounded-full transition-all"
                  style={{ width: i === photoIdx ? 16 : 6, height: 6, backgroundColor: i === photoIdx ? "#fff" : "rgba(255,255,255,0.5)" }} />
              ))}
            </div>
          </>
        )}

        {/* Close + Live badge */}
        <button onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <X className="w-3.5 h-3.5 text-white" />
        </button>
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: "#16A34A", color: "white" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>

        {/* Photo count badge */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-lg text-[10px] font-bold"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}>
            {photoIdx + 1}/{photos.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-3 pt-3 pb-3">
        <h3 className="font-bold text-base leading-tight" style={{ color: "#0F172A", fontFamily: "var(--font-serif)" }}>
          {creator.full_name}
        </h3>
        <p className="text-xs font-semibold mb-1.5" style={{ color: "#E05C2A" }}>
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
          <div className="flex gap-1.5 mb-2.5 flex-wrap">
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
        <button onClick={openDirections}
          className="w-full py-2.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)", boxShadow: "0 4px 12px rgba(224,92,42,0.35)" }}>
          <Navigation className="w-4 h-4" />
          Get Directions
        </button>
      </div>
    </div>
  );
}