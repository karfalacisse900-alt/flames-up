import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show with a short delay for a smooth entrance
    const showTimer = setTimeout(() => setVisible(true), 800);
    // Auto-hide after 7 seconds if not dismissed
    const hideTimer = setTimeout(() => setVisible(false), 7800);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-40px)] max-w-sm"
          style={{ pointerEvents: "auto" }}
        >
          <div
            className="relative rounded-2xl px-5 py-4"
            style={{
              background: "linear-gradient(135deg, #E6EFEA 0%, #d4e8dc 100%)",
              border: "1px solid rgba(36,61,51,0.13)",
              boxShadow: "0 8px 32px rgba(36,61,51,0.18), 0 2px 8px rgba(36,61,51,0.10)",
            }}
          >
            {/* Decorative dot */}
            <div className="absolute top-4 left-4 w-2 h-2 rounded-full" style={{ backgroundColor: "#BF9E79", opacity: 0.8 }} />

            {/* Close button */}
            <button
              onClick={() => setVisible(false)}
              className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ backgroundColor: "rgba(36,61,51,0.1)", color: "#243D33" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Content */}
            <div className="pl-5">
              <p
                className="text-base leading-snug font-semibold"
                style={{ color: "#243D33", fontFamily: "var(--font-serif)" }}
              >
                Here, we listen.
              </p>
              <p
                className="text-base leading-snug font-semibold"
                style={{ color: "#243D33", fontFamily: "var(--font-serif)" }}
              >
                We don't judge.
              </p>
              <p
                className="text-sm mt-1.5 leading-relaxed"
                style={{ color: "#3C6449", fontFamily: "var(--font-sans)" }}
              >
                Explore freely. ✦
              </p>
            </div>

            {/* Bottom accent bar */}
            <div
              className="absolute bottom-0 left-5 right-5 h-0.5 rounded-full"
              style={{ background: "linear-gradient(90deg, #BF9E79, transparent)" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}