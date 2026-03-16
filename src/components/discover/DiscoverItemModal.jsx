import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ExternalLink, ThumbsUp, Send, Globe, Smartphone, Monitor, Bookmark, BookmarkCheck, Share2, Twitter, Link2, Check, Star, Zap, Users, Crown } from "lucide-react";
import ItemFeedback from "./ItemFeedback";
import { Textarea } from "@/components/ui/textarea";
import DiscoverLogo from "./DiscoverLogo";
import StarRating from "./StarRating";

const CAT_GRADIENTS = {
  productivity: { from: "#667EEA", to: "#764BA2", emoji: "⚡", label: "Productivity" },
  finance: { from: "#11998E", to: "#38EF7D", emoji: "💰", label: "Finance" },
  learning: { from: "#F093FB", to: "#F5576C", emoji: "📚", label: "Learning" },
  lifestyle: { from: "#4FACFE", to: "#00F2FE", emoji: "✨", label: "Lifestyle" },
  entertainment: { from: "#FA709A", to: "#FEE140", emoji: "🎬", label: "Entertainment" },
  health: { from: "#43E97B", to: "#38F9D7", emoji: "💪", label: "Health" },
  social: { from: "#F7971E", to: "#FFD200", emoji: "💬", label: "Social" },
  developer_tools: { from: "#30CFD0", to: "#330867", emoji: "🛠", label: "Dev Tools" },
};

const platformIcon = (p) => {
  if (p === "Web") return <Globe className="w-3 h-3" />;
  if (p === "iOS" || p === "Android") return <Smartphone className="w-3 h-3" />;
  return <Monitor className="w-3 h-3" />;
};

export default function DiscoverItemModal({ item, user, onClose, onOpenRelated, allItems = [] }) {
  // Robust scroll lock — always restores on unmount
  useEffect(() => {
    const prev = document.body.style.overflow;
    const prevPos = document.body.style.position;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.body.style.position = prevPos;
    };
  }, []);

  // Close on browser back / route change
  useEffect(() => {
    const handlePopState = () => onClose();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onClose]);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const qc = useQueryClient();

  const cat = CAT_GRADIENTS[item.category] || { from: "#2E6B4F", to: "#4CAF7D", emoji: "🔧", label: item.category };
  const shareUrl = item.link || window.location.href;
  const shareText = `Check out ${item.title} — ${item.description || ""}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", item.id],
    queryFn: () => base44.entities.DiscoverReview.filter({ item_id: item.id }, "-created_date", 50),
  });

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
          user_email: user.email, item_id: item.id, item_title: item.title,
          item_category: item.category, item_logo_url: item.logo_url || "",
          item_description: item.description || "",
        });
      }
    },
    onSuccess: () => qc.invalidateQueries(["savedItems", user?.email]),
  });

  const relatedItems = allItems.filter(i => i.id !== item.id && i.category === item.category).slice(0, 4);
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
      setRating(0); setReviewText("");
    },
  });

  const markHelpful = useMutation({
    mutationFn: async (review) => {
      if (review.helpful_by?.includes(user?.email)) return;
      await base44.entities.DiscoverReview.update(review.id, {
        helpful_count: (review.helpful_count || 0) + 1,
        helpful_by: [...(review.helpful_by || []), user?.email],
      });
    },
    onSuccess: () => qc.invalidateQueries(["reviews", item.id]),
  });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 9999, touchAction: "none" }}
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
        style={{ boxShadow: "0 -8px 60px rgba(0,0,0,0.25)", maxHeight: "92dvh", backgroundColor: "var(--bg-card)" }}
        onMouseDown={e => e.stopPropagation()}
      >

        {/* Hero gradient header */}
        <div className="shrink-0 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})`, paddingTop: 20, paddingBottom: 24, paddingLeft: 20, paddingRight: 20 }}>
          {/* Close & actions */}
          <div className="flex justify-between items-start mb-4">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">{cat.emoji} {cat.label}</span>
            <div className="flex gap-2">
              {user && (
                <button onClick={() => toggleSave.mutate()} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  {isSaved ? <BookmarkCheck className="w-4 h-4 text-white" /> : <Bookmark className="w-4 h-4 text-white" />}
                </button>
              )}
              <button onClick={() => setShowShare(s => !s)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <Share2 className="w-4 h-4 text-white" />
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* App identity */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-xl" style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
              <DiscoverLogo item={item} size="lg" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white leading-tight">{item.title}</h2>
              {item.brand_name && <p className="text-white/70 text-sm">{item.brand_name}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(item.avg_rating || 0) ? "fill-yellow-300 text-yellow-300" : "text-white/30"}`} />
                  ))}
                </div>
                {item.review_count > 0 && <span className="text-white/60 text-xs">({item.review_count})</span>}
                {item.pricing && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }}>{item.pricing}</span>}
              </div>
            </div>
          </div>

          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white, transparent)" }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-15" style={{ background: "radial-gradient(circle, white, transparent)" }} />
        </div>

        {/* Share panel */}
        {showShare && (
          <div className="shrink-0 px-5 py-3 flex gap-2 flex-wrap" style={{ backgroundColor: "#F0F4F8", borderBottom: "1px solid #E2E8F0" }}>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#1DA1F2" }}>
              <Twitter className="w-3 h-3" /> Twitter
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#1877F2" }}>
              Facebook
            </a>
            <button onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{ backgroundColor: copied ? "#ECFDF5" : "#fff", borderColor: copied ? "#22C55E" : "#E2E8F0", color: copied ? "#16A34A" : "#64748B" }}>
              {copied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pt-4 pb-8 space-y-5">

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Star className="w-4 h-4" />, label: "Rating", value: item.avg_rating ? `${item.avg_rating}/5` : "New", color: "#F59E0B" },
                { icon: <Users className="w-4 h-4" />, label: "Reviews", value: item.review_count || 0, color: cat.from },
                { icon: <Zap className="w-4 h-4" />, label: "Type", value: item.pricing || "Free", color: cat.to },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                  <p className="text-xs font-bold" style={{ color: "#1E293B" }}>{stat.value}</p>
                  <p className="text-[10px]" style={{ color: "#94A3B8" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Tags & platforms */}
            <div className="flex flex-wrap gap-2">
              {item.platforms?.map(p => (
                <span key={p} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
                  {platformIcon(p)} {p}
                </span>
              ))}
              {item.tags?.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `linear-gradient(135deg, ${cat.from}20, ${cat.to}20)`, color: cat.from, border: `1px solid ${cat.from}30` }}>
                  #{tag}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${cat.from}08, ${cat.to}08)`, border: `1px solid ${cat.from}20` }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: "#1E293B" }}>About</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#475569", lineHeight: "1.75" }}>
                {item.long_description || item.description || "No description available."}
              </p>
            </div>

            {/* Promo */}
            {item.promo && (
              <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", border: "1px solid #A7F3D0" }}>
                <Crown className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-green-800 mb-0.5">Special Offer</p>
                  <p className="text-sm font-semibold text-green-700">{item.promo}</p>
                </div>
              </div>
            )}

            {/* CTA */}
            {item.link && (
              <a href={item.link} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-98"
                style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})`, boxShadow: `0 4px 20px ${cat.from}40` }}>
                Visit {item.brand_name || item.title} <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Feedback */}
            <ItemFeedback item={item} user={user} />

            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #E2E8F0, transparent)" }} />



            {/* Related */}
            {relatedItems.length > 0 && (
              <div>
                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #E2E8F0, transparent)" }} className="mb-4" />
                <h3 className="text-sm font-bold mb-3" style={{ color: "#1E293B" }}>Related Tools</h3>
                <div className="space-y-2">
                  {relatedItems.map(rel => (
                    <button key={rel.id} onClick={() => onOpenRelated?.(rel)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-99"
                      style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                      <DiscoverLogo item={rel} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#1E293B" }}>{rel.title}</p>
                        <p className="text-[11px] truncate" style={{ color: "#94A3B8" }}>{rel.description}</p>
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
    </div>,
    document.body
  );
}