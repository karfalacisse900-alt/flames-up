import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TopSupportersTicker({ supporters = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (supporters.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % supporters.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [supporters.length]);

  if (!supporters || supporters.length === 0) return null;

  const current = supporters[index];

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
    >
      <span className="text-xs shrink-0" style={{ color: "var(--accent-secondary)" }}>★ Top Supporters</span>
      <div className="w-px h-3 shrink-0" style={{ backgroundColor: "var(--border-light)" }} />
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1.5 min-w-0"
        >
          <span className="text-[10px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {current?.name || "Anonymous"}
          </span>
          <span className="text-[10px] shrink-0" style={{ color: "var(--text-secondary)" }}>
            ⬡{current?.total_coins || 0}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}