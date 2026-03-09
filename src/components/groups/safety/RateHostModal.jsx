import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function RateHostModal({ event, user, onClose }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const qc = useQueryClient();

  const handleSubmit = async () => {
    if (!rating) return;
    setSaving(true);
    await base44.entities.HostReview.create({
      event_id: event.id,
      event_title: event.title,
      group_id: event.group_id,
      host_email: event.creator_email,
      host_name: event.creator_name,
      reviewer_email: user.email,
      reviewer_name: user.full_name || user.email,
      rating,
      review_text: reviewText.trim() || undefined,
    });

    // Update host's aggregate rating on User entity
    const reviews = await base44.entities.HostReview.filter({ host_email: event.creator_email });
    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;

    // Update current host's user record
    const hostUsers = await base44.entities.User.filter({ email: event.creator_email });
    if (hostUsers.length > 0) {
      await base44.entities.User.update(hostUsers[0].id, {
        host_avg_rating: Math.round(avgRating * 10) / 10,
        host_review_count: totalReviews,
      });
    }

    qc.invalidateQueries({ queryKey: ["hostReviews"] });
    setSaving(false);
    setDone(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 py-5 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              Rate the Experience
            </h2>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          {done ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🌟</div>
              <h3 className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                Thanks for your review!
              </h3>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                Your feedback helps keep the community safe and trustworthy.
              </p>
              <button onClick={onClose}
                className="px-8 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  How was <strong>{event.creator_name || "the host"}</strong>'s event?
                </p>
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>"{event.title}"</p>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(i)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      className="w-10 h-10"
                      style={{
                        color: "#D97706",
                        fill: i <= (hovered || rating) ? "#D97706" : "none",
                        transition: "fill 0.1s ease",
                      }}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {["", "Not great 😕", "Could be better 🙂", "It was okay 👍", "Great event! 🎉", "Amazing! 🌟"][rating]}
                </p>
              )}

              {/* Review text */}
              <textarea
                value={reviewText} onChange={e => setReviewText(e.target.value)}
                placeholder="Share your experience (optional)"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              />

              <button onClick={handleSubmit} disabled={!rating || saving}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-95"
                style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(46,107,79,0.3)" }}>
                {saving ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}