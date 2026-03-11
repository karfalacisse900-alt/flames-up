import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Share2, UserPlus, UserCheck } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getAvatarColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function VideoViewer({ videos, initialIndex, user, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [likeBounce, setLikeBounce] = useState(false);
  const videoRef = useRef(null);
  const touchStartY = useRef(0);
  const qc = useQueryClient();

  const currentPost = videos[currentIndex];
  const hasLiked = user?.email && currentPost?.upvoted_by?.includes(user.email);

  const { data: followRecord } = useQuery({
    queryKey: ["followStatus", user?.email, currentPost?.author_email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email, following_email: currentPost?.author_email }),
    enabled: !!user?.email && currentPost?.author_email && currentPost?.author_email !== user?.email,
    select: (data) => data[0] || null,
  });

  const isFollowing = !!followRecord;

  const handleFollow = async () => {
    if (!user || !currentPost) return;
    if (isFollowing && followRecord) {
      await base44.entities.Follow.delete(followRecord.id);
    } else {
      await base44.entities.Follow.create({
        follower_email: user.email,
        follower_name: user.full_name || user.email,
        following_email: currentPost.author_email,
        following_name: currentPost.author_name,
      });
    }
    qc.invalidateQueries({ queryKey: ["followStatus", user?.email, currentPost?.author_email] });
  };

  const handleLike = async () => {
    if (!user || !currentPost) return;
    setLikeBounce(true);
    setTimeout(() => setLikeBounce(false), 500);

    const newLiked = !hasLiked;
    const newUpvotes = newLiked ? (currentPost.upvotes || 0) + 1 : Math.max(0, (currentPost.upvotes || 0) - 1);
    const newUpvotedBy = newLiked
      ? [...(currentPost.upvoted_by || []), user.email]
      : (currentPost.upvoted_by || []).filter(e => e !== user.email);

    await base44.entities.CommunityPost.update(currentPost.id, {
      upvotes: newUpvotes,
      upvoted_by: newUpvotedBy,
    }).catch(() => {});

    qc.invalidateQueries({ queryKey: ["communityPosts"] });
  };

  const handleShare = () => {
    const url = `${window.location.origin}?post=${currentPost.id}`;
    if (navigator.share) navigator.share({ title: "Video", url });
    else navigator.clipboard.writeText(url);
  };

  const nextVideo = () => {
    if (currentIndex < videos.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const prevVideo = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextVideo();
      else prevVideo();
    }
  };

  if (!currentPost || !currentPost.video_url) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 z-50 flex items-center justify-center w-9 h-9 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Main video container */}
        <div className="w-full h-full relative flex items-center justify-center max-w-lg">
          <video
            ref={videoRef}
            src={currentPost.video_url}
            autoPlay
            controls
            playsInline
            muted={false}
            className="w-full h-full object-cover"
          />

          {/* Overlay gradient for bottom content */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent" />

          {/* Right side action panel */}
          <div className="absolute right-4 bottom-20 z-40 flex flex-col gap-6">
            {/* Like button */}
            <button
              onClick={handleLike}
              className={`flex flex-col items-center gap-2 transition-all ${likeBounce ? "scale-125" : ""}`}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <span className="text-2xl">{hasLiked ? "❤️" : "🤍"}</span>
              </div>
              <span className="text-xs font-semibold text-white">{currentPost.upvotes || 0}</span>
            </button>

            {/* Comment button */}
            <Link
              to={createPageUrl(`PostComments?postId=${currentPost.id}`)}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-white">{currentPost.comment_count || 0}</span>
            </Link>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-white">Share</span>
            </button>
          </div>

          {/* Bottom info panel */}
          <div className="absolute bottom-0 left-0 right-0 z-40 p-4">
            {/* Author info */}
            <div className="flex items-start gap-3 mb-4">
              <Link
                to={createPageUrl(`UserProfile?email=${currentPost.author_email}`)}
                className="flex-1 min-w-0"
              >
                {currentPost.author_avatar_url ? (
                  <img
                    src={currentPost.author_avatar_url}
                    alt={currentPost.author_name}
                    loading="lazy"
                    className="w-10 h-10 rounded-full object-cover mb-2"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2"
                    style={{ backgroundColor: getAvatarColor(currentPost.author_name), color: "#fff" }}
                  >
                    {(currentPost.author_name?.[0] || "U").toUpperCase()}
                  </div>
                )}
                <p className="text-white font-bold text-sm truncate">{currentPost.author_name || "User"}</p>
              </Link>

              {currentPost.author_email !== user?.email && user && (
                <button
                  onClick={handleFollow}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0"
                  style={{
                    borderColor: isFollowing ? "#fff" : "rgba(255,255,255,0.3)",
                    color: "#fff",
                    backgroundColor: isFollowing ? "rgba(255,255,255,0.2)" : "transparent",
                  }}
                >
                  {isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>

            {/* Caption */}
            {currentPost.title && (
              <p className="text-white text-sm font-semibold mb-2 leading-relaxed">{currentPost.title}</p>
            )}
            {currentPost.body && (
              <p className="text-white/80 text-xs mb-3 line-clamp-2 leading-relaxed">{currentPost.body}</p>
            )}
          </div>

          {/* Navigation dots */}
          {videos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2">
              {videos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className="transition-all"
                  style={{
                    width: i === currentIndex ? 24 : 8,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: i === currentIndex ? "#fff" : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Swipe hint */}
          {videos.length > 1 && (
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none flex justify-between px-4 text-white/50 text-xs font-medium">
              <span>{currentIndex > 0 ? "← Swipe" : ""}</span>
              <span>{currentIndex < videos.length - 1 ? "Swipe →" : ""}</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}