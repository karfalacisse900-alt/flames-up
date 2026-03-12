import React, { useState } from "react";
import { Star, MessageCircle, ThumbsUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function GroupReviewSection({ groupId, groupName, user, isMember }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ["groupReviews", groupId],
    queryFn: () => base44.entities.GroupReview.filter({ group_id: groupId }, "-created_date", 50),
  });

  const handleSubmit = async () => {
    if (!user || !rating) return;
    setSubmitting(true);
    try {
      await base44.entities.GroupReview.create({
        group_id: groupId,
        group_name: groupName,
        author_email: user.email,
        author_name: user.full_name || user.email,
        rating,
        title,
        body,
        is_verified_member: isMember,
      });
      qc.invalidateQueries({ queryKey: ["groupReviews", groupId] });
      setTitle("");
      setBody("");
      setRating(5);
      setShowReviewForm(false);
    } catch (err) {
      console.error("Error submitting review:", err);
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border-light)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Reviews</h3>
        {user && (
          <button onClick={() => setShowReviewForm(!showReviewForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            <MessageCircle className="w-3 h-3" /> Write
          </button>
        )}
      </div>

      {/* Rating summary */}
      {reviews.length > 0 && (
        <div className="mb-4 p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{avgRating}</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4" fill={i < Math.round(avgRating) ? "currentColor" : "none"} style={{ color: i < Math.round(avgRating) ? "#FFA500" : "var(--border-light)" }} />
              ))}
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        </div>
      )}

      {/* Review form */}
      {showReviewForm && user && (
        <div className="mb-4 p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="mb-2">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setRating(r)} className="p-1">
                  <Star className="w-5 h-5" fill={r <= rating ? "currentColor" : "none"} style={{ color: r <= rating ? "#FFA500" : "var(--border-light)" }} />
                </button>
              ))}
            </div>
          </div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Review title" className="w-full px-3 py-2 rounded-lg border text-xs mb-2" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }} />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Share your experience..." className="w-full px-3 py-2 rounded-lg border text-xs h-20 resize-none mb-2" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }} />
          <div className="flex gap-2">
            <button onClick={() => setShowReviewForm(false)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "var(--accent-primary)" }}>{submitting ? "..." : "Submit"}</button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-2">
        {reviews.map(review => (
          <div key={review.id} className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{review.author_name} {review.is_verified_member && <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-1" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>✓ Member</span>}</p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3" fill={i < review.rating ? "currentColor" : "none"} style={{ color: i < review.rating ? "#FFA500" : "var(--border-light)" }} />
                  ))}
                </div>
              </div>
            </div>
            {review.title && <p className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>{review.title}</p>}
            {review.body && <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>{review.body}</p>}
            <button className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-hint)" }}>
              <ThumbsUp className="w-2.5 h-2.5" /> {review.helpful_count || 0}
            </button>
          </div>
        ))}
      </div>

      {reviews.length === 0 && !showReviewForm && (
        <p className="text-xs text-center py-4" style={{ color: "var(--text-hint)" }}>No reviews yet. Be the first!</p>
      )}
    </div>
  );
}