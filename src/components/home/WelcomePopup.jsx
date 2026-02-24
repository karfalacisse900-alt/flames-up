import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 800);
    const hideTimer = setTimeout(() => setVisible(false), 7800);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Full-screen touch dismiss overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onTouchStart={() => setVisible(false)}
            onClick={() => setVisible(false)}
          />

          {/* Centered popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-8"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="relative rounded-3xl px-8 py-8 text-center w-full max-w-xs"
              style={{
                background: "linear-gradient(145deg, #E6EFEA 0%, #dceee5 60%, #e8f0ea 100%)",
                border: "1px solid rgba(36,61,51,0.12)",
                boxShadow: "0 24px 60px rgba(36,61,51,0.22), 0 4px 16px rgba(36,61,51,0.10)",
                pointerEvents: "auto",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Decorative top accent */}
              <div className="flex justify-center gap-1.5 mb-5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#BF9E79" }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3C6E5A" }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#BF9E79" }} />
              </div>

              {/* Close button */}
              <button
                onClick={() => setVisible(false)}
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ backgroundColor: "rgba(36,61,51,0.1)", color: "#243D33" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Text */}
              <p
                className="text-xl leading-snug font-semibold mb-1"
                style={{ color: "#243D33", fontFamily: "var(--font-serif)" }}
              >
                Here, we listen.
              </p>
              <p
                className="text-xl leading-snug font-semibold mb-3"
                style={{ color: "#243D33", fontFamily: "var(--font-serif)" }}
              >
                We don't judge.
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#4a7a62", fontFamily: "var(--font-sans)" }}
              >
                Explore freely. ✦
              </p>

              {/* Tap to dismiss hint */}
              <p className="text-[10px] mt-4" style={{ color: "rgba(36,61,51,0.35)" }}>
                Tap anywhere to dismiss
              </p>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-8 right-8 h-0.5 rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, #BF9E79, transparent)" }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}