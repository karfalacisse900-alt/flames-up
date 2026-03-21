import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

/**
 * ActionSheet — mobile-native replacement for <select> and desktop dropdowns.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - title?: string
 *  - options: Array<{ value: string, label: string, icon?: ReactNode, destructive?: boolean }>
 *  - value?: string  (currently selected value — shows checkmark)
 *  - onSelect: (value: string) => void
 *  - cancelLabel?: string  (default "Cancel")
 */
export default function ActionSheet({
  open,
  onClose,
  title,
  options = [],
  value,
  onSelect,
  cancelLabel = "Cancel",
}) {
  const handleSelect = (optValue) => {
    onSelect(optValue);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="as-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="as-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.7 }}
            className="fixed left-0 right-0 bottom-0 z-[61] flex flex-col"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            {/* Options group */}
            <div
              className="mx-3 mb-2 rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 -4px 32px rgba(0,0,0,0.14)" }}
            >
              {title && (
                <div
                  className="px-4 py-3 text-center text-xs font-semibold"
                  style={{ color: "var(--text-hint)", borderBottom: "1px solid var(--border-light)" }}
                >
                  {title}
                </div>
              )}
              {options.map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className="w-full flex items-center justify-between px-5"
                  style={{
                    minHeight: 56,
                    color: opt.destructive ? "#ef4444" : "var(--text-primary)",
                    fontWeight: opt.value === value ? 700 : 500,
                    fontSize: 16,
                    borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none",
                    backgroundColor: "transparent",
                    borderRadius: 0,
                  }}
                >
                  <span className="flex items-center gap-3">
                    {opt.icon && <span style={{ opacity: 0.7 }}>{opt.icon}</span>}
                    {opt.label}
                  </span>
                  {opt.value === value && (
                    <Check className="w-5 h-5 flex-shrink-0" style={{ color: "var(--accent-primary)" }} />
                  )}
                </button>
              ))}
            </div>

            {/* Cancel button */}
            <button
              onClick={onClose}
              className="mx-3 rounded-2xl font-bold text-base"
              style={{
                minHeight: 56,
                backgroundColor: "var(--bg-card)",
                color: "var(--accent-primary)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              {cancelLabel}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}