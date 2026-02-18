import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ExternalLink, ThumbsUp, Send, Globe, Smartphone, Monitor, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DiscoverLogo from "./DiscoverLogo";
import StarRating from "./StarRating";

const catColors = {
  productivity: "bg-[#EEF3F0] text-[#3C6E5A]",
  finance: "bg-[#EEF3F0] text-[#3C6E5A]",
  learning: "bg-[#EDF2F7] text-[#5579A6]",
  lifestyle: "bg-[#FDF3ED] text-[#D98B62]",
  entertainment: "bg-[#FDF3ED] text-[#D98B62]",
  health: "bg-[#EEF3F0] text-[#3C6E5A]",
  social: "bg-[#EDF2F7] text-[#5579A6]",
  developer_tools: "bg-[#F2F0EC] text-[#6E6E6E]",
};

const platformIcon = (p) => {
  if (p === "Web") return <Globe className="w-3 h-3" />;
  if (p === "iOS" || p === "Android") return <Smartphone className="w-3 h-3" />;
  return <Monitor className="w-3 h-3" />;
};

export default function DiscoverItemModal({ item, user, onClose }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [aiSummary, setAiSummary] = useState(item.long_description || item.description || "");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (item.long_description) { setAiSummary(item.long_description); return; }
    if (!item.description) return;
    setLoadingSummary(true);
    base44.integrations.Core.InvokeLLM({
      prompt: `Write a clear, friendly 2-3 sentence summary explaining what "${item.title}" (by ${item.brand_name || "unknown"}) does and who it's best for. Keep it simple and helpful. Based on: "${item.description}"`,
    }).then(res => {
      setAiSummary(typeof res === "string" ? res : item.description);
    }).finally(() => setLoadingSummary(false));
  }, [item.id]);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", item.id],
    queryFn: () => base44.entities.DiscoverReview.filter({ item_id: item.id }, "-created_date", 50),
  });

  const userReview = reviews.find(r => r.user_email === user?.email);

  const submitReview = useMutation({
    mutationFn: async (data) => {
      const r = await base44.entities.DiscoverReview.create(data);
      const allReviews = [...reviews.filter(x => x.user_email !== user?.email), r];
      const avg = allReviews.reduce((s, x) => s + x.rating, 0) / allReviews.length;
      await base44.entities.DiscoverItem.update(item.id, { avg_rating: Math.round(avg * 10) / 10, review_count: allReviews.length });
      return r;
    },
    onSuccess: () => {
      qc.invalidateQueries(["reviews", item.id]);
      qc.invalidateQueries(["discover"]);
      setRating(0);
      setReviewText("");
    },
  });

  const markHelpful = useMutation({
    mutationFn: async (review) => {
      const already = review.helpful_by?.includes(user?.email);
      if (already) return;
      await base44.entities.DiscoverReview.update(review.id, {
        helpful_count: (review.helpful_count || 0) + 1,
        helpful_by: [...(review.helpful_by || []), user?.email],
      });
    },
    onSuccess: () => qc.invalidateQueries(["reviews", item.id]),
  });

  const handleSubmit = () => {
    if (!rating) return;
    submitReview.mutate({
      item_id: item.id,
      user_email: user?.email,
      user_name: user?.full_name || "Anonymous",
      rating,
      review_text: reviewText,
      helpful_count: 0,
      helpful_by: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ backgroundColor: "rgba(0,0,0,0.65)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{ backgroundColor: "#FFFFFF", boxShadow: "0 -4px 40px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 pt-5 pb-3 flex items-start justify-between" style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5DFD0" }}>
          <div className="flex items-center gap-3">
            <DiscoverLogo item={item} size="md" />
            <div>
              <h2 className="font-semibold text-lg leading-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{item.title}</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{item.brand_name}</p>
              <StarRating value={item.avg_rating || 0} showCount count={item.review_count || 0} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-app)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5 mt-4" style={{ backgroundColor: "#FFFFFF" }}>
          {/* Tags row */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full ${catColors[item.category] || "bg-gray-100 text-gray-600"}`}>
              {item.category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            {item.pricing && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{item.pricing}</span>
            )}
            {item.tags?.map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                {tag}
              </span>
            ))}
          </div>

          {/* Platforms */}
          {item.platforms?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-400">Available on:</span>
              {item.platforms.map(p => (
                <span key={p} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  {platformIcon(p)} {p}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold mb-1.5 text-gray-800">About</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {item.long_description || item.description}
            </p>
          </div>

          {/* Promo */}
          {item.promo && (
            <div className="p-3 rounded-2xl bg-green-50 border border-green-200">
              <p className="text-sm font-medium text-green-700">🎁 {item.promo}</p>
            </div>
          )}

          {/* CTA */}
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-medium transition-colors"
              style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
              Visit {item.brand_name || item.title} <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border-light)" }} />

          {/* Reviews */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Reviews ({reviews.length})
            </h3>

            {/* Write review */}
            {user && !userReview && (
              <div className="p-4 rounded-2xl mb-4 bg-gray-50 border border-gray-200">
                <p className="text-xs font-medium mb-2 text-gray-600">Rate & Review</p>
                <StarRating value={rating} onRate={setRating} size="lg" />
                <Textarea
                  className="mt-3 text-sm resize-none bg-white border-gray-200"
                  placeholder="Share your experience... (optional)"
                  rows={3}
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                />
                <Button
                  size="sm"
                  className="mt-2 gap-1.5"
                  onClick={handleSubmit}
                  disabled={!rating || submitReview.isPending}
                  style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
                >
                  <Send className="w-3.5 h-3.5" /> Submit Review
                </Button>
              </div>
            )}

            {userReview && (
              <div className="p-3 rounded-2xl mb-3" style={{ backgroundColor: "rgba(60,110,90,0.06)", border: "1px solid rgba(60,110,90,0.2)" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--accent-primary)" }}>✓ You reviewed this</p>
                <StarRating value={userReview.rating} size="sm" />
                {userReview.review_text && <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{userReview.review_text}</p>}
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-3">
              {reviews.filter(r => r.user_email !== user?.email).map(review => (
                <div key={review.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-medium text-gray-800">{review.user_name || "Anonymous"}</span>
                      <StarRating value={review.rating} size="sm" />
                    </div>
                    <button
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors"
                      style={{ color: review.helpful_by?.includes(user?.email) ? "var(--accent-primary)" : "var(--text-hint)", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                      onClick={() => markHelpful.mutate(review)}
                    >
                      <ThumbsUp className="w-3 h-3" /> {review.helpful_count || 0}
                    </button>
                  </div>
                  {review.review_text && (
                    <p className="text-xs leading-relaxed mt-1 text-gray-600">{review.review_text}</p>
                  )}
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: "var(--text-hint)" }}>No reviews yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}