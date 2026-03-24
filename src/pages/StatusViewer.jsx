import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, MoreHorizontal, Send, Heart, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const COLORS = ["#7C3AED", "#DB2777", "#EA580C", "#059669", "#0284C7", "#D97706"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const STATUS_DURATION = 8000;

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

export default function StatusViewer() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const targetAuthorEmail = urlParams.get("authorEmail");

  const [user, setUser] = useState(null);
  const [groupIdx, setGroupIdx] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const inputRef = useRef(null);
  const touchStartX = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    window.dispatchEvent(new CustomEvent("statusviewermode", { detail: { active: true } }));
    return () => window.dispatchEvent(new CustomEvent("statusviewermode", { detail: { active: false } }));
  }, []);

  const { data: statuses = [], isLoading } = useQuery({
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
    setProgress(0);
    setStatusIdx(si => {
      if (si < (authorGroups[groupIdx]?.length || 1) - 1) return si + 1;
      if (groupIdx < authorGroups.length - 1) {
        setGroupIdx(gi => gi + 1);
        return 0;
      }
      setTimeout(handleClose, 0);
      return si;
    });
  }, [groupIdx, authorGroups, handleClose]);

  const handlePrev = useCallback(() => {
    setProgress(0);
    setStatusIdx(si => {
      if (si > 0) return si - 1;
      if (groupIdx > 0) { setGroupIdx(gi => gi - 1); return 0; }
      return si;
    });
  }, [groupIdx]);

  // Progress timer
  useEffect(() => {
    if (paused || !currentStatus) return;
    setProgress(0);
    const start = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const p = Math.min((Date.now() - start) / STATUS_DURATION, 1);
      setProgress(p);
      if (p >= 1) { clearInterval(timerRef.current); handleNext(); }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [statusIdx, groupIdx, paused, currentStatus?.id]);

  // Sync likes
  useEffect(() => {
    if (!currentStatus) return;
    const likes = currentStatus.liked_by || [];
    setLiked(!!user?.email && likes.includes(user.email));
    setLikeCount(likes.length);
    setMsgSent(false);
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

  const handleSendMessage = async () => {
    if (!msgText.trim() || !user?.email || !currentStatus) return;
    const convId = [user.email, currentStatus.author_email].sort().join("_");
    await base44.entities.DirectMessage.create({
      conversation_id: convId,
      sender_email: user.email,
      sender_name: user.full_name || user.email.split("@")[0],
      receiver_email: currentStatus.author_email,
      text: msgText.trim(),
      message_type: "text",
      is_read: false,
    }).catch(() => {});
    setMsgText("");
    setMsgSent(true);
    setTimeout(() => setMsgSent(false), 2500);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 60) { if (dx > 0) handleNext(); else handlePrev(); }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentStatus) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
        <p className="text-white/60 text-base">No statuses to show</p>
        <button onClick={handleClose} className="px-6 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>Go back</button>
      </div>
    );
  }

  const authorName = currentStatus.author_name || currentStatus.author_email?.split("@")[0] || "User";
  const hasMedia = !!(currentStatus.image_url || currentStatus.video_url);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col select-none"
      style={{
        background: currentStatus.background && !hasMedia
          ? currentStatus.background
          : "linear-gradient(160deg, #0a0a1a 0%, #1a1060 40%, #0d1b4b 100%)",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="flex gap-1 px-3 z-20 relative" style={{ paddingTop: "max(env(safe-area-inset-top, 12px), 12px)", marginBottom: 8 }}>
        {currentGroup.map((_, i) => (
          <div key={i} className="flex-1 rounded-full overflow-hidden" style={{ height: 2.5, backgroundColor: "rgba(255,255,255,0.22)" }}>
            <div className="h-full rounded-full" style={{
              backgroundColor: "#fff",
              width: i < statusIdx ? "100%" : i === statusIdx ? `${progress * 100}%` : "0%",
              transition: i === statusIdx ? "none" : undefined,
            }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-20 flex items-center gap-3 px-4 pb-3 pt-1">
        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm shrink-0 border-2 border-white/30"
          style={{ backgroundColor: avatarColor(currentStatus.author_email), color: "#fff" }}>
          {currentStatus.author_avatar_url
            ? <img src={currentStatus.author_avatar_url} alt="" className="w-full h-full object-cover" />
            : authorName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight truncate">{authorName}</p>
          <p className="text-white/55 text-[11px]">{timeAgo(currentStatus.created_date)}</p>
        </div>
        <button onClick={() => {}} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ color: "rgba(255,255,255,0.7)" }}>
          <MoreHorizontal className="w-5 h-5" />
        </button>
        <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ color: "rgba(255,255,255,0.85)" }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tap zones */}
      <div className="absolute inset-0 z-10 flex" style={{ top: 80 }}>
        <div className="w-1/3 h-full" onClick={handlePrev} />
        <div className="flex-1 h-full" onClick={() => setPaused(p => !p)} />
        <div className="w-1/3 h-full" onClick={handleNext} />
      </div>

      {/* Main media card */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-5 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStatus.id}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-3xl overflow-hidden relative"
            style={{
              maxWidth: 340,
              aspectRatio: "9/14",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
              background: hasMedia ? "transparent" : "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: hasMedia ? "none" : "blur(20px)",
            }}
          >
            {/* Media */}
            {currentStatus.image_url && (
              <img src={currentStatus.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {currentStatus.video_url && (
              <video src={currentStatus.video_url} autoPlay loop playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            )}
            {hasMedia && <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }} />}

            {/* Text overlay if no media or centered text */}
            {!hasMedia && currentStatus.text && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <p style={{
                  color: "#fff",
                  fontFamily: "var(--font-serif)",
                  fontSize: currentStatus.text_size || 26,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  textAlign: "center",
                  textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                }}>
                  {currentStatus.text}
                </p>
              </div>
            )}

            {/* Title + description inside card bottom for media */}
            {hasMedia && currentStatus.text && (
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white font-bold text-2xl leading-tight mb-2" style={{ fontFamily: "var(--font-serif)", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
                  {currentStatus.text}
                </p>
              </div>
            )}

            {/* Paused indicator */}
            {paused && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-6 rounded-full bg-white" />
                    <div className="w-1.5 h-6 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Title & description below card */}
        {currentStatus.caption && (
          <motion.div
            key={`cap-${currentStatus.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="text-center mt-5 px-2"
          >
            <p className="text-white font-bold text-xl mb-2" style={{ fontFamily: "var(--font-serif)" }}>
              {currentStatus.caption}
            </p>
            {currentStatus.description && (
              <p className="text-white/60 text-sm leading-relaxed">{currentStatus.description}</p>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="relative z-20 px-4 pt-2 pb-2 flex items-center gap-3">
        {/* Message input */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" }}>
          <input
            ref={inputRef}
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage()}
            onFocus={() => { setPaused(true); clearInterval(timerRef.current); }}
            onBlur={() => setPaused(false)}
            placeholder={msgSent ? "Message sent ✓" : "Send message"}
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: msgSent ? "rgba(255,255,255,0.6)" : "#fff", fontSize: 14 }}
          />
          <button onClick={handleSendMessage} className="shrink-0 flex items-center justify-center"
            style={{ color: "rgba(255,255,255,0.7)", minWidth: 0, minHeight: 0 }}>
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Like button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleLike}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)" }}>
          <Heart className="w-5 h-5" style={{ fill: liked ? "#ef4444" : "none", color: liked ? "#ef4444" : "rgba(255,255,255,0.8)", transition: "all 0.2s" }} />
        </motion.button>

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)" }}>
          <Share2 className="w-4 h-4" style={{ color: "rgba(255,255,255,0.8)" }} />
        </motion.button>
      </div>
    </motion.div>
  );
}