import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Star, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function GroupReviews({ groupId, user }) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const qc = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ["groupReviews", groupId],
    queryFn: () => base44.entities.DiscoverPostReply?.filter?.({ post_id: groupId }) || [],
  });

  const createReview = useMutation({
    mutationFn: (reviewData) =>
      base44.entities.DiscoverPostReply?.create?.(reviewData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupReviews", groupId] });
      setShowForm(false);
      setRating(5);
      setText("");
    },
  });

  const handleSubmit = () => {
    if (!text.trim() || !user) return;
    createReview.mutate({
      post_id: groupId,
      author_email: user.email,
      author_name: user.full_name || user.email,
      body: `${rating} stars: ${text}`,
    });
  };

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          Reviews & Feedback
        </h3>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <Plus className="w-3 h-3" /> Add Review
          </button>
        )}
      </div>

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
            className="mb-4"
          >
            <div className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
              {/* Rating stars */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Rating:
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="text-lg cursor-pointer transition-transform hover:scale-110"
                    >
                      {star <= rating ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review text */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share your experience with this group…"
                className="w-full p-2 rounded-xl text-xs mb-3"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-primary)",
                  minHeight: 60,
                }}
              />

              {/* Submit */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || createReview.isPending}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                >
                  {createReview.isPending ? "Posting…" : "Post Review"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: "var(--text-hint)" }}>
            No reviews yet. Be the first to share!
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="p-3 rounded-2xl"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                  {review.author_name}
                </p>
              </div>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {review.body}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}