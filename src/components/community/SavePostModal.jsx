import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Plus, FolderOpen, Check } from "lucide-react";

const DEFAULT_FOLDERS = ["Ideas", "Business", "Funny", "Videos", "Inspirational"];

export default function SavePostModal({ post, user, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [savedFolders, setSavedFolders] = useState([]);
  const [newFolder, setNewFolder] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.SavedPost.filter({ user_email: user.email, post_id: post.id })
      .then(recs => {
        setSavedFolders(recs.map(r => r.folder || "Saved"));
        // Also gather all existing folders
        return base44.entities.SavedPost.filter({ user_email: user.email });
      })
      .then(all => {
        const custom = [...new Set(all.map(r => r.folder).filter(Boolean))];
        setFolders(prev => [...new Set([...prev, ...custom])]);
        setLoading(false);
      });
  }, [user?.email, post.id]);

  const toggle = async (folder) => {
    if (!user?.email) return;
    setSaving(folder);
    const isSaved = savedFolders.includes(folder);
    if (isSaved) {
      const recs = await base44.entities.SavedPost.filter({ user_email: user.email, post_id: post.id });
      const rec = recs.find(r => (r.folder || "Saved") === folder);
      if (rec) await base44.entities.SavedPost.delete(rec.id);
      setSavedFolders(prev => prev.filter(f => f !== folder));
    } else {
      const preview = post.title || post.body?.replace(/<[^>]*>/g, "")?.slice(0, 80) || "";
      await base44.entities.SavedPost.create({
        user_email: user.email,
        post_id: post.id,
        post_preview: preview,
        post_type: post.type,
        folder,
      });
      setSavedFolders(prev => [...prev, folder]);
      // Auto-close after saving
      setTimeout(() => onClose(), 400);
    }
    setSaving(null);
  };

  const addFolder = () => {
    const name = newFolder.trim();
    if (!name || folders.includes(name)) return;
    setFolders(prev => [...prev, name]);
    setNewFolder("");
    toggle(name);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(30,30,30,0.75)", backdropFilter: "blur(8px)", zIndex: 9999 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "80vh", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 overflow-y-auto" style={{ maxHeight: "calc(80vh - 20px)" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-primary-light)" }}>
                <FolderOpen className="w-4.5 h-4.5" style={{ color: "var(--accent-primary)" }} />
              </div>
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Save to Collection</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-gray-100">
              <X className="w-4.5 h-4.5" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
            </div>
          ) : (
            <div className="space-y-2.5">
              {folders.map(folder => {
                const saved = savedFolders.includes(folder);
                return (
                  <button key={folder} onClick={() => toggle(folder)} disabled={saving === folder}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      backgroundColor: saved ? "var(--accent-primary-light)" : "var(--bg-subtle)",
                      border: `2px solid ${saved ? "var(--accent-primary)" : "transparent"}`,
                      boxShadow: saved ? "0 4px 12px rgba(46,107,79,0.15)" : "none",
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📁</span>
                      <span className="text-sm font-semibold" style={{ color: saved ? "var(--accent-primary)" : "var(--text-primary)" }}>{folder}</span>
                    </div>
                    {saving === folder ? (
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)" }} />
                    ) : saved ? (
                      <Check className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                    ) : null}
                  </button>
                );
              })}

              {/* New folder input */}
              <div className="pt-2 mt-3 border-t" style={{ borderColor: "var(--border-light)" }}>
                <div className="flex gap-2">
                  <input
                    value={newFolder}
                    onChange={e => setNewFolder(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addFolder()}
                    placeholder="Create new collection..."
                    className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none transition-all focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-subtle)", 
                      border: "2px solid var(--border-light)", 
                      color: "var(--text-primary)",
                    }}
                  />
                  <button onClick={addFolder} disabled={!newFolder.trim()}
                   className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                   style={{ backgroundColor: "var(--accent-primary)", color: "#fff", boxShadow: "0 4px 12px rgba(46,107,79,0.3)" }}>
                   <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}