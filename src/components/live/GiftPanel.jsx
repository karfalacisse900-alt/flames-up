import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const GIFTS = [
  { emoji: "🌹", label: "Rose", cost: 5 },
  { emoji: "☕", label: "Coffee", cost: 10 },
  { emoji: "💎", label: "Diamond", cost: 20 },
  { emoji: "🌙", label: "Moon", cost: 30 },
  { emoji: "👑", label: "Crown", cost: 50 },
  { emoji: "🔥", label: "Flame", cost: 15 },
];

export default function GiftPanel({ onSendGift, onReaction, userBalance }) {
  return (
    <div className="space-y-2">
      {/* Free reactions */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        <span className="text-[10px] shrink-0 font-medium" style={{ color: "var(--text-hint)" }}>React</span>
        {["❤️", "👍", "🔥", "😂", "🤔", "✨"].map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReaction(emoji)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 transition-all active:scale-90"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Paid gifts */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        <span className="text-[10px] shrink-0 font-medium" style={{ color: "var(--text-hint)" }}>Gift</span>
        {GIFTS.map(({ emoji, label, cost }) => {
          const canAfford = (userBalance || 0) >= cost;
          return (
            <button
              key={emoji}
              onClick={() => onSendGift(emoji, cost, label)}
              disabled={!canAfford}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl shrink-0 transition-all active:scale-90"
              style={{
                backgroundColor: canAfford ? "var(--bg-subtle)" : "var(--bg-app)",
                border: `1px solid ${canAfford ? "var(--accent-secondary)" : "var(--border-light)"}`,
                opacity: canAfford ? 1 : 0.45,
              }}
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-[9px] font-semibold" style={{ color: "var(--accent-secondary)" }}>⬡{cost}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}