import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ExternalLink, ThumbsUp, Send, Globe, Smartphone, Monitor, Bookmark, BookmarkCheck, Share2, Twitter, Link2, Check } from "lucide-react";
import ItemFeedback from "./ItemFeedback";
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

export default function DiscoverItemModal({ item, user, onClose, onOpenRelated, allItems = [] }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const qc = useQueryClient();

  const shareUrl = item.link || window.location.href;
  const shareText = `Check out ${item.title}${item.brand_name ? ` by ${item.brand_name}` : ""} — ${item.description || ""}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: item.title, text: shareText, url: shareUrl });
    }
  };

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", item.id],
    queryFn: () => base44.entities.DiscoverReview.filter({ item_id: item.id }, "-created_date", 50),
  });

  // Saved items
  const { data: savedItems = [] } = useQuery({
    queryKey: ["savedItems", user?.email],
    queryFn: () => base44.entities.SavedItem.filter({ user_email: user?.email }, "-created_date", 200),
    enabled: !!user?.email,
  });

  const isSaved = savedItems.some(s => s.item_id === item.id);

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        const record = savedItems.find(s => s.item_id === item.id);
        await base44.entities.SavedItem.delete(record.id);
      } else {
        await base44.entities.SavedItem.create({
          user_email: user.email,
          item_id: item.id,
          item_title: item.title,
          item_category: item.category,
          item_logo_url: item.logo_url || "",
          item_description: item.description || "",
        });
      }
    },
    onSuccess: () => qc.invalidateQueries(["savedItems", user?.email]),
  });

  // Related items: same category, exclude current
  const relatedItems = allItems
    .filter(i => i.id !== item.id && i.category === item.category)
    .slice(0, 4);

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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
      onTouchMove={e => e.stopPropagation()}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{ backgroundColor: "#FFFFFF", boxShadow: "0 -4px 40px rgba(0,0,0,0.18)", maxHeight: "90dvh" }}
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
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={() => toggleSave.mutate()}
                className="p-2 rounded-full transition-colors"
                style={{ backgroundColor: isSaved ? "rgba(60,110,90,0.1)" : "var(--bg-app)" }}
                title={isSaved ? "Unsave" : "Save"}
              >
                {isSaved
                  ? <BookmarkCheck className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  : <Bookmark className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                }
              </button>
            )}
            <button
              onClick={() => setShowShare(s => !s)}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: showShare ? "rgba(60,110,90,0.1)" : "var(--bg-app)" }}
            >
              <Share2 className="w-4 h-4" style={{ color: showShare ? "var(--accent-primary)" : "var(--text-secondary)" }} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-app)" }}>
              <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>

        {/* Share Panel */}
        {showShare && (
          <div className="px-5 py-3 border-b" style={{ backgroundColor: "#F9F6F2", borderColor: "#E5DFD0" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-hint)" }}>Share this tool</p>
            <div className="flex gap-2 flex-wrap">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: "#1DA1F2" }}
              >
                <Twitter className="w-3 h-3" /> Twitter / X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: "#1877F2" }}
              >
                <span className="font-bold text-xs">f</span> Facebook
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: "#0A66C2" }}
              >
                <span className="font-bold text-xs">in</span> LinkedIn
              </a>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={{ backgroundColor: copied ? "rgba(60,110,90,0.08)" : "var(--bg-card)", borderColor: copied ? "var(--accent-primary)" : "var(--border-medium)", color: copied ? "var(--accent-primary)" : "var(--text-secondary)" }}
              >
                {copied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy link"}
              </button>
              {typeof navigator.share === "function" && (
                <button
                  onClick={handleNativeShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}
                >
                  <Share2 className="w-3 h-3" /> More
                </button>
              )}
            </div>
          </div>
        )}

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
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>About</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", lineHeight: "1.75" }}>
              {item.long_description || item.description || "No description available."}
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

          {/* Feedback */}
          <ItemFeedback item={item} user={user} />

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

          {/* Related Items */}
          {relatedItems.length > 0 && (
            <div>
              <div style={{ borderTop: "1px solid var(--border-light)" }} className="mb-4" />
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Related Tools</h3>
              <div className="space-y-2">
                {relatedItems.map(rel => (
                  <button
                    key={rel.id}
                    onClick={() => onOpenRelated && onOpenRelated(rel)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                    style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}
                    data-related-id={rel.id}
                  >
                    <DiscoverLogo item={rel} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{rel.title}</p>
                      <p className="text-[11px] truncate" style={{ color: "var(--text-hint)" }}>{rel.description}</p>
                    </div>
                    <StarRating value={rel.avg_rating || 0} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}