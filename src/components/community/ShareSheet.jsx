import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link as LinkIcon, Twitter, Instagram } from "lucide-react";

export default function ShareSheet({ open, onClose, url, text }) {
  if (!open) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text || "Check this out!");

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    onClose();
  };

  const shareOptions = [
    {
      label: "Twitter / X",
      icon: "𝕏",
      color: "#000",
      bg: "#f0f0f0",
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`, "_blank"),
    },
    {
      label: "Instagram Story",
      icon: "📸",
      color: "#E1306C",
      bg: "#fce4ec",
      action: () => {
        // Instagram doesn't support direct web share — copy link and prompt
        navigator.clipboard.writeText(url);
        alert("Link copied! Open Instagram and paste it in your story or bio.");
      },
    },
    {
      label: "WhatsApp",
      icon: "💬",
      color: "#25D366",
      bg: "#e8f5e9",
      action: () => window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, "_blank"),
    },
    {
      label: "Copy Link",
      icon: <LinkIcon className="w-4 h-4" />,
      color: "var(--accent-primary)",
      bg: "var(--accent-primary-light)",
      action: handleCopy,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto rounded-t-3xl px-5 pt-4 pb-8"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Share</p>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {shareOptions.map((opt) => (
                <button key={opt.label} onClick={() => { opt.action(); onClose(); }}
                  className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: opt.bg, color: opt.color }}>
                    {typeof opt.icon === "string" ? opt.icon : opt.icon}
                  </div>
                  <span className="text-[11px] font-medium text-center leading-tight" style={{ color: "var(--text-secondary)" }}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}