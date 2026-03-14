import React, { useState, useEffect, useRef } from "react";
import { X, Users, Play, Volume2, VolumeX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function TrendingGroupCard({ group, onDismiss, onJoin, onOpen }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const { data: posts = [] } = useQuery({
    queryKey: ["groupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id }, "-created_date", 12),
    staleTime: 120000,
  });

  const previewPosts = posts.filter(p => p.video_url || p.media_urls?.length > 0 || p.image_url).slice(0, 8);
  const currentPost = previewPosts[currentIndex];

  useEffect(() => {
    if (previewPosts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % previewPosts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [previewPosts.length]);

  useEffect(() => {
    if (videoRef.current && currentPost?.video_url) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, currentPost]);

  const isVideo = !!currentPost?.video_url;
  const mediaUrl = isVideo ? currentPost?.video_url : (currentPost?.media_urls?.[0] || currentPost?.image_url);

  return (
    <div
      className="relative rounded-[32px] overflow-hidden cursor-pointer"
      style={{
        width: "100%",
        aspectRatio: "4/5",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 20px 48px rgba(15,23,42,0.12)",
      }}>

      {/* Background media */}
      <div className="absolute inset-0">
        {mediaUrl ? (
          isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted={isMuted}
              playsInline
              loop
              autoPlay
            />
          ) : (
            <img src={mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: "linear-gradient(135deg, var(--accent-primary-light), var(--bg-subtle))" }}>
            {group.emoji || "💬"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75" />
      </div>

      {/* Top controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {isVideo && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsMuted(v => !v); }}
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.3)" }}>
            {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl"
          style={{ backgroundColor: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.3)" }}>
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Pagination dots */}
      {previewPosts.length > 1 && (
        <div className="absolute top-5 left-4 right-20 z-20 flex gap-1">
          {previewPosts.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-0.5 rounded-full transition-all"
              style={{
                backgroundColor: idx === currentIndex ? "white" : "rgba(255,255,255,0.3)",
                boxShadow: idx === currentIndex ? "0 0 8px rgba(255,255,255,0.5)" : "none",
              }}
            />
          ))}
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5" onClick={() => onOpen(group)}>
        {/* Group info */}
        <div className="mb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg shrink-0 backdrop-blur-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)" }}>
              {group.logo_url ? (
                <img src={group.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{group.emoji || "💬"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[17px] leading-tight mb-0.5 text-white drop-shadow-lg" style={{ fontFamily: "var(--font-serif)" }}>
                {group.name}
              </h3>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {(group.member_count || 0).toLocaleString()} members
              </p>
            </div>
          </div>
          {group.description && (
            <p className="text-xs text-white/90 leading-relaxed line-clamp-2 drop-shadow-md">
              {group.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="flex-1 py-3 rounded-full text-sm font-semibold backdrop-blur-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
            Pass
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onJoin(group); }}
            className="flex-1 py-3 rounded-full text-sm font-bold backdrop-blur-xl"
            style={{ backgroundColor: "white", color: "var(--accent-primary)" }}>
            Join Group
          </button>
        </div>
      </div>
    </div>
  );
}