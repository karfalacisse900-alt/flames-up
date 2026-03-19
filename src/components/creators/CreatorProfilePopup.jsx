import React, { useState } from "react";
import { X, Instagram, Youtube, Globe, Navigation, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORY_LABELS = {
  painter: "🎨 Painter", dancer: "💃 Dancer", musician: "🎵 Musician",
  videographer: "🎬 Videographer", photographer: "📸 Photographer",
  street_performer: "🎭 Street Performer", comedian: "😂 Comedian",
  magician: "🪄 Magician", tattoo_artist: "✒️ Tattoo Artist",
  caricaturist: "✏️ Caricaturist", other: "🌟 Other"
};

export default function CreatorProfilePopup({ creator, coords, mapContainer, onClose }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const navigate = useNavigate();

  const containerWidth = mapContainer?.clientWidth || 400;
  const containerHeight = mapContainer?.clientHeight || 600;
  const POPUP_W = 290;
  const images = creator.portfolio_images || [];

  const left = Math.min(Math.max(coords.x - POPUP_W / 2, 8), containerWidth - POPUP_W - 8);
  const top = Math.max(coords.y - 420, 70);

  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + images.length) % images.length); };
  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % images.length); };

  const openDirections = () => {
    window.open(`https://www.google.com/maps?q=${creator.latitude},${creator.longitude}`, "_blank");
  };

  return (
    <>
      {/* Fullscreen portfolio viewer */}
      {fullscreen && images.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
          onClick={() => setFullscreen(false)}>
          <button onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <X className="w-5 h-5 text-white" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={prevPhoto}
                className="absolute left-3 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={nextPhoto}
                className="absolute right-3 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}
          <img src={images[photoIdx]} alt=""
            className="rounded-2xl object-contain"
            style={{ maxWidth: "90vw", maxHeight: "85vh" }}
            onClick={e => e.stopPropagation()} />
          {images.length > 1 && (
            <div className="absolute bottom-5 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setPhotoIdx(i); }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: i === photoIdx ? "white" : "rgba(255,255,255,0.35)" }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className="absolute z-40 rounded-3xl overflow-hidden"
        style={{
          left, top,
          width: POPUP_W,
          backgroundColor: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          border: "1px solid rgba(0,0,0,0.08)",
          pointerEvents: "auto",
        }}>

        {/* Status message bubble — above the popup */}
        {creator.status_message && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-2xl text-xs font-medium flex items-start gap-1.5"
            style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA", color: "#C2410C" }}>
            <span className="text-base leading-none">💬</span>
            <span className="leading-snug">{creator.status_message}</span>
          </div>
        )}

        {/* Header: portfolio swiper or profile image */}
        <div className="relative overflow-hidden mt-2 mx-3 rounded-2xl"
          style={{ height: images.length > 0 ? 140 : 100, background: "linear-gradient(135deg,#E05C2A22,#F9731633)", cursor: images.length > 0 ? "pointer" : "default" }}
          onClick={() => images.length > 0 && setFullscreen(true)}>
          {images.length > 0 ? (
            <>
              <img src={images[photoIdx]} alt="" className="w-full h-full object-cover" />
              {images.length > 1 && (
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
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: i === photoIdx ? "white" : "rgba(255,255,255,0.45)" }} />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "white" }}>
                {photoIdx + 1}/{images.length} 📸
              </div>
            </>
          ) : creator.profile_image ? (
            <img src={creator.profile_image} alt={creator.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {CATEGORY_LABELS[creator.category]?.split(" ")[0] || "🌟"}
            </div>
          )}

          {/* Close */}
          <button onClick={onClose}
            className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <X className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Live badge */}
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: "#16A34A", color: "white" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        </div>

        {/* Content */}
        <div className="px-3 pb-3 pt-2">
          <div className="flex items-start gap-2 mb-1">
            {creator.profile_image && images.length > 0 && (
              <img src={creator.profile_image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border-2"
                style={{ borderColor: "#E05C2A" }} />
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-tight truncate" style={{ color: "#0F172A", fontFamily: "var(--font-serif)" }}>
                {creator.full_name}
              </h3>
              <p className="text-[11px] font-semibold" style={{ color: "#E05C2A" }}>
                {CATEGORY_LABELS[creator.category]}
              </p>
            </div>
          </div>

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

          {/* Directions */}
          <button onClick={openDirections}
            className="w-full py-2.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#E05C2A,#F97316)", boxShadow: "0 4px 12px rgba(224,92,42,0.35)" }}>
            <Navigation className="w-4 h-4" />
            Get Directions
          </button>
        </div>
      </div>
    </>
  );
}