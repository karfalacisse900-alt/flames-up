import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, MapPin, Clock, LayoutList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const MENU_ITEMS = [
  {
    id: "main",
    label: "Main Feed",
    description: "Posts from everyone",
    icon: LayoutList,
    gradient: ["#6366f1", "#8b5cf6"],
    emoji: "🌍",
    page: null, // stays on home
  },
  {
    id: "live_nearby",
    label: "Live Nearby",
    description: "Real-time activities around you",
    icon: MapPin,
    gradient: ["#f43f5e", "#e11d48"],
    emoji: "📍",
    page: "LiveNearby",
    badge: "LIVE",
  },
  {
    id: "temporary",
    label: "Temporary Posts",
    description: "Flash posts that expire",
    icon: Clock,
    gradient: ["#f59e0b", "#d97706"],
    emoji: "⏳",
    page: "LiveNearby",
    comingSoon: true,
  },
];

export default function FeedMenuDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleSelect = (item) => {
    onClose();
    if (item.page && !item.comingSoon) {
      navigate(createPageUrl(item.page));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed left-0 top-0 bottom-0 z-50 w-[78vw] max-w-[300px] flex flex-col"
            style={{ backgroundColor: "var(--bg-card)", boxShadow: "4px 0 40px rgba(0,0,0,0.2)" }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-5 border-b" style={{ borderColor: "var(--border-light)" }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-hint)" }}>Community</p>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Feed Sections</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}
              >
                <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            {/* Menu items */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-light)",
                    opacity: item.comingSoon ? 0.6 : 1,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }}
                  >
                    {item.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                      {item.badge && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "#f43f5e" }}>
                          {item.badge}
                        </span>
                      )}
                      {item.comingSoon && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--border-light)", color: "var(--text-hint)" }}>
                          SOON
                        </span>
                      )}
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>{item.description}</p>
                  </div>

                  <svg className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Footer note */}
            <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border-light)" }}>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>More sections coming soon 🚀</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}