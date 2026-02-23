import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addCoins } from "../coins/coinsHelper";

const BOOST_OPTIONS = [
  { label: "6 Hours", hours: 6, cost: 20 },
  { label: "24 Hours", hours: 24, cost: 50 },
  { label: "3 Days", hours: 72, cost: 120 },
];

export default function BoostPostModal({ post, user, balance, onClose, onBoosted }) {
  const [selected, setSelected] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const option = BOOST_OPTIONS[selected];
  const canAfford = balance >= option.cost;

  const handleBoost = async () => {
    if (!canAfford) { setError("Not enough coins!"); return; }
    setLoading(true);
    const expiresAt = new Date(Date.now() + option.hours * 3600 * 1000).toISOString();
    await base44.entities.Post.update(post.id, { is_boosted: true, boost_expires_at: expiresAt });
    await addCoins(user.email, -option.cost, "boost_post", `Boosted post for ${option.label}`, post.id);
    onBoosted?.();
    onClose();
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} onTouchMove={e => e.stopPropagation()} />
        <motion.div
          className="relative w-full max-w-lg rounded-t-3xl p-6"
          style={{ backgroundColor: "var(--bg-nav)" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25 }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full" style={{ backgroundColor: "var(--bg-app)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Boost This Post</h3>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Pin it to the top + show a Boosted badge</p>
            </div>
          </div>

          {/* Balance */}
          <div className="mb-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Your balance: <span className="font-bold" style={{ color: "var(--accent-primary)" }}>{balance} ⬡</span>
          </div>

          {/* Options */}
          <div className="space-y-2 mb-5">
            {BOOST_OPTIONS.map((opt, i) => (
              <button
                key={i}
                onClick={() => { setSelected(i); setError(""); }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all"
                style={{
                  backgroundColor: selected === i ? "var(--bg-app)" : "transparent",
                  borderColor: selected === i ? "var(--accent-primary)" : "var(--border-light)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected === i ? "border-[var(--accent-primary)]" : "border-gray-300"}`}>
                    {selected === i && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--accent-primary)" }} />}
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{opt.label}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--accent-secondary)" }}>{opt.cost} ⬡</span>
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-rose-500 mb-3 text-center">{error}</p>}

          <button
            onClick={handleBoost}
            disabled={loading || !canAfford}
            className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: canAfford ? "#F59E0B" : "#D1D5DB", boxShadow: canAfford ? "0 4px 14px rgba(245,158,11,0.4)" : "none" }}
          >
            <Zap className="w-4 h-4" />
            {loading ? "Boosting..." : `Boost for ${option.cost} ⬡`}
          </button>
          {!canAfford && (
            <p className="text-center text-xs mt-2" style={{ color: "var(--text-hint)" }}>
              You need {option.cost - balance} more coins. Earn them in the Wallet!
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}