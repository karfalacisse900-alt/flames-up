import React, { useState } from "react";
import { X, Instagram, Youtube, Globe, Navigation, ChevronLeft, ChevronRight, MessageCircle, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORY_LABELS = {
  painter: "🎨 Painter", dancer: "💃 Dancer", musician: "🎵 Musician",
  videographer: "🎬 Videographer", photographer: "📸 Photographer",
  street_performer: "🎭 Street Performer", comedian: "😂 Comedian",
  magician: "🪄 Magician", tattoo_artist: "✒️ Tattoo Artist",
  caricaturist: "✏️ Caricaturist", other: "🌟 Other"
};

export default function CreatorProfilePopup({ creator, coords, mapContainer, onClose, currentUserEmail }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const navigate = useNavigate();
  const isSelf = currentUserEmail && creator.user_email === currentUserEmail;

  const POPUP_W = 300;
  const images = creator.portfolio_images || [];

  const containerRect = mapContainer?.getBoundingClientRect() || { left: 0, top: 0 };
  const absX = containerRect.left + coords.x;
  const absY = containerRect.top + coords.y;
  const left = Math.min(Math.max(absX - POPUP_W / 2, 8), window.innerWidth - POPUP_W - 8);
  const top = Math.max(absY - 460, 70);

  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + images.length) % images.length); };
  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % images.length); };

  return (
    <>
      {/* Fullscreen viewer */}
      {fullscreen && images.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
          onClick={() => setFullscreen(false)}>
          <button onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
            <X className="w-5 h-5 text-white" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={prevPhoto} className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={nextPhoto} className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}
          <img src={images[photoIdx]} alt="" className="rounded-2xl object-contain"
            style={{ maxWidth: "90vw", maxHeight: "85vh" }} onClick={e => e.stopPropagation()} />
          {images.length > 1 && (
            <div className="absolute bottom-6 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setPhotoIdx(i); }}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ backgroundColor: i === photoIdx ? "white" : "rgba(255,255,255,0.35)" }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="fixed z-[9990] rounded-3xl overflow-hidden"
        style={{
          left, top,
          width: POPUP_W,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)",
          border: "1px solid rgba(0,0,0,0.06)",
          pointerEvents: "auto",
        }}>

        {/* Portfolio / Cover image */}
        <div className="relative overflow-hidden"
          style={{ height: images.length > 0 ? 160 : 80, background: "linear-gradient(135deg,#1C2B1A,#2D6A4F)", cursor: images.length > 0 ? "pointer" : "default" }}
          onClick={() => images.length > 0 && setFullscreen(true)}>
          {images.length > 0 ? (
            <>
              <img src={images[photoIdx]} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
              {images.length > 1 && (
                <>
                  <button onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <div key={i} className="rounded-full transition-all"
                        style={{ width: i === photoIdx ? 14 : 5, height: 5, backgroundColor: i === photoIdx ? "white" : "rgba(255,255,255,0.5)" }} />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                {photoIdx + 1}/{images.length}
              </div>
            </>
          ) : creator.profile_image ? (
            <img src={creator.profile_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {CATEGORY_LABELS[creator.category]?.split(" ")[0] || "🌟"}
            </div>
          )}

          {/* Close button */}
          <button onClick={onClose}
            className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <X className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Live badge */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: "#16A34A" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </div>
        </div>

        {/* Profile info row */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-3">
          {creator.profile_image && (
            <img src={creator.profile_image} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-white"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm leading-tight truncate" style={{ color: "#0F172A", fontFamily: "var(--font-serif)" }}>
              {creator.full_name}
            </h3>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#2D6A4F" }}>
              {CATEGORY_LABELS[creator.category]}
            </p>
          </div>
          {creator.price && (
            <span className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0 flex items-center gap-0.5"
              style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
              <DollarSign className="w-3 h-3" />{creator.price}
            </span>
          )}
        </div>

        {/* Status message */}
        {creator.status_message && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-2xl text-xs flex items-start gap-1.5"
            style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
            <span className="text-sm leading-none">💬</span>
            <span className="leading-snug">{creator.status_message}</span>
          </div>
        )}

        {/* Description */}
        {creator.description && (
          <p className="px-4 pb-2 text-xs leading-relaxed line-clamp-2" style={{ color: "#475569" }}>
            {creator.description}
          </p>
        )}

        {/* Social links */}
        {(creator.instagram_url || creator.tiktok_url || creator.youtube_url || creator.website_url) && (
          <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
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

        {/* Action buttons */}
        <div className="px-4 pb-4">
          {isSelf ? (
            <div className="py-2.5 text-center text-xs font-semibold rounded-2xl"
              style={{ backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}>
              👤 Your creator profile
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => window.open(`https://www.google.com/maps?q=${creator.latitude},${creator.longitude}`, "_blank")}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-1.5"
                style={{ backgroundColor: "#1C2B1A" }}>
                <Navigation className="w-3.5 h-3.5" /> Directions
              </button>
              {creator.user_email && (
                <button onClick={() => { onClose(); navigate(createPageUrl(`Messages?with=${creator.user_email}`)); }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#EEF2FF" }}>
                  <MessageCircle className="w-4.5 h-4.5" style={{ color: "#4F46E5", width: 18, height: 18 }} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}