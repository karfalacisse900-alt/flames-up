import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Star, Flame, Loader2 } from "lucide-react";

const BOOSTS = [
  { level: "24h",       label: "24-Hour Boost",       price: "$3",  cents: 300,  icon: Zap,   desc: "Higher feed ranking for a day", color: "#2E6B4F" },
  { level: "3day",      label: "3-Day Boost",          price: "$8",  cents: 800,  icon: Flame, desc: "Extended visibility for 3 days", color: "#D98B62" },
  { level: "spotlight", label: "Featured Spotlight",   price: "$20", cents: 2000, icon: Star,  desc: "Top section for 7 days", color: "#E05C7A" },
];

export default function BoostPostModal({ contentType, contentId, onClose }) {
  const [loading, setLoading] = useState(null);

  const handleBoost = async (boost) => {
    // Block inside iframe (e.g., Base44 preview)
    if (window.self !== window.top) {
      alert("Checkout only works from the published app, not from the preview.");
      return;
    }
    setLoading(boost.level);
    const res = await base44.functions.invoke("createBoostCheckout", {
      content_type: contentType,
      content_id: contentId,
      boost_level: boost.level,
    });
    setLoading(null);
    if (res.data?.url) {
      window.location.href = res.data.url;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="w-full max-w-lg rounded-t-3xl p-5 space-y-3"
        style={{ backgroundColor: "#FAFAF8" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-8 h-1 rounded-full mx-auto" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Boost Your Post</h3>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Get more eyes on your content</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>
        </div>

        {BOOSTS.map(b => {
          const Icon = b.icon;
          return (
            <button key={b.level} onClick={() => handleBoost(b)}
              disabled={!!loading}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all border disabled:opacity-50"
              style={{ backgroundColor: b.color + "0D", borderColor: b.color + "30" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: b.color }}>
                {loading === b.level ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Icon className="w-5 h-5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{b.label}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{b.desc}</p>
              </div>
              <span className="text-base font-black flex-shrink-0" style={{ color: b.color }}>{b.price}</span>
            </button>
          );
        })}

        <p className="text-[10px] text-center pb-1" style={{ color: "var(--text-hint)" }}>
          🔒 Secure payment via Stripe. Boosts increase visibility — not moderation immunity.
        </p>
      </motion.div>
    </motion.div>
  );
}