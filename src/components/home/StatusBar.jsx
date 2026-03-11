import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PostStatusModal from "./PostStatusModal";
import { createPageUrl } from "@/utils";

const COLORS = ["#7C3AED", "#DB2777", "#EA580C", "#059669", "#0284C7", "#D97706"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (u) => u?.full_name || u?.email?.split("@")[0] || "User";
const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "✨", "😮", "😢", "🙏"];

function StatusViewer({ status, user, onClose, onNext, onPrev, allStatuses }) {
  const [reactions, setReactions] = useState(status.reactions || {});
  const [reactionCounts, setReactionCounts] = useState(status.reaction_counts || {});
  const [userReactions, setUserReactions] = useState({});

  useEffect(() => {
    // Mark as viewed
    if (user?.email && !status.viewed_by?.includes(user.email)) {
      base44.entities.CreatorStatus.update(status.id, {
        view_count: (status.view_count || 0) + 1,
        viewed_by: [...(status.viewed_by || []), user.email],
      }).catch(() => {});
    }
    
    // Update user reactions
    const userReacts = {};
    Object.entries(reactions).forEach(([emoji, users]) => {
      if (users?.includes(user?.email)) userReacts[emoji] = true;
    });
    setUserReactions(userReacts);
  }, [status.id, reactions, user?.email]);

  const handleReact = async (emoji) => {
    if (!user?.email) return;
    
    const newReactions = { ...reactions };
    const newCounts = { ...reactionCounts };
    
    if (userReactions[emoji]) {
      newReactions[emoji] = (newReactions[emoji] || []).filter(e => e !== user.email);
      if (newReactions[emoji].length === 0) delete newReactions[emoji];
      newCounts[emoji] = Math.max(0, (newCounts[emoji] || 0) - 1);
      if (newCounts[emoji] === 0) delete newCounts[emoji];
    } else {
      newReactions[emoji] = [...(newReactions[emoji] || []), user.email];
      newCounts[emoji] = (newCounts[emoji] || 0) + 1;
    }

    setReactions(newReactions);
    setReactionCounts(newCounts);
    setUserReactions({ ...userReactions, [emoji]: !userReactions[emoji] });

    await base44.entities.CreatorStatus.update(status.id, {
      reactions: newReactions,
      reaction_counts: newCounts,
    }).catch(() => {});
  };

  const bg = status.image_url
    ? `url(${status.image_url})`
    : (status.background || "linear-gradient(135deg, #7C3AED, #4F46E5)");

  const bgStyle = status.image_url
    ? { backgroundImage: bg, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: bg };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col" style={{ ...bgStyle, maxWidth: 480, margin: "0 auto" }}>
      {status.image_url && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} />}

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-6 pb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
          style={{ backgroundColor: avatarColor(status.author_email), color: "#fff" }}>
          {(status.author_name || "U")[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">{status.author_name || status.author_email}</p>
          <p className="text-white/60 text-[11px]">
            {status.group_name ? `📍 ${status.group_name} · ` : ""}
            {Math.floor((Date.now() - new Date(status.created_date).getTime()) / 3600000)}h ago
          </p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Navigation zones */}
      <div className="relative z-10 flex-1 flex">
        <div className="w-1/3 h-full" onClick={onPrev} />
        <div className="w-2/3 h-full" onClick={onNext} />
      </div>

      {/* Text & Video */}
      <div className="relative z-10 px-6 pb-3">
        {status.video_url && (
          <video src={status.video_url} autoPlay muted loop playsInline
            className="w-full h-32 object-cover rounded-2xl mb-3" />
        )}
        <p className="text-white text-2xl font-bold leading-snug"
          style={{ fontFamily: "var(--font-serif)", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
          {status.text}
        </p>
      </div>

      {/* Reaction bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5">
          {REACTION_EMOJIS.map(emoji => {
            const count = reactionCounts[emoji] || 0;
            const isReacted = userReactions[emoji];
            return (
              <button key={emoji} onClick={() => handleReact(emoji)}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold shrink-0 transition-all"
                style={{
                  backgroundColor: isReacted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: `1px solid ${isReacted ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)"}`,
                }}>
                <span>{emoji}</span>
                {count > 0 && <span className="text-[10px]">{count}</span>}
              </button>
            );
          })}
        </div>
        {allStatuses.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onPrev} className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button onClick={onNext} className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function StatusBar({ user }) {
  const qc = useQueryClient();
  const [viewIndex, setViewIndex] = useState(null); // index in statuses array
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

  // Check if current user is a group admin (can post group status)
  const [groupAdminOf, setGroupAdminOf] = useState(null);
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.GroupMember.filter({ user_email: user.email, role: "admin" }, "-created_date", 1)
      .then(res => { if (res.length > 0) setGroupAdminOf(res[0]); })
      .catch(() => {});
  }, [user?.email]);

  const canPost = isCreator || !!groupAdminOf;

  if (statuses.length === 0 && !canPost) return null;

  const activeViewer = viewIndex !== null ? statuses[viewIndex] : null;

  return (
    <>
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {/* Add status button for eligible users */}
          {canPost && (
            <button onClick={() => setShowPost(true)}
              className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-14 h-14 rounded-full flex items-center justify-center relative"
                style={{ border: "2.5px dashed var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                <Plus className="w-6 h-6" style={{ color: "var(--accent-primary)" }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                Add Status
              </span>
            </button>
          )}

          {/* Status circles */}
          {statuses.map((s, i) => {
            const isViewed = s.viewed_by?.includes(user?.email);
            const initials = (s.author_name || "U")[0]?.toUpperCase();
            return (
              <button key={s.id} onClick={() => setViewIndex(i)}
                className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="w-14 h-14 rounded-full p-0.5"
                  style={{ background: isViewed ? "var(--border-medium)" : (s.background || "linear-gradient(135deg, #7C3AED, #DB2777)") }}>
                  <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-lg"
                    style={{ backgroundColor: avatarColor(s.author_email), color: "#fff", border: "2px solid var(--bg-app)" }}>
                    {initials}
                  </div>
                </div>
                <span className="text-[11px] font-semibold max-w-[56px] truncate text-center"
                  style={{ color: "var(--text-secondary)" }}>
                  {s.group_name || s.author_name?.split(" ")[0] || "User"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {activeViewer && (
          <>
            {(() => { window.dispatchEvent(new CustomEvent("statusviewermode", { detail: { active: true } })); return null; })()}
            <StatusViewer
              status={activeViewer}
              user={user}
              allStatuses={statuses}
              onClose={() => { setViewIndex(null); window.dispatchEvent(new CustomEvent("statusviewermode", { detail: { active: false } })); }}
              onNext={() => setViewIndex(i => i < statuses.length - 1 ? i + 1 : i)}
              onPrev={() => setViewIndex(i => i > 0 ? i - 1 : i)}
            />
          </>
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