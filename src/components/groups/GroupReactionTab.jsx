import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Plus, X, Star } from "lucide-react";

const EMOJIS = ["😂", "🔥", "❤️", "😮", "👏", "💀", "🤯", "😍"];

function StartReactionModal({ group, user, onClose, onCreated }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    if (!videoUrl.trim()) return;
    setSaving(true);
    await base44.entities.GroupReaction.create({
      group_id: group.id,
      host_email: user.email,
      host_name: user.full_name || user.email,
      video_url: videoUrl.trim(),
      video_title: videoTitle.trim() || "Group Watch Session",
      is_active: true,
      ratings: {},
      reactions: [],
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl p-5"
        style={{ backgroundColor: "#F2EDE4" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mb-4" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Start Watch Session</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
        </div>

        <div className="space-y-3 pb-4">
          <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Title (optional)"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube URL or any video link *"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Share a YouTube link for the group to watch and react together.</p>

          <button onClick={handleStart} disabled={saving || !videoUrl.trim()}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #db2777, #7c3aed)" }}>
            {saving ? "Starting..." : "🎬 Start Watch Session"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReactionSessionCard({ session, user }) {
  const qc = useQueryClient();
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const myRating = session.ratings?.[user?.email];
  const avgRating = (() => {
    const vals = Object.values(session.ratings || {});
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  })();

  const sendReaction = async (emoji) => {
    if (!user?.email) return;
    const newReaction = { email: user.email, emoji, timestamp: Date.now() };
    const updatedReactions = [...(session.reactions || []), newReaction].slice(-50);
    await base44.entities.GroupReaction.update(session.id, { reactions: updatedReactions });
    qc.invalidateQueries({ queryKey: ["groupReactions", session.group_id] });
    // local float animation
    const id = Date.now();
    setFloatingEmojis(prev => [...prev, { id, emoji }]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 1800);
  };

  const rateVideo = async (rating) => {
    if (!user?.email) return;
    const newRatings = { ...(session.ratings || {}), [user.email]: rating };
    await base44.entities.GroupReaction.update(session.id, { ratings: newRatings });
    qc.invalidateQueries({ queryKey: ["groupReactions", session.group_id] });
  };

  // Extract YouTube embed
  const getYouTubeId = (url) => {
    const match = url?.match(/(?:youtu\.be\/|v\/|watch\?v=|embed\/|shorts\/)([\w-]{11})/);
    return match?.[1] || null;
  };
  const ytId = getYouTubeId(session.video_url);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div>
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{session.video_title}</p>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>by {session.host_name}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {avgRating && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
              <Star className="w-3 h-3 fill-current" /> {avgRating}
            </span>
          )}
          {!session.is_active && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>Ended</span>
          )}
        </div>
      </div>

      {/* Video */}
      <div className="relative">
        {ytId ? (
          <div style={{ paddingBottom: "56.25%", position: "relative" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={session.video_title}
              referrerPolicy="origin"
            />
          </div>
        ) : (
          <a href={session.video_url} target="_blank" rel="noreferrer"
            className="block p-4 text-sm font-semibold underline"
            style={{ color: "var(--accent-primary)" }}>
            🔗 Open Video Link
          </a>
        )}

        {/* Floating emojis */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {floatingEmojis.map(fe => (
              <motion.div key={fe.id}
                initial={{ opacity: 1, y: 0, x: Math.random() * 60 + 20 }}
                animate={{ opacity: 0, y: -80 }}
                exit={{}}
                transition={{ duration: 1.6, ease: "easeOut" }}
                className="absolute bottom-4 text-2xl">
                {fe.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Live reactions */}
      {session.is_active && user && (
        <div className="px-4 py-3">
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>React Live</p>
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => sendReaction(emoji)}
                className="text-xl active:scale-125 transition-transform">{emoji}</button>
            ))}
          </div>

          {/* Recent reactions strip */}
          {session.reactions?.length > 0 && (
            <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-hide">
              {[...session.reactions].reverse().slice(0, 20).map((r, i) => (
                <span key={i} className="text-base">{r.emoji}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rating */}
      {user && (
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Rate this video</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button key={n} onClick={() => rateVideo(n)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  backgroundColor: myRating === n ? "var(--accent-primary)" : "var(--bg-subtle)",
                  color: myRating === n ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${myRating === n ? "var(--accent-primary)" : "var(--border-light)"}`,
                }}>
                {n}
              </button>
            ))}
          </div>
          {Object.keys(session.ratings || {}).length > 0 && (
            <p className="text-xs mt-1.5" style={{ color: "var(--text-hint)" }}>
              {Object.keys(session.ratings).length} rating{Object.keys(session.ratings).length !== 1 ? "s" : ""} · Avg: {avgRating || "–"}/10
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function GroupReactionTab({ group, user, isMember }) {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ["groupReactions", group.id],
    queryFn: () => base44.entities.GroupReaction.filter({ group_id: group.id }, "-created_date", 20),
  });

  return (
    <div className="pb-28">
      {isMember && user && (
        <div className="px-4 mt-3 mb-3">
          <button onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #db2777, #7c3aed)", boxShadow: "0 4px 16px rgba(219,39,119,0.3)" }}>
            <Film className="w-4 h-4" /> Start Watch Session
          </button>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="py-12 text-center px-8">
          <div className="text-5xl mb-3">🎬</div>
          <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No watch sessions yet</p>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Share a video and react together!</p>
        </div>
      ) : (
        sessions.map(s => <ReactionSessionCard key={s.id} session={s} user={user} />)
      )}

      <AnimatePresence>
        {showCreate && (
          <StartReactionModal group={group} user={user} onClose={() => setShowCreate(false)}
            onCreated={() => qc.invalidateQueries({ queryKey: ["groupReactions", group.id] })} />
        )}
      </AnimatePresence>
    </div>
  );
}