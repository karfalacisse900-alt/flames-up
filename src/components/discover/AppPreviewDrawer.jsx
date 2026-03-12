import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Star, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";
import BookmarkButton from "./BookmarkButton";

const CATEGORY_GRADIENTS = {
  productivity:    ["#6366f1", "#8b5cf6"],
  finance:         ["#10b981", "#059669"],
  learning:        ["#f59e0b", "#d97706"],
  lifestyle:       ["#34d399", "#10b981"],
  entertainment:   ["#f43f5e", "#e11d48"],
  health:          ["#06b6d4", "#0891b2"],
  social:          ["#8b5cf6", "#7c3aed"],
  developer_tools: ["#374151", "#1f2937"],
  general:         ["#2E6B4F", "#1a4230"],
};

function getGradient(cat) {
  const g = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

const PLATFORM_ICONS = {
  iOS: "🍎", Android: "🤖", Web: "🌐", Mac: "💻", Windows: "🖥️", Linux: "🐧"
};

function getKeyFeatures(item) {
  const features = [];
  if (item.tags?.length) item.tags.slice(0, 3).forEach(t => features.push(t));
  if (item.platforms?.length) features.push(`Available on ${item.platforms.slice(0, 3).join(", ")}`);
  if (item.pricing) features.push(item.pricing === "Free" ? "100% Free" : item.pricing);
  if (features.length < 3 && item.long_description) {
    features.push(item.long_description.split(" ").slice(0, 6).join(" ") + "...");
  }
  return features.slice(0, 4);
}

function DrawerContent({ item, user, onClose, onFullOpen }) {
  const features = getKeyFeatures(item);

  // Lock body scroll while drawer is open — always restore on unmount
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, []);

  // Close drawer on back-navigation / page change
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 flex flex-col justify-end"
      style={{ zIndex: 9999, backgroundColor: "#D1FAE5" }}
    >
      {/* Backdrop — click to close */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0"
        style={{ backgroundColor: "#D1FAE5" }}
      />

      {/* Drawer sheet */}
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        className="relative rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "85dvh", zIndex: 1 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)", zIndex: 2 }}
        >
          <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>

        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(85dvh - 48px)" }}>
          {/* Header band */}
          <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative" style={{ height: 140, background: getGradient(item.category) }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.12)", filter: "blur(30px)" }} />
            <div className="absolute bottom-4 left-4 flex items-end gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)" }}>
                <DiscoverLogo item={item} size="lg" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg leading-tight">{item.title}</h2>
                {item.brand_name && <p className="text-white/70 text-xs">{item.brand_name}</p>}
              </div>
            </div>
            <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
              {item.is_featured && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white">🔥 HOT</span>}
              {item.is_new && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white">✨ NEW</span>}
            </div>
          </div>

          <div className="px-4 pb-8">
            {/* Rating + pricing */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {(item.avg_rating || 0) > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3 h-3 ${s <= Math.round(item.avg_rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                  ))}
                  <span className="text-xs font-bold ml-1" style={{ color: "var(--text-primary)" }}>{item.avg_rating.toFixed(1)}</span>
                  {item.review_count > 0 && <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>({item.review_count})</span>}
                </div>
              )}
              {item.pricing && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{
                  backgroundColor: item.pricing === "Free" ? "#d1fae5" : "var(--bg-subtle)",
                  color: item.pricing === "Free" ? "#059669" : "var(--text-secondary)"
                }}>
                  {item.pricing === "Free" ? "🆓 Free" : item.pricing}
                </span>
              )}
              {item.platforms?.slice(0, 3).map((p, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                  {PLATFORM_ICONS[p] || "📱"} {p}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{item.description}</p>

            {/* Why you'll love it */}
            {features.length > 0 && (
              <div className="mb-4 p-3.5 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <p className="text-xs font-bold mb-2.5 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <Zap className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
                  Why you'll love it
                </p>
                <div className="space-y-1.5">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                      <span className="text-xs capitalize" style={{ color: "var(--text-secondary)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promo */}
            {item.promo && (
              <div className="mb-4 p-3 rounded-2xl flex items-center gap-2" style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a" }}>
                <span className="text-base">🎁</span>
                <p className="text-xs font-semibold text-amber-800">{item.promo}</p>
              </div>
            )}

            {/* Tags */}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {item.tags.slice(0, 6).map((tag, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA row */}
            <div className="flex gap-2.5">
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white"
                  style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(46,107,79,0.3)" }}
                >
                  <ExternalLink className="w-4 h-4" />
                  {item.pricing === "Free" ? "Try for Free" : "Open App"}
                </a>
              )}
              {user && (
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                  <BookmarkButton user={user} itemType="app" itemId={item.id} itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} compact />
                </div>
              )}
              <button
                onClick={onFullOpen}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl font-semibold text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
              >
                More <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// Wrapper: AnimatePresence lives here, parent just passes item (null = closed)
export default function AppPreviewDrawer({ item, user, onClose, onFullOpen }) {
  return (
    <AnimatePresence>
      {item && (
        <DrawerContent
          key={item.id}
          item={item}
          user={user}
          onClose={onClose}
          onFullOpen={onFullOpen}
        />
      )}
    </AnimatePresence>
  );
}