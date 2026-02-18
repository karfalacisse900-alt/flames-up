import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Star, Flag, MapPin, Send } from "lucide-react";
import StarRating from "./StarRating";

const platformColors = {
  Fiverr: { bg: "#e8f7f0", text: "#1dbf73" },
  Upwork: { bg: "#e8f0ff", text: "#14a800" },
  Independent: { bg: "#f5f2e8", text: "#6e6e6e" },
  Coach: { bg: "#fdf3ed", text: "#d98b62" },
  Other: { bg: "#f5f2e8", text: "#6e6e6e" },
};

function ReviewItem({ review, currentUserEmail, onReport }) {
  const displayName = review.is_anonymous ? "Anonymous" : review.reviewer_name || "User";
  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: "var(--border-light)" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)" }}>
            {displayName[0]?.toUpperCase()}
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3 h-3" fill={i < review.rating ? "#F59E0B" : "none"} stroke={i < review.rating ? "#F59E0B" : "#D1D5DB"} />
            ))}
          </div>
          {currentUserEmail && currentUserEmail !== review.reviewer_email && (
            <button onClick={() => onReport(review.id)} className="p-1 rounded-full hover:bg-red-50 transition-colors" title="Report">
              <Flag className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
            </button>
          )}
        </div>
      </div>
      {review.review_text && (
        <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-serif)" }}>{review.review_text}</p>
      )}
      <p className="text-[10px] mt-1" style={{ color: "var(--text-hint)" }}>{new Date(review.created_date).toLocaleDateString()}</p>
    </div>
  );
}

export default function ServicePersonModal({ person, user, onClose }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ["spreviews", person.id],
    queryFn: () => base44.entities.ServicePersonReview.filter({ service_person_id: person.id }, "-created_date"),
  });

  const myReview = reviews.find(r => r.reviewer_email === user?.email);

  const handleSubmit = async () => {
    if (!rating || !user) return;
    setSubmitting(true);
    if (myReview) {
      await base44.entities.ServicePersonReview.update(myReview.id, { rating, review_text: reviewText, is_anonymous: isAnon });
    } else {
      await base44.entities.ServicePersonReview.create({
        service_person_id: person.id,
        reviewer_email: user.email,
        reviewer_name: user.display_name || user.full_name,
        rating, review_text: reviewText, is_anonymous: isAnon,
      });
    }
    // Update aggregate on ServicePerson
    const allRevs = myReview
      ? reviews.map(r => r.id === myReview.id ? { ...r, rating } : r)
      : [...reviews, { rating }];
    const avg = allRevs.reduce((s, r) => s + r.rating, 0) / allRevs.length;
    await base44.entities.ServicePerson.update(person.id, { avg_rating: Math.round(avg * 10) / 10, review_count: allRevs.length });
    qc.invalidateQueries({ queryKey: ["spreviews", person.id] });
    qc.invalidateQueries({ queryKey: ["servicepeople"] });
    setShowReviewForm(false);
    setSubmitting(false);
  };

  const handleReport = async (reviewId) => {
    await base44.entities.Report.create({ content_type: "reply", content_id: reviewId, reason: "Reported review", reporter_email: user?.email });
  };

  const plt = platformColors[person.platform] || platformColors.Other;
  const initials = person.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (myReview) { setRating(myReview.rating); setReviewText(myReview.review_text || ""); setIsAnon(myReview.is_anonymous || false); }
  }, [myReview?.id]);

  const links = [
    person.fiverr_url && { label: "Fiverr", url: person.fiverr_url, color: "#1dbf73" },
    person.upwork_url && { label: "Upwork", url: person.upwork_url, color: "#14a800" },
    person.website_url && { label: "Website", url: person.website_url, color: "var(--accent-primary)" },
    person.instagram_url && { label: "Instagram", url: person.instagram_url, color: "#E1306C" },
    person.twitter_url && { label: "Twitter/X", url: person.twitter_url, color: "#1DA1F2" },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="mt-auto max-h-[92vh] overflow-y-auto rounded-t-3xl"
        style={{ backgroundColor: "var(--bg-app)" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="sticky top-0 z-10 pt-3 pb-2 flex justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
        </div>

        <div className="px-5 pb-10 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center text-2xl font-bold"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--accent-primary)" }}>
              {person.image_url ? <img src={person.image_url} alt={person.name} className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{person.name}</h2>
              <p className="text-sm font-medium mt-0.5" style={{ color: "var(--accent-primary)" }}>{person.headline}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: plt.bg, color: plt.text }}>{person.platform}</span>
                {person.location && <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--text-hint)" }}><MapPin className="w-3 h-3" />{person.location}</span>}
              </div>
              <StarRating value={person.avg_rating || 0} showCount count={person.review_count || 0} />
            </div>
            <button onClick={onClose} className="p-2 rounded-full shrink-0" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-hint)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          {(person.short_description || person.long_description) && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-serif)" }}>
                {person.long_description || person.short_description}
              </p>
            </div>
          )}

          {/* Skills */}
          {person.skills?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-hint)" }}>Skills</p>
              <div className="flex flex-wrap gap-2">
                {person.skills.map(s => (
                  <span key={s} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "var(--bg-card)", color: "var(--accent-primary)", border: "1px solid rgba(60,110,90,0.25)" }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing + Links */}
          <div className="space-y-3">
            {person.starting_price && (
              <div className="flex items-center justify-between p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Starting price</span>
                <span className="text-sm font-bold text-amber-600">{person.starting_price}</span>
              </div>
            )}
            {links.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {links.map(l => (
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: l.color }}>
                    {l.label} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Reviews section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                Reviews {reviews.length > 0 && <span className="text-sm font-normal" style={{ color: "var(--text-hint)" }}>({reviews.length})</span>}
              </h3>
              {user && (
                <button
                  onClick={() => setShowReviewForm(f => !f)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ backgroundColor: showReviewForm ? "var(--bg-app)" : "var(--accent-primary)", color: showReviewForm ? "var(--text-secondary)" : "#fff", border: "1px solid var(--border-light)" }}>
                  {myReview ? "Edit Review" : "Write Review"}
                </button>
              )}
            </div>

            {/* Review form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="mb-4 rounded-2xl p-4 overflow-hidden"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Your rating</p>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i}
                        onMouseEnter={() => setHoverRating(i + 1)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(i + 1)}>
                        <Star className="w-7 h-7 transition-colors"
                          fill={(hoverRating || rating) > i ? "#F59E0B" : "none"}
                          stroke={(hoverRating || rating) > i ? "#F59E0B" : "#D1D5DB"} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your experience (optional)..."
                    rows={3}
                    className="w-full text-sm px-3 py-2 rounded-xl resize-none outline-none"
                    style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)", color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                      <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} className="rounded" />
                      Post anonymously
                    </label>
                    <button
                      onClick={handleSubmit}
                      disabled={!rating || submitting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: "var(--accent-primary)" }}>
                      <Send className="w-3 h-3" /> {submitting ? "Saving…" : myReview ? "Update" : "Submit"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-hint)" }}>No reviews yet. Be the first!</p>
            ) : (
              <div className="rounded-2xl px-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                {reviews.map(r => (
                  <ReviewItem key={r.id} review={r} currentUserEmail={user?.email} onReport={handleReport} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}