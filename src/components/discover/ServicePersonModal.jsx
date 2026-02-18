import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Star, Flag, MapPin, Send, Plus, Image, Link2, Trash2, Upload, Lock, MessageSquare } from "lucide-react";
import BookmarkButton from "./BookmarkButton";
import { createPageUrl } from "../../utils";
import StarRating from "./StarRating";

const platformColors = {
  Fiverr: { bg: "#d4f5e4", text: "#0f8a50" },
  Upwork: { bg: "#d8ebff", text: "#0a6c0a" },
  Independent: { bg: "#ede9e0", text: "#5a5a5a" },
  Coach: { bg: "#fce8d5", text: "#b06020" },
  Other: { bg: "#ede9e0", text: "#5a5a5a" },
};

function ReviewItem({ review, currentUserEmail, onReport }) {
  const displayName = review.is_anonymous ? "Anonymous" : review.reviewer_name || "User";
  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: "#E5DFD0" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: "#EEF3F0", color: "#3C6E5A" }}>
            {displayName[0]?.toUpperCase()}
          </div>
          <span className="text-xs font-medium" style={{ color: "#2F2F2F" }}>{displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3 h-3" fill={i < review.rating ? "#F59E0B" : "none"} stroke={i < review.rating ? "#F59E0B" : "#D1D5DB"} />
            ))}
          </div>
          {currentUserEmail && currentUserEmail !== review.reviewer_email && (
            <button onClick={() => onReport(review.id)} className="p-1 rounded-full hover:bg-red-50 transition-colors" title="Report">
              <Flag className="w-3 h-3" style={{ color: "#A8A8A8" }} />
            </button>
          )}
        </div>
      </div>
      {review.review_text && (
        <p className="text-xs leading-relaxed mt-1" style={{ color: "#6E6E6E", fontFamily: "var(--font-serif)" }}>{review.review_text}</p>
      )}
      <p className="text-[10px] mt-1" style={{ color: "#A8A8A8" }}>{new Date(review.created_date).toLocaleDateString()}</p>
    </div>
  );
}

function PortfolioItem({ item, canDelete, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
      {item.type === "image" && item.media_url && (
        <img src={item.media_url} alt={item.title} className="w-full aspect-video object-cover" />
      )}
      {item.type === "video" && item.media_url && (
        <video src={item.media_url} className="w-full aspect-video object-cover" controls />
      )}
      {item.type === "link" && (
        <div className="aspect-video flex flex-col items-center justify-center gap-2" style={{ backgroundColor: "#EEF3F0" }}>
          {item.thumbnail_url
            ? <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
            : <Link2 className="w-8 h-8" style={{ color: "#3C6E5A" }} />
          }
        </div>
      )}
      <div className="p-3">
        <p className="text-xs font-semibold" style={{ color: "#2F2F2F" }}>{item.title}</p>
        {item.description && <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#6E6E6E" }}>{item.description}</p>}
        {item.external_url && (
          <a href={item.external_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 mt-2 text-[11px] font-medium"
            style={{ color: "#3C6E5A" }}>
            <ExternalLink className="w-3 h-3" /> View Project
          </a>
        )}
      </div>
      {canDelete && (
        <button
          onClick={async () => { setDeleting(true); await base44.entities.ServicePersonPortfolio.delete(item.id); onDelete(item.id); setDeleting(false); }}
          disabled={deleting}
          className="absolute top-2 right-2 p-1.5 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}>
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function AddPortfolioForm({ personId, ownerEmail, onAdded }) {
  const [type, setType] = useState("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setMediaUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!title) return;
    setSaving(true);
    const item = await base44.entities.ServicePersonPortfolio.create({
      service_person_id: personId,
      owner_email: ownerEmail,
      title, description, type,
      media_url: mediaUrl || undefined,
      external_url: externalUrl || undefined,
      is_premium: true,
    });
    onAdded(item);
    setTitle(""); setDescription(""); setExternalUrl(""); setMediaUrl("");
    setSaving(false);
  };

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
      <p className="text-xs font-semibold" style={{ color: "#2F2F2F" }}>Add Portfolio Item</p>
      {/* Type */}
      <div className="flex gap-2">
        {[["image","🖼 Image"],["video","🎬 Video"],["link","🔗 Link"]].map(([val, label]) => (
          <button key={val} onClick={() => setType(val)}
            className="flex-1 py-1.5 rounded-xl text-xs font-medium border transition-colors"
            style={{ backgroundColor: type === val ? "#3C6E5A" : "#fff", color: type === val ? "#fff" : "#6E6E6E", borderColor: type === val ? "#3C6E5A" : "#E5DFD0" }}>
            {label}
          </button>
        ))}
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Project title *"
        className="w-full text-sm px-3 py-2 rounded-xl outline-none" style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }} />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional)" rows={2}
        className="w-full text-sm px-3 py-2 rounded-xl outline-none resize-none" style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F", fontFamily: "var(--font-serif)" }} />
      {(type === "image" || type === "video") && (
        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border border-dashed text-xs"
          style={{ borderColor: "#3C6E5A", color: "#3C6E5A", backgroundColor: "#EEF3F0" }}>
          <Upload className="w-4 h-4" />
          <input type="file" accept={type === "image" ? "image/*" : "video/*"} className="hidden" onChange={handleUpload} />
          {uploading ? "Uploading…" : mediaUrl ? "✓ File uploaded" : `Upload ${type}`}
        </label>
      )}
      <input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="External URL (Behance, Dribbble, YouTube…)"
        className="w-full text-sm px-3 py-2 rounded-xl outline-none" style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }} />
      <button onClick={handleSave} disabled={!title || saving}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: "#3C6E5A" }}>
        {saving ? "Saving…" : "Add to Portfolio"}
      </button>
    </div>
  );
}

export default function ServicePersonModal({ person, user, onClose }) {
  const [activeTab, setActiveTab] = useState("about");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const qc = useQueryClient();

  const isOwner = user?.email === person.created_by;

  const { data: reviews = [] } = useQuery({
    queryKey: ["spreviews", person.id],
    queryFn: () => base44.entities.ServicePersonReview.filter({ service_person_id: person.id }, "-created_date"),
  });

  const { data: portfolio = [], isLoading: pfLoading } = useQuery({
    queryKey: ["spportfolio", person.id],
    queryFn: () => base44.entities.ServicePersonPortfolio.filter({ service_person_id: person.id }, "-created_date"),
  });

  useEffect(() => { setPortfolioItems(portfolio); }, [portfolio]);

  const myReview = reviews.find(r => r.reviewer_email === user?.email);

  useEffect(() => {
    if (myReview) { setRating(myReview.rating); setReviewText(myReview.review_text || ""); setIsAnon(myReview.is_anonymous || false); }
  }, [myReview?.id]);

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
    const allRevs = myReview ? reviews.map(r => r.id === myReview.id ? { ...r, rating } : r) : [...reviews, { rating }];
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

  const links = [
    person.fiverr_url && { label: "Fiverr", url: person.fiverr_url, color: "#1dbf73", emoji: "🟢" },
    person.upwork_url && { label: "Upwork", url: person.upwork_url, color: "#14a800", emoji: "🟩" },
    person.website_url && { label: "Website", url: person.website_url, color: "#3C6E5A", emoji: "🌐" },
    person.instagram_url && { label: "Instagram", url: person.instagram_url, color: "#E1306C", emoji: "📸" },
    person.twitter_url && { label: "Twitter/X", url: person.twitter_url, color: "#1DA1F2", emoji: "🐦" },
    person.tiktok_url && { label: "TikTok", url: person.tiktok_url, color: "#010101", emoji: "🎵" },
    person.youtube_url && { label: "YouTube", url: person.youtube_url, color: "#FF0000", emoji: "▶️" },
    person.shopify_url && { label: "Shopify", url: person.shopify_url, color: "#96bf48", emoji: "🛒" },
    person.linkedin_url && { label: "LinkedIn", url: person.linkedin_url, color: "#0077B5", emoji: "💼" },
    person.github_url && { label: "GitHub", url: person.github_url, color: "#333", emoji: "💻" },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.65)" }} onClick={onClose}>
      <div className="mt-auto max-h-[93vh] overflow-y-auto rounded-t-3xl"
        style={{ backgroundColor: "#F5F2E8" }}
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="sticky top-0 z-10 pt-3 pb-2 flex justify-center" style={{ backgroundColor: "#F5F2E8" }}>
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#DAD3C4" }} />
        </div>

        <div className="px-5 pb-10 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center text-2xl font-bold"
              style={{ backgroundColor: "#EEF3F0", color: "#3C6E5A", border: "2px solid #E5DFD0" }}>
              {person.image_url ? <img src={person.image_url} alt={person.name} className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "#2F2F2F" }}>{person.name}</h2>
              <p className="text-sm font-medium mt-0.5" style={{ color: "#3C6E5A" }}>{person.headline}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: plt.bg, color: plt.text }}>{person.platform}</span>
                {person.location && <span className="text-xs flex items-center gap-0.5" style={{ color: "#A8A8A8" }}><MapPin className="w-3 h-3" />{person.location}</span>}
              </div>
              <StarRating value={person.avg_rating || 0} showCount count={person.review_count || 0} />
              {/* Message + Bookmark row */}
              <div className="flex items-center gap-2 mt-2">
                {user && user.email !== person.created_by && (
                  <a href={createPageUrl(`Messages?with=${encodeURIComponent(person.created_by || person.name)}&name=${encodeURIComponent(person.name)}`)}
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                    style={{ backgroundColor: "#3C6E5A" }}>
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </a>
                )}
                {user && (
                  <BookmarkButton user={user} itemType="service_person" itemId={person.id}
                    itemTitle={person.name} itemSubtitle={person.headline} itemImageUrl={person.image_url} size="sm" />
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full shrink-0" style={{ backgroundColor: "#EDE9E3", color: "#6E6E6E" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#EDE9E3" }}>
            {[["about","About"], ["portfolio","Portfolio"], ["reviews","Reviews"]].map(([val, label]) => (
              <button key={val} onClick={() => setActiveTab(val)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: activeTab === val ? "#fff" : "transparent",
                  color: activeTab === val ? "#3C6E5A" : "#A8A8A8",
                  boxShadow: activeTab === val ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>
                {label} {val === "reviews" && reviews.length > 0 ? `(${reviews.length})` : ""}
              </button>
            ))}
          </div>

          {/* ===== ABOUT TAB ===== */}
          {activeTab === "about" && (
            <div className="space-y-4">
              {(person.short_description || person.long_description) && (
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "#6E6E6E", fontFamily: "var(--font-serif)" }}>
                    {person.long_description || person.short_description}
                  </p>
                </div>
              )}
              {person.skills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A8A8A8" }}>Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {person.skills.map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "#EEF3F0", color: "#3C6E5A", border: "1px solid rgba(60,110,90,0.25)" }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {person.starting_price && (
                <div className="flex items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
                  <span className="text-sm font-medium" style={{ color: "#6E6E6E" }}>Starting price</span>
                  <span className="text-base font-bold text-amber-600">{person.starting_price}</span>
                </div>
              )}
              {links.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A8A8A8" }}>Links & Socials</p>
                  <div className="flex flex-wrap gap-2">
                    {links.map(l => (
                      <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
                        style={{ backgroundColor: l.color }}>
                        <span>{l.emoji}</span> {l.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== PORTFOLIO TAB ===== */}
          {activeTab === "portfolio" && (
            <div className="space-y-4">
              {/* Premium badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#FDF3ED", border: "1px solid #F5D5B8" }}>
                <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: "#D98B62" }} />
                <p className="text-xs" style={{ color: "#B06020" }}>Portfolio is a <span className="font-semibold">Premium</span> feature for service providers</p>
              </div>

              {isOwner && (
                <button onClick={() => setShowAddPortfolio(f => !f)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed transition-colors"
                  style={{ borderColor: "#3C6E5A", color: "#3C6E5A", backgroundColor: showAddPortfolio ? "#EEF3F0" : "transparent" }}>
                  <Plus className="w-4 h-4" /> {showAddPortfolio ? "Cancel" : "Add Portfolio Item"}
                </button>
              )}

              {isOwner && showAddPortfolio && (
                <AddPortfolioForm
                  personId={person.id}
                  ownerEmail={user?.email}
                  onAdded={(item) => { setPortfolioItems(prev => [item, ...prev]); setShowAddPortfolio(false); }}
                />
              )}

              {pfLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3C6E5A", borderTopColor: "transparent" }} />
                </div>
              ) : portfolioItems.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-10 h-10 mx-auto mb-3" style={{ color: "#DAD3C4" }} />
                  <p className="text-sm font-medium" style={{ color: "#6E6E6E" }}>No portfolio items yet</p>
                  <p className="text-xs mt-1" style={{ color: "#A8A8A8" }}>{isOwner ? "Add your first piece of work above" : "This creator hasn't added work samples yet"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {portfolioItems.map(item => (
                    <PortfolioItem key={item.id} item={item} canDelete={isOwner}
                      onDelete={id => setPortfolioItems(prev => prev.filter(p => p.id !== id))} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== REVIEWS TAB ===== */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              {user && (
                <button
                  onClick={() => setShowReviewForm(f => !f)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: showReviewForm ? "#EDE9E3" : "#3C6E5A", color: showReviewForm ? "#6E6E6E" : "#fff" }}>
                  {myReview ? "Edit My Review" : "Write a Review"}
                </button>
              )}

              <AnimatePresence>
                {showReviewForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl p-4 overflow-hidden space-y-3"
                    style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
                    <p className="text-xs font-semibold" style={{ color: "#2F2F2F" }}>Your rating</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} onMouseEnter={() => setHoverRating(i + 1)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(i + 1)}>
                          <Star className="w-8 h-8 transition-colors"
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
                      style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F", fontFamily: "var(--font-serif)" }}
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#6E6E6E" }}>
                        <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} className="rounded" />
                        Post anonymously
                      </label>
                      <button onClick={handleSubmit} disabled={!rating || submitting}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: "#3C6E5A" }}>
                        <Send className="w-3 h-3" /> {submitting ? "Saving…" : myReview ? "Update" : "Submit"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star className="w-10 h-10 mx-auto mb-3" style={{ color: "#DAD3C4" }} />
                  <p className="text-sm font-medium" style={{ color: "#6E6E6E" }}>No reviews yet</p>
                  <p className="text-xs mt-1" style={{ color: "#A8A8A8" }}>Be the first to leave a review!</p>
                </div>
              ) : (
                <div className="rounded-2xl px-4" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
                  {reviews.map(r => (
                    <ReviewItem key={r.id} review={r} currentUserEmail={user?.email} onReport={handleReport} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}