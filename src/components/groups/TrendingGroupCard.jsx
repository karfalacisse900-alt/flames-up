import React, { useState, useEffect, useRef } from "react";
import { X, Users, Volume2, VolumeX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function TrendingGroupCard({ group, onDismiss, onJoin, onOpen }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Only play when card is at least 60% visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.intersectionRatio >= 0.6),
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ["groupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id }, "-created_date", 12),
    staleTime: 120000,
  });

  const previewPosts = posts.filter(p => p.video_url || p.media_urls?.length > 0 || p.image_url).slice(0, 8);
  const currentPost = previewPosts[currentIndex];

  // If group has a preview video, use it directly — skip post carousel
  const hasGroupPreview = !!group.preview_video_url;

  // Auto-advance slides (only when no group preview video)
  useEffect(() => {
    if (hasGroupPreview || previewPosts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % previewPosts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [previewPosts.length, hasGroupPreview]);

  // Play/pause video based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const videoUrl = hasGroupPreview ? group.preview_video_url : currentPost?.video_url;
    if (!videoUrl) return;

    if (!isInView) {
      video.pause();
      return;
    }

    let cancelled = false;
    const tryPlay = async () => {
      try {
        video.muted = true;
        video.currentTime = 0;
        if (!hasGroupPreview) video.src = videoUrl;
        video.load();
        await new Promise(resolve => {
          video.oncanplay = resolve;
          video.onerror = resolve;
          setTimeout(resolve, 1500);
        });
        if (cancelled) return;
        await video.play();
        video.muted = isMuted;
      } catch {}
    };
    tryPlay();
    return () => { cancelled = true; };
  }, [isInView, hasGroupPreview, group.preview_video_url, currentIndex, currentPost?.video_url]);

  // Sync mute state separately
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // If group has a preview video, always show that
  const isVideo = hasGroupPreview ? true : !!currentPost?.video_url;
  const mediaUrl = hasGroupPreview
    ? group.preview_video_url
    : isVideo
      ? currentPost?.video_url
      : (currentPost?.media_urls?.[0] || currentPost?.image_url);

  // Fallback background: group cover, logo, or gradient
  const hasCover = !!group.cover_url;
  const hasLogo = !!group.logo_url;

  return (
    <div
      ref={containerRef}
      className="relative rounded-[32px] overflow-hidden cursor-pointer"
      style={{
        width: "100%",
        aspectRatio: "4/5",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 20px 48px rgba(15,23,42,0.12)",
      }}
    >
      {/* Background media */}
      <div className="absolute inset-0">
        {mediaUrl ? (
          isVideo ? (
            <video
              key={`video-${group.id}-${hasGroupPreview ? "preview" : currentIndex}`}
              ref={videoRef}
              src={hasGroupPreview ? group.preview_video_url : undefined}
              className="w-full h-full object-cover"
              muted
              playsInline
              loop
              preload="auto"
            />
          ) : (
            <img src={mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          )
        ) : hasCover ? (
          <img src={group.cover_url} alt="" className="w-full h-full object-cover" />
        ) : hasLogo ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}
          >
            <img src={group.logo_url} alt="" className="w-32 h-32 rounded-3xl object-cover opacity-60" />
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-8xl"
            style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #1e3a5f 100%)" }}
          >
            {group.emoji || "💬"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      </div>

      {/* Story progress bars */}
      {previewPosts.length > 1 && (
        <div className="absolute top-4 left-4 right-16 z-20 flex gap-1">
          {previewPosts.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.3)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: idx < currentIndex ? "100%" : idx === currentIndex ? "100%" : "0%",
                  backgroundColor: "white",
                  transition: idx === currentIndex ? "none" : undefined,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {isVideo && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsMuted(v => !v); }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5" onClick={() => onOpen(group)}>
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg shrink-0 overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,0.25)" }}
            >
              {group.logo_url ? (
                <img src={group.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{group.emoji || "💬"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[18px] leading-tight text-white drop-shadow-lg" style={{ fontFamily: "var(--font-serif)" }}>
                {group.name}
              </h3>
              <p className="text-xs text-white/75 flex items-center gap-1 mt-0.5">
                <Users className="w-3 h-3" />
                {(group.member_count || 0).toLocaleString()} members
              </p>
            </div>
          </div>
          {group.description && (
            <p className="text-xs text-white/85 leading-relaxed line-clamp-2">
              {group.description}
            </p>
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="flex-1 py-3 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "white", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            Pass
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onJoin(group); }}
            className="flex-1 py-3 rounded-full text-sm font-bold"
            style={{ backgroundColor: "white", color: "var(--accent-primary)" }}
          >
            Join Group
          </button>
        </div>
      </div>
    </div>
  );
}