import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

function GroupPreviewCard({ group, onDismiss, onJoin, isMember, mutualFriends, isVisible }) {
  const videoRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ["groupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id }, "-created_date", 20),
  });

  const mediaPosts = useMemo(() => {
    if (group.preview_video_url) return [{ id: "preview", video_url: group.preview_video_url }];
    return posts.filter(p => p.media_urls?.length > 0 || p.video_url).slice(0, 3);
  }, [posts, group.preview_video_url]);

  const currentPost = mediaPosts[currentIdx];
  const isVideo = !!currentPost?.video_url;
  const mediaUrl = isVideo ? currentPost.video_url : currentPost?.media_urls?.[0];

  // Auto-advance image slides
  useEffect(() => {
    if (mediaPosts.length <= 1 || isVideo) return;
    const t = setInterval(() => setCurrentIdx(i => (i + 1) % mediaPosts.length), 4000);
    return () => clearInterval(t);
  }, [mediaPosts.length, isVideo]);

  // Play/pause based on visibility and current index
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo || !mediaUrl) return;
    let cancelled = false;
    const tryPlay = async () => {
      try {
        video.muted = isMuted;
        video.currentTime = 0;
        video.src = mediaUrl;
        video.load();
        await new Promise(r => { video.oncanplay = r; video.onerror = r; setTimeout(r, 1500); });
        if (cancelled || !isVisible) return;
        await video.play();
      } catch {}
    };
    if (isVisible) tryPlay();
    else video.pause();
    return () => { cancelled = true; };
  }, [isVisible, mediaUrl, currentIdx]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Full-screen layout: video/image fills entire card, info overlaid at bottom
  return (
    <div className="h-full w-full relative overflow-hidden" style={{ backgroundColor: "#000" }}>
      {/* Full-screen media background */}
      {mediaUrl ? (
        isVideo ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            loop playsInline preload="auto"
          />
        ) : (
          <img src={mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )
      ) : (
        /* Fallback: cover image or emoji */
        group.cover_image_url ? (
          <img src={group.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-8xl"
            style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)" }}>
            {group.emoji || "💬"}
          </div>
        )
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)" }} />

      {/* Mute toggle (top right, only for video) */}
      {isVideo && mediaUrl && (
        <button
          onClick={() => setIsMuted(v => !v)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          <span className="text-white text-base">{isMuted ? "🔇" : "🔊"}</span>
        </button>
      )}

      {/* Slide dots */}
      {mediaPosts.length > 1 && (
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-10">
          {mediaPosts.map((_, i) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              className="rounded-full transition-all"
              style={{ width: i === currentIdx ? 16 : 6, height: 6, backgroundColor: i === currentIdx ? "#fff" : "rgba(255,255,255,0.4)" }} />
          ))}
        </div>
      )}

      {/* Group info overlay — bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-36 z-10">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl mb-3 overflow-hidden flex items-center justify-center"
          style={{ border: "2.5px solid rgba(255,255,255,0.6)", backgroundColor: "rgba(0,0,0,0.4)" }}>
          {group.cover_image_url ? (
            <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">{group.emoji || "💬"}</span>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-1 text-white leading-tight" style={{ fontFamily: "var(--font-serif)", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
          {group.name}
        </h2>
        <p className="text-sm text-white/70 mb-2">
          {(group.member_count || 0).toLocaleString()} members
        </p>
        {group.description && (
          <p className="text-sm text-white/80 line-clamp-2" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            {group.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TrendingGroupsSwiper({ groups, onDismiss, onJoin, onClose, membershipMap }) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const currentGroup = groups[currentGroupIndex];
  const isMember = membershipMap?.[currentGroup?.id];

  const handleDragEnd = (e, info) => {
    const threshold = 100;
    if (info.offset.x > threshold && currentGroupIndex > 0) {
      setDirection(-1);
      setCurrentGroupIndex(currentGroupIndex - 1);
    } else if (info.offset.x < -threshold && currentGroupIndex < groups.length - 1) {
      setDirection(1);
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  const handleDismiss = () => {
    onDismiss(currentGroup);
    if (currentGroupIndex < groups.length - 1) {
      setDirection(1);
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else if (currentGroupIndex > 0) {
      setDirection(-1);
      setCurrentGroupIndex(currentGroupIndex - 1);
    } else {
      onClose();
    }
  };

  const handleAction = () => {
    if (isMember) {
      // Leave group logic would go here
      onDismiss(currentGroup);
    } else {
      onJoin(currentGroup);
    }
  };

  if (!currentGroup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="text-center px-6">
          <p className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            That's all for now!
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--text-hint)" }}>
            Check back later for more trending groups
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 400 : -400, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -400 : 400, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(0,0,0,0.95)" }}>
      <button
        onClick={onClose}
        className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center z-50"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
        <X className="w-5 h-5 text-white" />
      </button>

      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={currentGroup.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          className="h-full">
          <GroupPreviewCard
            group={currentGroup}
            onDismiss={handleDismiss}
            onJoin={handleAction}
            isMember={isMember}
            mutualFriends={[]}
            isVisible={true}
          />
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons - Fixed at bottom */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex gap-3 z-50">
        <button
          onClick={handleDismiss}
          className="flex-1 py-4 rounded-full text-base font-bold"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}>
          Not interested
        </button>
        <button
          onClick={handleAction}
          className="flex-1 py-4 rounded-full text-base font-bold text-white"
          style={{ backgroundColor: "#FF3B5C" }}>
          {isMember ? "Leave" : "Follow"}
        </button>
      </div>

      {/* Group counter */}
      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold z-50"
        style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}>
        {currentGroupIndex + 1} / {groups.length}
      </div>
    </div>
  );
}