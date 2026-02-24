import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ChevronDown } from "lucide-react";

export default function WhyTheseApps() {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-5 mb-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
        style={{
          backgroundColor: open ? "var(--accent-primary-light)" : "var(--bg-card)",
          borderColor: "var(--accent-primary)",
          color: "var(--accent-primary)",
          boxShadow: "0 1px 6px rgba(60,110,90,0.10)",
        }}
      >
        <Compass className="w-3.5 h-3.5" />
        {open ? "Hide" : "Why these apps?"}
        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className="mt-2 rounded-2xl p-4"
              style={{
                backgroundColor: "#FAF7F0",
                border: "1px solid #EDE9E3",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🧭</span>
                <p className="text-sm font-semibold" style={{ color: "#2F2F2F", fontFamily: "var(--font-serif)" }}>
                  Discover what you didn't know you needed.
                </p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#6B6B6B" }}>
                These apps are curated based on community activity and recommendations. Explore, try something new, and share your thoughts to help others discover great tools.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}