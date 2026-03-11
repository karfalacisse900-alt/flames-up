import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Share2, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getAvatarColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function PostViewer({ posts, initialIndex, user, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [likeBounce, setLikeBounce] = useState(false);
  const touchStartY = useRef(0);
  const qc = useQueryClient();

  const currentPost = posts[currentIndex];
  const hasLiked = user?.email && currentPost?.upvoted_by?.includes(user.email);

  const { data: followRecord } = useQuery({
    queryKey: ["followStatus", user?.email, currentPost?.author_email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email, following_email: currentPost?.author_email }),
    enabled: !!user?.email && currentPost?.author_email && currentPost?.author_email !== user?.email,
    select: (data) => data[0] || null,
  });

  const isFollowing = !!followRecord;

  const handleFollow = useCallback(async () => {
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
  }, [user, currentPost, isFollowing, followRecord, qc]);

  const handleLike = useCallback(async () => {
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
  }, [user, currentPost, hasLiked, qc]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}?post=${currentPost.id}`;
    if (navigator.share) navigator.share({ title: "Post", url });
    else navigator.clipboard.writeText(url);
  }, [currentPost?.id]);

  const nextPost = useCallback(() => {
    if (currentIndex < posts.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, posts.length]);

  const prevPost = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextPost();
      else prevPost();
    }
  };

  const handleClose = useCallback(() => {
    window.dispatchEvent(new CustomEvent("postviewermode", { detail: { active: false } }));
    onClose();
  }, [onClose]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("postviewermode", { detail: { active: true } }));
  }, []);

  if (!currentPost) return null;

  const mediaHeight = 65; // 65% of screen for media

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-6 left-6 z-50 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Main container */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-full max-w-lg h-full flex flex-col bg-black">
            {/* Media - Fixed height, proper aspect ratio */}
            <div className="w-full flex-shrink-0" style={{ height: `${mediaHeight}vh`, backgroundColor: "#000" }}>
              <div className="w-full h-full flex items-center justify-center bg-black relative overflow-hidden">
                {currentPost.video_url ? (
                  <video
                    src={currentPost.video_url}
                    autoPlay
                    playsInline
                    muted={false}
                    className="w-full h-full object-contain"
                  />
                ) : currentPost.image_urls?.[0] || currentPost.image_url ? (
                  <img
                    src={currentPost.image_urls?.[0] || currentPost.image_url}
                    alt="post"
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-800 to-black p-6">
                    <p className="text-white/60 text-center text-sm">{currentPost.title || currentPost.body || "Post"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info panel - Scrollable, fixed positioning */}
            <div className="flex-1 flex flex-col bg-black overflow-y-auto scrollbar-hide">
              <div className="flex-1 flex flex-col p-4 pb-20">
                {/* Author card */}
                <div className="flex items-center gap-3 mb-4">
                  <Link to={createPageUrl(`UserProfile?email=${currentPost.author_email}`)} className="flex-1">
                    <div className="flex items-center gap-3">
                      {currentPost.author_avatar_url ? (
                        <img src={currentPost.author_avatar_url} alt={currentPost.author_name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ backgroundColor: getAvatarColor(currentPost.author_name) }}>
                          {(currentPost.author_name?.[0] || "U").toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm truncate">{currentPost.author_name || "User"}</p>
                        <p className="text-white/50 text-xs">Creator</p>
                      </div>
                    </div>
                  </Link>

                  {currentPost.author_email !== user?.email && user && (
                    <button
                      onClick={handleFollow}
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        backgroundColor: isFollowing ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.25)",
                        color: "#fff",
                      }}
                      title={isFollowing ? "Following" : "Follow"}
                    >
                      {isFollowing ? (
                        <Plus className="w-5 h-5 rotate-45" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Caption section */}
                {(currentPost.body || currentPost.title) && (
                  <div className="mb-4">
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {currentPost.body || currentPost.title}
                    </p>
                  </div>
                )}

                {/* Tags/metadata */}
                {currentPost.location_name && (
                  <div className="flex items-center gap-2 mb-4 text-white/70 text-xs">
                    <span>📍 {currentPost.location_name}</span>
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />
              </div>
            </div>

            {/* Fixed action buttons - Bottom overlay */}
            <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-4">
              {/* Like */}
              <button
                onClick={handleLike}
                className={`flex flex-col items-center gap-1.5 transition-all ${likeBounce ? "scale-125" : ""}`}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <span className="text-3xl">{hasLiked ? "❤️" : "🤍"}</span>
                </div>
                <span className="text-xs font-bold text-white">{currentPost.upvotes || 0}</span>
              </button>

              {/* Comment */}
              <Link
                to={createPageUrl(`PostComments?postId=${currentPost.id}`)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold text-white">{currentPost.comment_count || 0}</span>
              </Link>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>

            {/* Position indicator */}
            {posts.length > 1 && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-xs font-medium z-40">
                {currentIndex + 1}/{posts.length}
              </div>
            )}

            {/* Swipe hint */}
            {posts.length > 1 && (
              <div className="absolute top-4 right-4 text-white/40 text-xs flex flex-col items-center gap-1 z-40">
                <span>↑</span>
                <span>↓</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}