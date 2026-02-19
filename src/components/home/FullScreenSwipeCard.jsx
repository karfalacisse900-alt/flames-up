import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, MessageCircle, Star, Flag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import PollOptions from "./PollOptions";
import { getFontStyle } from "./FontPicker";
import ReportModal from "../moderation/ReportModal";

const typeLabel = {
  question: "Question",
  quote: "Quote",
  concern: "Concern"
};

export default function FullScreenSwipeCard({ post, onLike, onSkip, onFavorite, isTop, stackIndex, user }) {
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const navigate = useNavigate();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-10, 10]);
  const likeOpacity = useTransform(x, [40, 130], [0, 1]);
  const skipOpacity = useTransform(x, [-130, -40], [1, 0]);

  // Touch tracking for up-swipe
  const touchStartRef = useRef(null);

  const handleDragEnd = (e, info) => {
    const { offset, velocity } = info;
    const swipedRight = offset.x > 90 || offset.x > 40 && velocity.x > 400;
    const swipedLeft = offset.x < -90 || offset.x < -40 && velocity.x < -400;
    const swipedUp = offset.y < -80 || offset.y < -40 && velocity.y < -400;

    if (swipedUp) {
      navigate(createPageUrl("PostDetail") + `?id=${post.id}`);
    } else if (swipedRight) {
      setLiked(true);
      onLike(post);
    } else if (swipedLeft) {
      onSkip(post);
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(true);
    onLike(post);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    setFavorited(true);
    if (onFavorite) onFavorite(post);
  };

  // Background color varies slightly by type, all very light
  const bgColor = post.type === "question" ? "#F5EFE8" : post.type === "concern" ? "#F2EAE4" : "#EDF2EC";

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : 0,
        rotate: isTop ? rotate : 0,
        scale: isTop ? 1 : 1 - stackIndex * 0.03,
        zIndex: 10 - stackIndex,
        top: `${stackIndex * 6}px`
      }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={{ left: 0.6, right: 0.6, top: 0.8, bottom: 0.1 }}
      onDragEnd={handleDragEnd}
      exit={{ x: 600, opacity: 0, transition: { duration: 0.22 } }}>

      <div
        className="h-full rounded-3xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: bgColor,
          boxShadow: isTop ? "0 4px 24px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)"
        }}>

        {/* Top: type label only, small + low-contrast */}
        <div className="px-6 pt-4 pb-1 shrink-0 flex items-center justify-between">
          <span
            className="text-[11px] uppercase tracking-widest"
            style={{ color: "#ACACAC", fontFamily: "var(--font-sans)", letterSpacing: "0.12em" }}>
            {typeLabel[post.type] || "Post"}
          </span>
          {isTop &&
          <span className="text-[10px]" style={{ color: "#CACACA" }}>↑ comments · swipe →</span>
          }
        </div>

        {/* Main text — centered, clean, Napkin-style */}
        <div className="bg-[#EADFD3] px-6 py-6 flex-1 flex flex-col items-center justify-center overflow-hidden">
          <p
            className="text-center w-full"
            style={{
              fontFamily: getFontStyle(post.font_family || "serif"),
              fontSize: post.text?.length > 220 ? "1.1rem" : post.text?.length > 120 ? "1.35rem" : "1.6rem",
              lineHeight: "1.75",
              color: "var(--text-primary)",
              fontWeight: 400
            }}>

            {post.type === "quote" ? `"${post.text}"` : post.text}
          </p>

          {/* Poll options for question posts */}
          {post.type === "question" && post.answer_type && post.answer_type !== "open" &&
          <PollOptions post={post} user={user} compact={true} />
          }

          {/* Author attribution below — only if not anonymous */}
          {!post.is_anonymous && post.author_name &&
          <p
            className="text-center mt-8"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1rem",
              color: "#888",
              fontStyle: "italic"
            }}>

              — {post.author_name}
            </p>
          }
        </div>

        {/* Swipe indicators — only on top card */}
        {isTop &&
        <>
            <motion.div
            className="absolute top-1/3 right-5 pointer-events-none"
            style={{ opacity: likeOpacity }}>

              <div className="border-2 border-[#6F8F72] text-[#6F8F72] px-4 py-2 rounded-2xl font-semibold text-sm rotate-12" style={{ backgroundColor: "rgba(240,236,228,0.92)" }}>
                ♥ Yes
              </div>
            </motion.div>
            <motion.div
            className="absolute top-1/3 left-5 pointer-events-none"
            style={{ opacity: skipOpacity }}>

              <div className="border-2 px-4 py-2 rounded-2xl font-semibold text-sm -rotate-12" style={{ borderColor: "var(--border-medium)", color: "var(--text-hint)", backgroundColor: "rgba(240,236,228,0.92)" }}>
                Skip
              </div>
            </motion.div>
          </>
        }

        {/* Bottom action bar */}
        <div
          className="px-6 pb-4 pt-3 shrink-0 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>

          <button
            onClick={handleLike}
            className="flex items-center gap-2 transition-all active:scale-110"
            style={{ color: liked ? "#E07070" : "#C0B9B0" }}>

            <Heart className="text-[#6F8F72] lucide lucide-heart w-5 h-5" fill={liked ? "#E07070" : "none"} strokeWidth={liked ? 0 : 1.5} />
            <span className="text-sm" style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}>
              {(post.like_count || 0) + (liked ? 1 : 0)}
            </span>
          </button>

          <Link
            to={createPageUrl("PostDetail") + `?id=${post.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 transition-all active:scale-110"
            style={{ color: "#C0B9B0" }}>

            <MessageCircle className="text-[#6F8F72] lucide lucide-message-circle w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm" style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}>
              {post.reply_count || 0}
            </span>
          </Link>

          <button
            onClick={handleFavorite}
            className="flex items-center gap-2 transition-all active:scale-110"
            style={{ color: favorited ? "#C9A84C" : "#C0B9B0" }}>
            <Star className="text-[#6F8F72] lucide lucide-star w-5 h-5" fill={favorited ? "#C9A84C" : "none"} strokeWidth={favorited ? 0 : 1.5} />
          </button>

          <button
            onClick={(e) => {e.stopPropagation();setShowReport(true);}}
            className="flex items-center gap-2 transition-all active:scale-110"
            style={{ color: "#C0B9B0" }}>
            <Flag className="text-[#6F8F72] lucide lucide-flag w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <ReportModal open={showReport} onClose={() => setShowReport(false)} contentType="post" contentId={post.id} user={user} />
    </motion.div>);

}