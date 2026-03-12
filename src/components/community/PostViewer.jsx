import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Share2, Plus, Globe, MapPin, ChevronDown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import CommentsSheet from "./CommentsSheet";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getAvatarColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

const POPULAR_CITIES = ["New York", "London", "Paris", "Tokyo", "Los Angeles", "Sydney", "Toronto", "Dubai", "Berlin", "Mumbai", "São Paulo", "Seoul", "Amsterdam", "Barcelona", "Singapore"];

function stripHtml(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  return (div.textContent || div.innerText || "").trim();
}

export default function PostViewer({ posts, initialIndex, user, onClose, activeFilter, onFilterChange, allCities = [] }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [likeBounce, setLikeBounce] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const qc = useQueryClient();

  const currentPost = posts[currentIndex];
  const hasLiked = user?.email && currentPost?.upvoted_by?.includes(user.email);

  // Reset index when posts list changes (filter change)
  useEffect(() => {
    setCurrentIndex(0);
  }, [posts.length, activeFilter]);

  const { data: followRecord } = useQuery({
    queryKey: ["followStatus", user?.email, currentPost?.author_email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email, following_email: currentPost?.author_email }),
    enabled: !!user?.email && !!currentPost?.author_email && currentPost?.author_email !== user?.email,
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
    setTimeout(() => setLikeBounce(false), 400);
    const newLiked = !hasLiked;
    await base44.entities.CommunityPost.update(currentPost.id, {
      upvotes: newLiked ? (currentPost.upvotes || 0) + 1 : Math.max(0, (currentPost.upvotes || 0) - 1),
      upvoted_by: newLiked
        ? [...(currentPost.upvoted_by || []), user.email]
        : (currentPost.upvoted_by || []).filter(e => e !== user.email),
    }).catch(() => {});
    qc.invalidateQueries({ queryKey: ["communityPosts"] });
  }, [user, currentPost, hasLiked, qc]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}?post=${currentPost.id}`;
    if (navigator.share) navigator.share({ title: "Post", url });
    else navigator.clipboard.writeText(url);
  }, [currentPost?.id]);

  const nextPost = useCallback(() => {
    if (currentIndex < posts.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, posts.length]);

  const prevPost = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  const handleTouchStart = (e) => {
    if (showComments || showRegionPicker) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (showComments || showRegionPicker) return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const dx = Math.abs(touchStartX.current - e.changedTouches[0].clientX);
    if (Math.abs(dy) > 50 && dx < 60) {
      if (dy > 0) nextPost();
      else prevPost();
    }
  };

  const handleClose = useCallback(() => {
    window.dispatchEvent(new CustomEvent("postviewermode", { detail: { active: false } }));
    onClose();
  }, [onClose]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("postviewermode", { detail: { active: true } }));
    return () => {};
  }, []);

  const citySuggestions = cityInput.trim()
    ? [...allCities.filter(c => c.toLowerCase().includes(cityInput.toLowerCase())), ...POPULAR_CITIES.filter(c => c.toLowerCase().includes(cityInput.toLowerCase()) && !allCities.includes(c))].slice(0, 8)
    : POPULAR_CITIES.slice(0, 8);

  if (!currentPost) return null;

  const caption = stripHtml(currentPost.body || currentPost.title || "");

  const filterLabel = activeFilter === "global" ? "🌍 Global" : activeFilter === "nearby" ? "📍 Nearby" : `🏙 ${activeFilter}`;

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
        <div className="w-full h-full relative max-w-lg mx-auto">

          {/* ── Full-Screen Media ── */}
          <div className="absolute inset-0">
            {currentPost.video_url ? (
              <video key={currentPost.id} src={currentPost.video_url} autoPlay playsInline loop className="w-full h-full object-cover" />
            ) : currentPost.image_urls?.[0] || currentPost.image_url ? (
              <img key={currentPost.id} src={currentPost.image_urls?.[0] || currentPost.image_url} alt="post" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center px-8"
                style={{ background: "linear-gradient(160deg, #1a2e22 0%, #0d1a11 60%, #000 100%)" }}>
                <p className="text-white text-xl font-bold text-center leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                  {caption || "Post"}
                </p>
              </div>
            )}

            {/* Bottom gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)" }} />
            {/* Top gradient overlay */}
            <div className="absolute inset-x-0 top-0 h-32 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }} />
          </div>

          {/* ── Top bar: close + region filter ── */}
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-12 pb-4">
            <button onClick={handleClose}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)" }}>
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Region filter button */}
            {onFilterChange && (
              <div className="relative">
                <button
                  onClick={() => setShowRegionPicker(p => !p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(10px)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <span>{filterLabel}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showRegionPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowRegionPicker(false)} />
                    <div className="absolute right-0 top-10 w-56 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      style={{ backgroundColor: "rgba(20,20,20,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <div className="p-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        <button onClick={() => { onFilterChange("global"); setShowRegionPicker(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all"
                          style={{ backgroundColor: activeFilter === "global" ? "rgba(46,107,79,0.4)" : "transparent", color: activeFilter === "global" ? "#4CAF7D" : "#fff" }}>
                          <Globe className="w-4 h-4" /> Global
                        </button>
                        <button onClick={() => { onFilterChange("nearby"); setShowRegionPicker(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all"
                          style={{ backgroundColor: activeFilter === "nearby" ? "rgba(46,107,79,0.4)" : "transparent", color: activeFilter === "nearby" ? "#4CAF7D" : "#fff" }}>
                          <MapPin className="w-4 h-4" /> Nearby (50km)
                        </button>
                      </div>
                      <div className="p-2">
                        <input autoFocus type="text" value={cityInput} onChange={e => setCityInput(e.target.value)}
                          placeholder="Search city…" className="w-full px-3 py-1.5 rounded-xl text-sm outline-none mb-2"
                          style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
                        <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                          {citySuggestions.map(c => (
                            <button key={c} onClick={() => { onFilterChange(c); setCityInput(""); setShowRegionPicker(false); }}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-sm transition-all"
                              style={{ backgroundColor: activeFilter === c ? "rgba(46,107,79,0.4)" : "transparent", color: activeFilter === c ? "#4CAF7D" : "#fff" }}>
                              🏙 {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Post counter */}
            <div className="text-white/60 text-xs font-medium tabular-nums" style={{ minWidth: 40, textAlign: "right" }}>
              {currentIndex + 1}/{posts.length}
            </div>
          </div>

          {/* ── Right actions (like TikTok) ── */}
          <div className="absolute right-4 bottom-32 z-30 flex flex-col gap-5 items-center">
            {/* Like */}
            <button onClick={handleLike} className={`flex flex-col items-center gap-1 transition-all ${likeBounce ? "scale-125" : ""}`}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)" }}>
                <span className="text-2xl">{hasLiked ? "❤️" : "🤍"}</span>
              </div>
              <span className="text-white text-xs font-bold tabular-nums">{currentPost.upvotes || 0}</span>
            </button>

            {/* Comment */}
            <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)" }}>
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xs font-bold tabular-nums">{currentPost.comment_count || 0}</span>
            </button>

            {/* Share */}
            <button onClick={handleShare} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)" }}>
                <Share2 className="w-5 h-5 text-white" />
              </div>
            </button>
          </div>

          {/* ── Bottom info panel ── */}
          <div className="absolute bottom-0 inset-x-0 z-20 px-4 pb-10">
            {/* Author row */}
            <div className="flex items-center gap-3 mb-3">
              <Link to={createPageUrl(`UserProfile?email=${currentPost.author_email}`)} onClick={handleClose}>
                {currentPost.author_avatar_url ? (
                  <img src={currentPost.author_avatar_url} alt={currentPost.author_name} className="w-11 h-11 rounded-full object-cover border-2 border-white/30 flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 border-2 border-white/30"
                    style={{ backgroundColor: getAvatarColor(currentPost.author_name) }}>
                    {(currentPost.author_name?.[0] || "U").toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">
                  {currentPost.is_anonymous ? "Anonymous" : (currentPost.author_name || "User")}
                </p>
                {currentPost.location_name && (
                  <p className="text-white/60 text-xs truncate">📍 {currentPost.location_name}</p>
                )}
              </div>
              {currentPost.author_email !== user?.email && user && (
                <button onClick={handleFollow}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ backgroundColor: isFollowing ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.4)" }}
                  title={isFollowing ? "Following" : "Follow"}>
                  <Plus className={`w-5 h-5 text-white transition-transform ${isFollowing ? "rotate-45" : ""}`} />
                </button>
              )}
            </div>

            {/* Caption */}
            {caption && (
              <div className="mb-3 pr-16">
                <p className="text-white text-sm leading-relaxed" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                  {caption.length > 140 ? caption.slice(0, 140) + "…" : caption}
                </p>
              </div>
            )}

            {/* Progress dots */}
            {posts.length > 1 && posts.length <= 20 && (
              <div className="flex gap-1.5 items-center">
                {posts.slice(Math.max(0, currentIndex - 5), Math.min(posts.length, currentIndex + 6)).map((_, i) => {
                  const actualI = Math.max(0, currentIndex - 5) + i;
                  return (
                    <div key={actualI}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: actualI === currentIndex ? 20 : 6,
                        height: 6,
                        backgroundColor: actualI === currentIndex ? "#fff" : "rgba(255,255,255,0.35)",
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Swipe arrows (hidden on mobile, subtle on desktop) ── */}
          <div className="hidden md:flex absolute inset-y-0 left-3 items-center z-30">
            <button onClick={prevPost} disabled={currentIndex === 0}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", opacity: currentIndex === 0 ? 0.2 : 1 }}>
              <span className="text-white text-lg">↑</span>
            </button>
          </div>
          <div className="hidden md:flex absolute inset-y-0 right-20 items-center z-30">
            <button onClick={nextPost} disabled={currentIndex === posts.length - 1}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", opacity: currentIndex === posts.length - 1 ? 0.2 : 1 }}>
              <span className="text-white text-lg">↓</span>
            </button>
          </div>
        </div>

        {/* ── Comments Sheet ── */}
        <AnimatePresence>
          {showComments && (
            <CommentsSheet postId={currentPost.id} user={user} onClose={() => setShowComments(false)} />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}