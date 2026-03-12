import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function UniqueStatusBadge({ balance }) {
  // Determine status based on balance
  const getStatus = () => {
    if (balance >= 3000) return { label: "Platinum", color: "#E8E8E8", icon: "👑", glow: "0 0 24px rgba(232,232,232,0.4)" };
    if (balance >= 1200) return { label: "Gold", color: "#FFD700", icon: "⭐", glow: "0 0 24px rgba(255,215,0,0.4)" };
    if (balance >= 500) return { label: "Silver", color: "#C0C0C0", icon: "💫", glow: "0 0 24px rgba(192,192,192,0.3)" };
    return { label: "Bronze", color: "#CD7F32", icon: "🔥", glow: "0 0 24px rgba(205,127,50,0.3)" };
  };

  const status = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm"
      style={{
        background: `linear-gradient(135deg, ${status.color}22, ${status.color}11)`,
        border: `2px solid ${status.color}`,
        boxShadow: status.glow,
        color: status.color,
        backdropFilter: "blur(12px)",
      }}
    >
      <span className="text-lg">{status.icon}</span>
      <span>{status.label} Member</span>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="ml-1"
      >
        <Sparkles className="w-3.5 h-3.5" />
      </motion.div>
    </motion.div>
  );
}