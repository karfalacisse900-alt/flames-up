import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu } from "lucide-react";

const TABS = [
  { id: "apps",     label: "Apps & Tools",   emoji: "🧰", description: "Discover useful apps and tools" },
  { id: "creators", label: "Creators",        emoji: "⭐", description: "Follow top creators" },
  { id: "dyk",      label: "Did You Know",    emoji: "💡", description: "Learn something new daily" },
];

export default function DiscoverMenuDrawer({ activeTab, onChange }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const current = TABS.find(t => t.id === activeTab) || TABS[0];

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1.5px solid var(--border-light)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Menu className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {current.emoji} {current.label}
        </span>
        <svg className="w-3 h-3" style={{ color: "var(--text-hint)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

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
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed left-0 top-0 bottom-0 z-50 w-[75vw] max-w-[280px] flex flex-col"
              style={{ backgroundColor: "var(--bg-card)", boxShadow: "4px 0 40px rgba(0,0,0,0.2)" }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-12 pb-5 border-b" style={{ borderColor: "var(--border-light)" }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-hint)" }}>Discover</p>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Browse</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-subtle)" }}
                >
                  <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSelect(tab.id)}
                      className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left active:scale-[0.98] transition-all"
                      style={{
                        backgroundColor: isActive ? "var(--accent-primary-light)" : "var(--bg-subtle)",
                        border: `1.5px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{
                          backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                          boxShadow: isActive ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                        }}
                      >
                        {tab.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: isActive ? "var(--accent-primary)" : "var(--text-primary)" }}>
                          {tab.label}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-hint)" }}>{tab.description}</p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "var(--accent-primary)" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}