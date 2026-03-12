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
      className="fixed inset-0 flex items-end"
      style={{ backgroundColor: "#FEF3C7", zIndex: 9999 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "70vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Save to Collection</h2>
            </div>
            <button onClick={onClose}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          {loading ? (
            <div className="py-6 flex justify-center">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {folders.map(folder => {
                const saved = savedFolders.includes(folder);
                return (
                  <button key={folder} onClick={() => toggle(folder)} disabled={saving === folder}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: saved ? "var(--accent-primary-light)" : "var(--bg-subtle)",
                      border: `1px solid ${saved ? "var(--accent-primary)" : "var(--border-light)"}`,
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="text-base">📁</span>
                      <span className="text-sm font-medium" style={{ color: saved ? "var(--accent-primary)" : "var(--text-primary)" }}>{folder}</span>
                    </div>
                    {saved && <Check className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />}
                  </button>
                );
              })}

              {/* New folder input */}
              <div className="flex gap-2 mt-3">
                <input
                  value={newFolder}
                  onChange={e => setNewFolder(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addFolder()}
                  placeholder="New collection name..."
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                />
                <button onClick={addFolder}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}