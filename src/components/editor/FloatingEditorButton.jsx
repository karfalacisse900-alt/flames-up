import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Edit2, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingEditorButton() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u && (u.role === "admin" || u.role === "editor")) {
        setUser(u);
      }
    }).catch(() => {});
  }, []);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-16 right-0 rounded-2xl p-3 space-y-2 w-48 shadow-lg"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-medium)" }}
          >
            {isAdmin && (
              <Link
                to={createPageUrl("EditorDashboard")}
                onClick={() => setOpen(false)}
                className="block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ 
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--text-primary)"
                }}
              >
                👥 Editor Management
              </Link>
            )}
            
            <a
              href="https://base44.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ 
                backgroundColor: "var(--bg-subtle)",
                color: "var(--text-primary)"
              }}
            >
              📚 Documentation
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="rounded-full p-3 shadow-lg transition-all hover:scale-110"
        style={{
          backgroundColor: "var(--accent-primary)",
          color: "white",
          boxShadow: "0 4px 12px rgba(111, 143, 114, 0.3)",
        }}
      >
        {open ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
      </button>
    </div>
  );
}