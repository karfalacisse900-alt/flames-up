import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "✨", "😮", "😢", "🙏"];

export default function StatusViewer({ status, onClose, allStatuses = [] }) {
  const [reactions, setReactions] = useState(status.reactions || {});
  const [reactionCounts, setReactionCounts] = useState(status.reaction_counts || {});
  const [userReactions, setUserReactions] = useState({});
  const [userEmail, setUserEmail] = useState("");
  const [currentIndex, setCurrentIndex] = useState(allStatuses.findIndex(s => s.id === status.id));

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.email) {
        setUserEmail(u.email);
        // Determine which reactions current user has added
        const userReacts = {};
        Object.entries(reactions).forEach(([emoji, users]) => {
          if (users?.includes(u.email)) userReacts[emoji] = true;
        });
        setUserReactions(userReacts);
      }
    }).catch(() => {});
  }, [reactions]);

  const currentStatus = allStatuses[currentIndex] || status;

  const handleReact = async (emoji) => {
    if (!userEmail) return;
    
    const newReactions = { ...reactions };
    const newCounts = { ...reactionCounts };
    
    if (userReactions[emoji]) {
      // Remove reaction
      newReactions[emoji] = (newReactions[emoji] || []).filter(e => e !== userEmail);
      if (newReactions[emoji].length === 0) delete newReactions[emoji];
      newCounts[emoji] = Math.max(0, (newCounts[emoji] || 0) - 1);
      if (newCounts[emoji] === 0) delete newCounts[emoji];
    } else {
      // Add reaction
      newReactions[emoji] = [...(newReactions[emoji] || []), userEmail];
      newCounts[emoji] = (newCounts[emoji] || 0) + 1;
    }

    setReactions(newReactions);
    setReactionCounts(newCounts);
    setUserReactions({ ...userReactions, [emoji]: !userReactions[emoji] });

    // Update backend
    await base44.entities.CreatorStatus.update(currentStatus.id, {
      reactions: newReactions,
      reaction_counts: newCounts,
    });
  };

  const goToPrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
    if (currentIndex < allStatuses.length - 1) setCurrentIndex(currentIndex + 1);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}>
      
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm mx-auto rounded-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        
        {/* Status content */}
        <div className="relative w-full aspect-[9/16] flex flex-col items-center justify-center"
          style={{
            background: currentStatus.background,
            backgroundImage: currentStatus.image_url ? `url(${currentStatus.image_url})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}>
          
          {currentStatus.video_url && (
            <video src={currentStatus.video_url} autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover" />
          )}

          {(currentStatus.image_url || currentStatus.video_url) && (
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
          )}

          {/* Close button */}
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Group name badge */}
          {currentStatus.group_name && (
            <span className="absolute top-4 left-4 text-xs font-bold text-white/90 z-10 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
              📍 {currentStatus.group_name}
            </span>
          )}

          {/* Status text (centered) */}
          <p className="relative z-10 text-white text-2xl font-bold text-center px-6 max-w-[90%]"
            style={{ fontFamily: "var(--font-serif)", textShadow: "0 3px 12px rgba(0,0,0,0.5)" }}>
            {currentStatus.text}
          </p>

          {/* Author info */}
          <div className="absolute bottom-16 left-4 right-4 z-10">
            <p className="text-xs text-white/70">
              {currentStatus.author_name || currentStatus.author_email?.split("@")[0] || "User"}
            </p>
          </div>
        </div>

        {/* Reaction bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-3"
          style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
            {REACTION_EMOJIS.map(emoji => {
              const count = reactionCounts[emoji] || 0;
              const isReacted = userReactions[emoji];
              return (
                <button key={emoji} onClick={() => handleReact(emoji)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-full text-sm font-semibold shrink-0 transition-all"
                  style={{
                    backgroundColor: isReacted ? "var(--accent-primary)" : "var(--bg-subtle)",
                    color: isReacted ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${isReacted ? "var(--accent-primary)" : "var(--border-light)"}`,
                  }}>
                  <span>{emoji}</span>
                  {count > 0 && <span className="text-xs">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Navigation arrows */}
          {allStatuses.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={goToPrevious} disabled={currentIndex === 0}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: currentIndex === 0 ? "var(--bg-subtle)" : "var(--bg-subtle)",
                  opacity: currentIndex === 0 ? 0.4 : 1,
                }}>
                <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
              <button onClick={goToNext} disabled={currentIndex === allStatuses.length - 1}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: currentIndex === allStatuses.length - 1 ? "var(--bg-subtle)" : "var(--bg-subtle)",
                  opacity: currentIndex === allStatuses.length - 1 ? 0.4 : 1,
                }}>
                <ChevronRight className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}