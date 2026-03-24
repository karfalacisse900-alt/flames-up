import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, MoreHorizontal, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const COLORS = ["#1a56f0", "#3730a3", "#0891b2", "#6d28d9", "#0f766e"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const STATUS_DURATION = 8000;
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

export default function StatusViewer() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const targetAuthorEmail = urlParams.get("authorEmail");

  const [user, setUser] = useState(null);
  const [groupIdx, setGroupIdx] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [messageText, setMessageText] = useState("");
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    window.dispatchEvent(new CustomEvent("statusviewermode", { detail: { active: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent("statusviewermode", { detail: { active: false } }));
      clearInterval(timerRef.current);
    };
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
      if (groupIdx < authorGroups.length - 1) { setGroupIdx(gi => gi + 1); return 0; }
      setTimeout(handleClose, 0);
      return si;
    });
  }, [groupIdx, authorGroups, handleClose]);

  const handlePrev = useCallback(() => {
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

  // Track view
  useEffect(() => {
    if (!currentStatus || !user?.email) return;
    if (!currentStatus.viewed_by?.includes(user.email)) {
      base44.entities.CreatorStatus.update(currentStatus.id, {
        view_count: (currentStatus.view_count || 0) + 1,
        viewed_by: [...(currentStatus.viewed_by || []), user.email],
      }).catch(() => {});
    }
  }, [currentStatus?.id, user?.email]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user?.email || !currentStatus) return;
    const convId = [user.email, currentStatus.author_email].sort().join("_");
    await base44.entities.DirectMessage.create({
      conversation_id: convId,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      receiver_email: currentStatus.author_email,
      text: messageText.trim(),
      message_type: "text",
      is_read: false,
    }).catch(() => {});
    setMessageText("");
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 60) { dx > 0 ? handleNext() : handlePrev(); }
  };

  if (!currentStatus) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a1628" }}>
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  const authorName = getName(currentStatus.author_name, currentStatus.author_email);
  const hoursAgo = Math.floor((Date.now() - new Date(currentStatus.created_date).getTime()) / 3600000);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#0a1628", maxWidth: 480, margin: "0 auto" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="relative z-10 flex gap-1 px-3" style={{ paddingTop: "max(env(safe-area-inset-top, 16px), 16px)" }}>
        {currentGroup.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <div className="h-full rounded-full" style={{
              backgroundColor: "#fff",
              width: i < statusIdx ? "100%" : i === statusIdx ? `${progress * 100}%` : "0%",
            }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${avatarColor(currentStatus.author_email)}, #1d4ed8)` }}>
          {currentStatus.author_avatar
            ? <img src={currentStatus.author_avatar} alt="" className="w-full h-full object-cover" />
            : authorName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">{authorName}</p>
          <p className="text-white/50 text-[11px]">{hoursAgo}h</p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center">
          <MoreHorizontal className="w-5 h-5 text-white/70" />
        </button>
        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center">
          <X className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Main visual card */}
      <div className="relative z-10 flex-1 mx-3 mb-3 rounded-3xl overflow-hidden flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, #1a3a8f 0%, #1e40af 40%, #1d4ed8 100%)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

        {/* 3D-like inner glow */}
        <div className="absolute inset-0 rounded-3xl" style={{ background: "radial-gradient(ellipse at 70% 20%, rgba(99,179,255,0.15) 0%, transparent 60%)", pointerEvents: "none" }} />

        {currentStatus.image_url ? (
          <img src={currentStatus.image_url} alt="" className="w-full h-full object-cover" />
        ) : currentStatus.video_url ? (
          <video src={currentStatus.video_url} autoPlay loop playsInline className="w-full h-full object-cover" />
        ) : (
          // Default cloud/illustration placeholder when no media
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-8xl mb-6" style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" }}>
              {currentStatus.emoji || "☁️"}
            </div>
            {currentStatus.text && (
              <div>
                <h2 className="text-white text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)", lineHeight: 1.25 }}>
                  {currentStatus.text}
                </h2>
                {currentStatus.subtitle && (
                  <p className="text-white/70 text-sm leading-relaxed">{currentStatus.subtitle}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Text overlay for media */}
        {(currentStatus.image_url || currentStatus.video_url) && currentStatus.text && (
          <div className="absolute bottom-6 left-6 right-6 text-center">
            <h2 className="text-white text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", textShadow: "0 2px 16px rgba(0,0,0,0.8)" }}>
              {currentStatus.text}
            </h2>
          </div>
        )}

        {/* Tap zones */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
          <div className="flex-1 h-full" />
          <div className="w-1/3 h-full cursor-pointer" onClick={handleNext} />
        </div>
      </div>

      {/* Title/description below card */}
      {!currentStatus.image_url && !currentStatus.video_url && (
        <div className="relative z-10 px-5 pb-4 text-center">
          {currentStatus.caption && (
            <p className="text-white/60 text-sm leading-relaxed">{currentStatus.caption}</p>
          )}
        </div>
      )}

      {/* Send message bar */}
      <div className="relative z-10 px-4 pb-safe" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)" }}>
        <div className="flex items-center gap-3 px-4 py-3 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
          <input
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage()}
            placeholder="Send Message"
            className="flex-1 bg-transparent outline-none text-white placeholder-white/40 text-sm"
            style={{ fontSize: 14 }}
          />
          <button onClick={handleSendMessage}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: messageText.trim() ? "rgba(99,179,255,0.3)" : "transparent" }}>
            <Send className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}