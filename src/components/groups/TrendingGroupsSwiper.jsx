import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

function GroupPreviewCard({ group, onDismiss, onJoin, onOpen }) {
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const videoRef = useRef(null);

  const { data: posts = [] } = useQuery({
    queryKey: ["groupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id }, "-created_date", 20),
  });

  const mediaPosts = posts.filter(p => p.media_urls?.length > 0 || p.video_url);
  const currentPost = mediaPosts[currentPostIndex];

  useEffect(() => {
    if (videoRef.current && currentPost?.video_url) {
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [currentPost]);

  const handlePrevPost = (e) => {
    e.stopPropagation();
    if (currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1);
    }
  };

  const handleNextPost = (e) => {
    e.stopPropagation();
    if (currentPostIndex < mediaPosts.length - 1) {
      setCurrentPostIndex(currentPostIndex + 1);
    }
  };

  if (!currentPost) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>No preview available</p>
      </div>
    );
  }

  const isVideo = !!currentPost.video_url;
  const mediaUrl = isVideo ? currentPost.video_url : currentPost.media_urls?.[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
            {group.cover_image_url ? (
              <img src={group.cover_image_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span>{group.emoji || "💬"}</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {group.name}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>
              <Users className="w-3 h-3 inline mr-0.5" />{(group.member_count || 0).toLocaleString()} members
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      {/* Media preview */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPost.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ backgroundColor: "var(--bg-subtle)" }}>
            {mediaUrl ? (
              isVideo ? (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  muted
                />
              ) : (
                <img src={mediaUrl} alt="" className="w-full h-full object-contain" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {mediaPosts.length > 1 && (
          <>
            {currentPostIndex > 0 && (
              <button
                onClick={handlePrevPost}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10"
                style={{ backgroundColor: "rgba(250,250,248,0.95)", border: "1px solid var(--border-light)" }}>
                <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
              </button>
            )}
            {currentPostIndex < mediaPosts.length - 1 && (
              <button
                onClick={handleNextPost}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10"
                style={{ backgroundColor: "rgba(250,250,248,0.95)", border: "1px solid var(--border-light)" }}>
                <ChevronRight className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
              </button>
            )}
          </>
        )}

        {/* Post indicators */}
        {mediaPosts.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
            {mediaPosts.slice(0, 8).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === currentPostIndex ? 20 : 6,
                  height: 6,
                  backgroundColor: i === currentPostIndex ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-5 flex gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="flex-1 py-3.5 rounded-2xl text-base font-semibold"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
          Not Interested
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onJoin(group); }}
          className="flex-1 py-3.5 rounded-2xl text-base font-bold text-white"
          style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
          Join Group
        </button>
      </div>
    </div>
  );
}

export default function TrendingGroupsSwiper({ groups, onDismiss, onJoin, onOpen, onClose }) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const dragX = useMotionValue(0);
  const dragProgress = useTransform(dragX, [-200, 0, 200], [-1, 0, 1]);

  const currentGroup = groups[currentGroupIndex];

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

  const handleDismissGroup = () => {
    if (currentGroupIndex < groups.length - 1) {
      setDirection(1);
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else if (currentGroupIndex > 0) {
      setDirection(-1);
      setCurrentGroupIndex(currentGroupIndex - 1);
    }
    onDismiss(currentGroup);
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
    <div className="fixed inset-0 z-50" style={{ backgroundColor: "var(--bg-app)" }}>
      <button
        onClick={onClose}
        className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center z-50"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <X className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
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
          style={{ x: dragX }}
          className="h-full rounded-3xl overflow-hidden"
          onClick={() => onOpen(currentGroup)}>
          <div className="h-full" style={{ backgroundColor: "var(--bg-card)" }}>
            <GroupPreviewCard
              group={currentGroup}
              onDismiss={handleDismissGroup}
              onJoin={onJoin}
              onOpen={onOpen}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Group counter */}
      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold z-50"
        style={{ backgroundColor: "rgba(250,250,248,0.95)", color: "var(--text-secondary)" }}>
        {currentGroupIndex + 1} / {groups.length}
      </div>
    </div>
  );
}