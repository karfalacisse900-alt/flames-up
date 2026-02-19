import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown, MessageSquarePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ItemFeedback({ item, user }) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["feedback", item.id, user?.email],
    queryFn: () => base44.entities.DiscoverFeedback.filter({ item_id: item.id, user_email: user.email }),
    enabled: !!user?.email,
  });

  const existing = feedbacks[0];
  const currentVote = existing?.vote;

  const handleVote = async (vote) => {
    if (!user) return;
    setSaving(true);
    if (existing) {
      if (existing.vote === vote) {
        await base44.entities.DiscoverFeedback.delete(existing.id);
      } else {
        await base44.entities.DiscoverFeedback.update(existing.id, { vote, comment: existing.comment || "" });
      }
    } else {
      await base44.entities.DiscoverFeedback.create({
        user_email: user.email,
        item_id: item.id,
        item_title: item.title,
        item_category: item.category,
        vote,
        comment: "",
      });
    }
    qc.invalidateQueries({ queryKey: ["feedback", item.id, user?.email] });
    setSaving(false);
  };

  const handleSaveComment = async () => {
    if (!existing || !comment.trim()) return;
    setSaving(true);
    await base44.entities.DiscoverFeedback.update(existing.id, { comment: comment.trim() });
    qc.invalidateQueries({ queryKey: ["feedback", item.id, user?.email] });
    setShowComment(false);
    setComment("");
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-hint)" }}>Was this recommendation helpful?</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleVote("up")}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
          style={{
            backgroundColor: currentVote === "up" ? "rgba(111,143,114,0.15)" : "var(--bg-card)",
            borderColor: currentVote === "up" ? "var(--accent-primary)" : "var(--border-medium)",
            color: currentVote === "up" ? "var(--accent-primary)" : "var(--text-secondary)",
          }}
        >
          <ThumbsUp className="w-3.5 h-3.5" /> Yes
        </button>
        <button
          onClick={() => handleVote("down")}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
          style={{
            backgroundColor: currentVote === "down" ? "rgba(184,107,75,0.12)" : "var(--bg-card)",
            borderColor: currentVote === "down" ? "#B86B4B" : "var(--border-medium)",
            color: currentVote === "down" ? "#B86B4B" : "var(--text-secondary)",
          }}
        >
          <ThumbsDown className="w-3.5 h-3.5" /> No
        </button>
        {existing && (
          <button
            onClick={() => setShowComment(f => !f)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs transition-all"
            style={{ color: "var(--text-hint)" }}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            {existing.comment ? "Edit note" : "Add note"}
          </button>
        )}
      </div>
      {existing?.comment && !showComment && (
        <p className="text-xs mt-2 italic" style={{ color: "var(--text-hint)" }}>"{existing.comment}"</p>
      )}
      <AnimatePresence>
        {showComment && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Brief comment (optional)..."
              rows={2}
              className="w-full text-xs px-3 py-2 rounded-xl resize-none outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-medium)", color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}
            />
            <div className="flex gap-2 mt-1.5">
              <button onClick={handleSaveComment} disabled={saving || !comment.trim()}
                className="px-3 py-1 rounded-full text-xs font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                Save
              </button>
              <button onClick={() => setShowComment(false)} className="px-3 py-1 rounded-full text-xs" style={{ color: "var(--text-hint)" }}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}