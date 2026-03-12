import React, { useState, useEffect, useRef, useMemo } from "react";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight, MessageCircle, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PostStatusModal from "./PostStatusModal";

const COLORS = ["#7C3AED", "#DB2777", "#EA580C", "#059669", "#0284C7", "#D97706"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "✨", "😮", "😢", "🙏"];

// ── Status Viewer (with reactions + comments) ──────────────
function StatusViewer({ status, user, onClose, onNext, onPrev, hasNext, hasPrev }) {
  const [reactions, setReactions] = useState(status.reactions || {});
  const [reactionCounts, setReactionCounts] = useState(status.reaction_counts || {});
  const [userReactions, setUserReactions] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(status.comments || []);
  const inputRef = useRef(null);

  useEffect(() => {
    setReactions(status.reactions || {});
    setReactionCounts(status.reaction_counts || {});
    setComments(status.comments || []);
    const userReacts = {};
    Object.entries(status.reactions || {}).forEach(([emoji, users]) => {
      if (users?.includes(user?.email)) userReacts[emoji] = true;
    });
    setUserReactions(userReacts);

    if (user?.email && !status.viewed_by?.includes(user.email)) {
      base44.entities.CreatorStatus.update(status.id, {
        view_count: (status.view_count || 0) + 1,
        viewed_by: [...(status.viewed_by || []), user.email],
      }).catch(() => {});
    }
  }, [status.id]);

  const handleReact = async (emoji) => {
    if (!user?.email) return;
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
    setUserReactions({ ...userReactions, [emoji]: !userReactions[emoji] });
    await base44.entities.CreatorStatus.update(status.id, { reactions: newReactions, reaction_counts: newCounts }).catch(() => {});
  };

  const handleComment = async () => {
    if (!commentText.trim() || !user?.email) return;
    const newComment = {
      author_email: user.email,
      author_name: user.full_name || user.email.split("@")[0],
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...comments, newComment];
    setComments(updated);
    setCommentText("");
    await base44.entities.CreatorStatus.update(status.id, { comments: updated }).catch(() => {});
  };

  const bgStyle = status.image_url
    ? { backgroundImage: `url(${status.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: status.background || "linear-gradient(135deg, #7C3AED, #4F46E5)" };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col" style={{ ...bgStyle, maxWidth: 480, margin: "0 auto" }}>
      {(status.image_url || status.video_url) && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />}
      {status.video_url && <video src={status.video_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />}

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-10 pb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
          style={{ backgroundColor: avatarColor(status.author_email), color: "#fff" }}>
          {(status.author_name || "U")[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">{status.author_name || status.author_email}</p>
          <p className="text-white/60 text-[11px]">
            {status.group_name ? `📍 ${status.group_name} · ` : ""}
            {Math.floor((Date.now() - new Date(status.created_date).getTime()) / 3600000)}h ago
            {status.view_count > 0 && ` · ${status.view_count} views`}
          </p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Tap nav zones */}
      <div className="relative z-10 flex-1 flex" onClick={(e) => { e.stopPropagation(); }}>
        <div className="w-1/3 h-full cursor-pointer" onClick={hasPrev ? onPrev : undefined} />
        <div className="flex-1 h-full" />
        <div className="w-1/3 h-full cursor-pointer" onClick={hasNext ? onNext : undefined} />
      </div>

      {/* Status text */}
      <div className="relative z-10 px-6 pb-2">
        <p className="text-white text-2xl font-bold leading-snug" style={{ fontFamily: "var(--font-serif)", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
          {status.text}
        </p>
      </div>

      {/* Reaction row */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 flex-1">
          {REACTION_EMOJIS.map(emoji => {
            const count = reactionCounts[emoji] || 0;
            const isReacted = userReactions[emoji];
            return (
              <button key={emoji} onClick={() => handleReact(emoji)}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold shrink-0 transition-all"
                style={{ backgroundColor: isReacted ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.14)", color: "#fff", border: `1px solid ${isReacted ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"}` }}>
                <span>{emoji}</span>
                {count > 0 && <span className="text-[10px]">{count}</span>}
              </button>
            );
          })}
        </div>
        {/* Comment toggle */}
        <button onClick={() => { setShowComments(v => !v); setTimeout(() => inputRef.current?.focus(), 100); }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
          style={{ backgroundColor: showComments ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.14)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
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
            {/* Comment list */}
            <div className="max-h-40 overflow-y-auto px-4 pt-3 pb-1">
              {comments.length === 0 ? (
                <p className="text-white/50 text-xs text-center py-3">No comments yet. Be first!</p>
              ) : (
                comments.slice(-10).map((c, i) => (
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
                ))
              )}
            </div>
            {/* Comment input */}
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

      {/* Nav arrows + safe bottom */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}>
        <button onClick={hasPrev ? onPrev : undefined} className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ backgroundColor: hasPrev ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)", opacity: hasPrev ? 1 : 0.3 }}>
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <span className="text-white/50 text-xs">swipe or tap</span>
        <button onClick={hasNext ? onNext : undefined} className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ backgroundColor: hasNext ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)", opacity: hasNext ? 1 : 0.3 }}>
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main StatusBar ─────────────────────────────────────────
export default function StatusBar({ user }) {
  const qc = useQueryClient();
  const [viewerGroup, setViewerGroup] = useState(null); // array of statuses for one author
  const [viewerIdx, setViewerIdx] = useState(0);
  const [showPost, setShowPost] = useState(false);

  const isCreator = user?.role === "creator" || user?.role === "admin";

  const { data: statuses = [] } = useQuery({
    queryKey: ["creatorStatuses"],
    queryFn: async () => {
      const all = await base44.entities.CreatorStatus.list("-created_date", 100);
      const now = new Date();
      return all.filter(s => !s.expires_at || new Date(s.expires_at) > now);
    },
    refetchInterval: 60000,
  });

  const [groupAdminOf, setGroupAdminOf] = useState(null);
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.GroupMember.filter({ user_email: user.email, role: "admin" }, "-created_date", 1)
      .then(res => { if (res.length > 0) setGroupAdminOf(res[0]); })
      .catch(() => {});
  }, [user?.email]);

  const canPost = isCreator || !!groupAdminOf;

  // Group statuses by author_email — one circle per user
  const authorGroups = useMemo(() => {
    const map = new Map();
    statuses.forEach(s => {
      if (!map.has(s.author_email)) map.set(s.author_email, []);
      map.get(s.author_email).push(s);
    });
    return Array.from(map.values()); // each is an array of statuses for one author
  }, [statuses]);

  if (authorGroups.length === 0 && !canPost) return null;

  const activeStatus = viewerGroup ? viewerGroup[viewerIdx] : null;
  const viewerActive = !!activeStatus;

  const openGroup = (group) => {
    setViewerGroup(group);
    setViewerIdx(0);
    window.dispatchEvent(new CustomEvent("statusviewermode", { detail: { active: true } }));
  };

  const closeViewer = () => {
    setViewerGroup(null);
    setViewerIdx(0);
    window.dispatchEvent(new CustomEvent("statusviewermode", { detail: { active: false } }));
  };

  const handleNext = () => {
    if (viewerIdx < viewerGroup.length - 1) {
      setViewerIdx(i => i + 1);
    } else {
      // Move to next author group
      const currGroupIdx = authorGroups.findIndex(g => g[0].author_email === viewerGroup[0].author_email);
      if (currGroupIdx < authorGroups.length - 1) {
        setViewerGroup(authorGroups[currGroupIdx + 1]);
        setViewerIdx(0);
      } else {
        closeViewer();
      }
    }
  };

  const handlePrev = () => {
    if (viewerIdx > 0) {
      setViewerIdx(i => i - 1);
    } else {
      const currGroupIdx = authorGroups.findIndex(g => g[0].author_email === viewerGroup[0].author_email);
      if (currGroupIdx > 0) {
        const prevGroup = authorGroups[currGroupIdx - 1];
        setViewerGroup(prevGroup);
        setViewerIdx(prevGroup.length - 1);
      }
    }
  };

  return (
    <>
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {canPost && (
            <button onClick={() => setShowPost(true)} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-14 h-14 rounded-full flex items-center justify-center relative"
                style={{ border: "2.5px dashed var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                <Plus className="w-6 h-6" style={{ color: "var(--accent-primary)" }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>Add Status</span>
            </button>
          )}

          {/* One circle per author */}
          {authorGroups.map((group) => {
            const latest = group[0];
            const allViewed = group.every(s => s.viewed_by?.includes(user?.email));
            const initials = (latest.author_name || "U")[0]?.toUpperCase();
            return (
              <button key={latest.author_email} onClick={() => openGroup(group)}
                className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-0.5"
                    style={{ background: allViewed ? "var(--border-medium)" : (latest.background || "linear-gradient(135deg, #7C3AED, #DB2777)") }}>
                    <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ backgroundColor: avatarColor(latest.author_email), color: "#fff", border: "2px solid var(--bg-app)" }}>
                      {initials}
                    </div>
                  </div>
                  {/* Count badge if multiple */}
                  {group.length > 1 && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: "var(--accent-primary)", border: "2px solid var(--bg-app)" }}>
                      {group.length}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-semibold max-w-[56px] truncate text-center"
                  style={{ color: "var(--text-secondary)" }}>
                  {latest.group_name || latest.author_name?.split(" ")[0] || "User"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {viewerActive && (
          <StatusViewer
            key={`${viewerGroup[0].author_email}-${viewerIdx}`}
            status={activeStatus}
            user={user}
            onClose={closeViewer}
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={viewerIdx < viewerGroup.length - 1 || authorGroups.findIndex(g => g[0].author_email === viewerGroup[0].author_email) < authorGroups.length - 1}
            hasPrev={viewerIdx > 0 || authorGroups.findIndex(g => g[0].author_email === viewerGroup[0].author_email) > 0}
          />
        )}
        {showPost && (
          <PostStatusModal
            user={user}
            groupId={groupAdminOf && !isCreator ? groupAdminOf.group_id : undefined}
            groupName={groupAdminOf && !isCreator ? groupAdminOf.group_name : undefined}
            onClose={() => setShowPost(false)}
            onPosted={() => qc.invalidateQueries({ queryKey: ["creatorStatuses"] })}
          />
        )}
      </AnimatePresence>
    </>
  );
}