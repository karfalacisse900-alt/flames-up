import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import NowStatusComments from "./NowStatusComments";

const REACTIONS = ["🔥", "😂", "👏", "🤯", "💡"];

export default function NowStatusViewer({ status, currentUser, onClose, onRefresh }) {
  const [userReaction, setUserReaction] = useState(null);

  useEffect(() => {
    if (currentUser && status.reaction_users) {
      for (const [emoji, users] of Object.entries(status.reaction_users)) {
        if (users.includes(currentUser.email)) {
          setUserReaction(emoji);
          break;
        }
      }
    }
  }, [status, currentUser]);

  const handleReaction = async (emoji) => {
    if (!currentUser) return;

    const reactions = { ...status.reactions } || {};
    const reactionUsers = { ...status.reaction_users } || {};

    if (userReaction === emoji) {
      reactions[emoji] = (reactions[emoji] || 1) - 1;
      if (reactions[emoji] === 0) delete reactions[emoji];
      reactionUsers[emoji] = (reactionUsers[emoji] || []).filter(e => e !== currentUser.email);
      if (reactionUsers[emoji].length === 0) delete reactionUsers[emoji];
      setUserReaction(null);
    } else {
      if (userReaction) {
        reactions[userReaction] = (reactions[userReaction] || 1) - 1;
        reactionUsers[userReaction] = (reactionUsers[userReaction] || []).filter(e => e !== currentUser.email);
      }
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      reactionUsers[emoji] = [...(reactionUsers[emoji] || []), currentUser.email];
      setUserReaction(emoji);
    }

    await base44.entities.NowStatus.update(status.id, { reactions, reaction_users: reactionUsers });
    onRefresh();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(20, 38, 28, 0.78)", backdropFilter: "blur(12px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="w-full h-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Media */}
          {status.media_url && (
            <div className="flex-1 overflow-hidden bg-black">
              {status.content_type === "photo" ? (
                <img src={status.media_url} alt="" className="w-full h-full object-contain" />
              ) : (
                <video src={status.media_url} controls className="w-full h-full object-contain" />
              )}
            </div>
          )}

          {/* Info Panel */}
          <div className="p-5 space-y-5 bg-white" style={{ backgroundColor: "var(--bg-card)" }}>
            {/* Author */}
            <div className="flex items-center gap-3">
              <img src={status.author_avatar_url || "https://via.placeholder.com/48"}
                alt="" className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {status.author_name || "User"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                  {formatDistanceToNow(new Date(status.created_date), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Text Content */}
            {status.text && (
              <p style={{ color: "var(--text-primary)" }} className="text-sm leading-relaxed">
                {status.text}
              </p>
            )}

            {/* Location & Category */}
            <div className="flex flex-wrap gap-2">
              {status.location_name && (
                <span className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                  📍 {status.location_name}
                </span>
              )}
              <span className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                {status.category}
              </span>
            </div>

            {/* Reactions */}
            <div className="flex gap-2 flex-wrap">
              {REACTIONS.map(emoji => {
                const count = status.reactions?.[emoji] || 0;
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: userReaction === emoji ? "var(--accent-primary)" : "var(--bg-subtle)",
                      color: userReaction === emoji ? "white" : "var(--text-secondary)",
                      border: `1px solid ${userReaction === emoji ? "var(--accent-primary)" : "var(--border-light)"}`
                    }}
                  >
                    <span>{emoji}</span>
                    {count > 0 && count}
                  </button>
                );
              })}
            </div>

            {/* Comments Section */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border-light)" }}>
              <NowStatusComments
                statusId={status.id}
                currentUser={currentUser}
                onRefresh={onRefresh}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}