import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, MessageCircle, Send, Heart, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ShareSheet from "@/components/community/ShareSheet";

const COLORS = ["#7C3AED", "#DB2777", "#EA580C", "#059669", "#0284C7", "#D97706"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "✨", "😮", "😢", "🙏"];
const STATUS_DURATION = 8000;

export default function StatusViewer() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const targetAuthorEmail = urlParams.get("authorEmail");

  const [user, setUser] = useState(null);
  const [groupIdx, setGroupIdx] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [reactions, setReactions] = useState({});
  const [reactionCounts, setReactionCounts] = useState({});
  const [userReactions, setUserReactions] = useState({});
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(true);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);
  const touchStartX = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    window.dispatchEvent(new CustomEvent("statusviewermode", { detail: { active: true } }));
    return () => window.dispatchEvent(new CustomEvent("statusviewermode", { detail: { active: false } }));
  }, []);

  const { data: statuses = [] } = useQuery({
    queryKey: ["creatorStatuses"],
    queryFn: async () => {
      const all = await base44.entities.CreatorStatus.list("-created_date", 100);
      const now = new Date();
      return all.filter(s => !s.expires_at || new Date(s.expires_at) > now);
    },
  });

  const authorGroups = useMemo(() => {
    const map = new Map();
    statuses.forEach(s => {
      if (!map.has(s.author_email)) map.set(s.author_email, []);
      map.get(s.author_email).push(s);
    });
    return Array.from(map.values());
  }, [statuses]);

  useEffect(() => {
    if (authorGroups.length > 0 && targetAuthorEmail) {
      const idx = authorGroups.findIndex(g => g[0].author_email === targetAuthorEmail);
      if (idx >= 0) setGroupIdx(idx);
    }
  }, [authorGroups.length, targetAuthorEmail]);

  const currentGroup = authorGroups[groupIdx] || [];
  const currentStatus = currentGroup[statusIdx];

  const handleClose = useCallback(() => {
    clearInterval(timerRef.current);
    navigate(-1);
  }, [navigate]);

  const handleNext = useCallback(() => {
    setStatusIdx(si => {
      if (si < (authorGroups[groupIdx]?.length || 1) - 1) return si + 1;
      // Move to next group
      if (groupIdx < authorGroups.length - 1) {
        setGroupIdx(gi => gi + 1);
        return 0;
      }
      // End of all statuses
      setTimeout(handleClose, 0);
      return si;
    });
  }, [groupIdx, authorGroups, handleClose]);

  const handlePrev = useCallback(() => {
    setStatusIdx(si => {
      if (si > 0) return si - 1;
      if (groupIdx > 0) {
        setGroupIdx(gi => gi - 1);
        return 0;
      }
      return si;
    });
  }, [groupIdx]);

  // Progress timer
  useEffect(() => {
    if (showComments || !currentStatus) return;
    setProgress(0);
    const start = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const p = Math.min((Date.now() - start) / STATUS_DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        clearInterval(timerRef.current);
        handleNext();
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [statusIdx, groupIdx, showComments, currentStatus?.id]);

  // Sync state with current status
  useEffect(() => {
    if (!currentStatus) return;
    setReactions(currentStatus.reactions || {});
    setReactionCounts(currentStatus.reaction_counts || {});
    setComments(currentStatus.comments || []);
    setShowComments(true);
    const likes = currentStatus.liked_by || [];
    setLiked(!!user?.email && likes.includes(user.email));
    setLikeCount(likes.length);
    const userReacts = {};
    Object.entries(currentStatus.reactions || {}).forEach(([emoji, users]) => {
      if (users?.includes(user?.email)) userReacts[emoji] = true;
    });
    setUserReactions(userReacts);
    if (user?.email && !currentStatus.viewed_by?.includes(user.email)) {
      base44.entities.CreatorStatus.update(currentStatus.id, {
        view_count: (currentStatus.view_count || 0) + 1,
        viewed_by: [...(currentStatus.viewed_by || []), user.email],
      }).catch(() => {});
    }
  }, [currentStatus?.id, user?.email]);

  const handleLike = async () => {
    if (!user?.email || !currentStatus) return;
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    const newLikedBy = newLiked
      ? [...(currentStatus.liked_by || []), user.email]
      : (currentStatus.liked_by || []).filter(e => e !== user.email);
    setLiked(newLiked);
    setLikeCount(newCount);
    await base44.entities.CreatorStatus.update(currentStatus.id, { liked_by: newLikedBy }).catch(() => {});
  };

  const handleReact = async (emoji) => {
    if (!user?.email || !currentStatus) return;
    const newReactions = { ...reactions };
    const newCounts = { ...reactionCounts };
    if (userReactions[emoji]) {
      newReactions[emoji] = (newReactions[emoji] || []).filter(e => e !== user.email);
      if (!newReactions[emoji].length) delete newReactions[emoji];
      newCounts[emoji] = Math.max(0, (newCounts[emoji] || 0) - 1);
      if (!newCounts[emoji]) delete newCounts[emoji];
    } else {
      newReactions[emoji] = [...(newReactions[emoji] || []), user.email];
      newCounts[emoji] = (newCounts[emoji] || 0) + 1;
    }
    setReactions(newReactions);
    setReactionCounts(newCounts);
    setUserReactions(prev => ({ ...prev, [emoji]: !prev[emoji] }));
    await base44.entities.CreatorStatus.update(currentStatus.id, { reactions: newReactions, reaction_counts: newCounts }).catch(() => {});
  };

  const handleComment = async () => {
    if (!commentText.trim() || !user?.email || !currentStatus) return;
    const newComment = {
      author_email: user.email,
      author_name: user.full_name || user.email.split("@")[0],
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...comments, newComment];
    setComments(updated);
    setCommentText("");
    await base44.entities.CreatorStatus.update(currentStatus.id, { comments: updated }).catch(() => {});
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (showComments) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 60) { if (dx > 0) handleNext(); else handlePrev(); }
  };

  if (!currentStatus) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const TEXT_POSITION_STYLES = {
    "top-left":      { top: 80, left: 16, textAlign: "left" },
    "top-center":    { top: 80, left: "50%", transform: "translateX(-50%)", textAlign: "center" },
    "top-right":     { top: 80, right: 16, textAlign: "right" },
    "center-left":   { top: "50%", left: 16, transform: "translateY(-50%)", textAlign: "left" },
    "center":        { top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" },
    "center-right":  { top: "50%", right: 16, transform: "translateY(-50%)", textAlign: "right" },
    "bottom-left":   { bottom: 120, left: 16, textAlign: "left" },
    "bottom-center": { bottom: 120, left: "50%", transform: "translateX(-50%)", textAlign: "center" },
    "bottom-right":  { bottom: 120, right: 16, textAlign: "right" },
  };

  const textPosStyle = TEXT_POSITION_STYLES[currentStatus.text_position] || TEXT_POSITION_STYLES["center"];
  const textFontSize = currentStatus.text_size || 28;

  const bgStyle = currentStatus.image_url
    ? {}
    : { background: currentStatus.background || "linear-gradient(135deg, #7C3AED, #4F46E5)" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col select-none"
      style={{ ...bgStyle, maxWidth: 480, margin: "0 auto" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {currentStatus.image_url && (
        <img src={currentStatus.image_url} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
      )}
      {currentStatus.video_url && (
        <video src={currentStatus.video_url} autoPlay loop playsInline className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
      )}
      {(currentStatus.image_url || currentStatus.video_url) && (
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
      )}

      {/* Progress bars */}
      <div className="relative z-10 flex gap-1 px-3 pt-10">
        {currentGroup.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.3)" }}>
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: "#fff",
                width: i < statusIdx ? "100%" : i === statusIdx ? `${progress * 100}%` : "0%",
                transition: i === statusIdx ? "none" : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-3 pb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0"
          style={{ backgroundColor: avatarColor(currentStatus.author_email), color: "#fff" }}>
          {(currentStatus.author_name || "U")[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">{currentStatus.author_name || currentStatus.author_email}</p>
          <p className="text-white/60 text-[11px]">
            {Math.floor((Date.now() - new Date(currentStatus.created_date).getTime()) / 3600000)}h ago
            {currentStatus.view_count > 0 && ` · ${currentStatus.view_count} views`}
          </p>
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Tap zones */}
      <div className="relative z-10 flex-1 flex">
        <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
        <div className="flex-1 h-full" />
        <div className="w-1/3 h-full cursor-pointer" onClick={handleNext} />
      </div>

      {/* Overlay text at saved position */}
      {currentStatus.text && (
        <div className="absolute z-10 max-w-[82%]" style={{ ...textPosStyle }}>
          <p style={{
            color: "#fff",
            fontFamily: "var(--font-serif)",
            fontSize: textFontSize,
            fontWeight: 700,
            lineHeight: 1.25,
            textAlign: textPosStyle.textAlign,
            textShadow: "0 2px 16px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.9)",
          }}>
            {currentStatus.text}
          </p>
        </div>
      )}

      {/* Bottom actions — like + comment */}
      <div className="relative z-10 flex items-center justify-end gap-2 px-4 py-2">
        <button onClick={handleLike}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: liked ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.14)", color: "#fff", border: `1px solid ${liked ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.25)"}` }}>
          <Heart className="w-3.5 h-3.5" style={{ fill: liked ? "#ef4444" : "none", color: liked ? "#ef4444" : "#fff" }} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button
          onClick={() => { setShowComments(v => !v); clearInterval(timerRef.current); setTimeout(() => inputRef.current?.focus(), 100); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: showComments ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.14)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
          <MessageCircle className="w-3.5 h-3.5" />
          {comments.length > 0 && <span>{comments.length}</span>}
        </button>
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="relative z-10 overflow-hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)" }}>
            <div className="max-h-40 overflow-y-auto px-4 pt-3 pb-1">
              {comments.length === 0 ? (
                <p className="text-white/50 text-xs text-center py-3">No comments yet. Be first!</p>
              ) : comments.slice(-10).map((c, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: avatarColor(c.author_email), color: "#fff" }}>
                    {(c.author_name?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-white/80 text-xs font-semibold">{c.author_name} </span>
                    <span className="text-white text-xs">{c.text}</span>
                  </div>
                </div>
              ))}
            </div>
            {user ? (
              <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                <input ref={inputRef} value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleComment()}
                  placeholder="Write a comment…"
                  className="flex-1 text-sm bg-transparent outline-none text-white placeholder-white/40 min-w-0"
                  style={{ fontSize: 14 }} />
                {commentText.trim() && (
                  <button onClick={handleComment} className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--accent-primary)" }}>
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-white/50 text-xs text-center py-2">Sign in to comment</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }} />
    </motion.div>
  );
}