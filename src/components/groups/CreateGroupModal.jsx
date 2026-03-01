import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const CATEGORIES = [
  { key: "general", label: "General", emoji: "💬" },
  { key: "movies", label: "Movies", emoji: "🎬" },
  { key: "music", label: "Music", emoji: "🎵" },
  { key: "books", label: "Books", emoji: "📚" },
  { key: "gaming", label: "Gaming", emoji: "🎮" },
  { key: "tech", label: "Tech", emoji: "💻" },
  { key: "sports", label: "Sports", emoji: "⚽" },
  { key: "art", label: "Art", emoji: "🎨" },
  { key: "health", label: "Health", emoji: "💪" },
  { key: "travel", label: "Travel", emoji: "✈️" },
  { key: "food", label: "Food", emoji: "🍕" },
  { key: "relationships", label: "Relationships", emoji: "❤️" },
  { key: "motivation", label: "Motivation", emoji: "🔥" },
];

export default function CreateGroupModal({ user, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [rules, setRules] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCat = CATEGORIES.find(c => c.key === category);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const group = await base44.entities.Group.create({
      name: name.trim(),
      description: description.trim() || undefined,
      emoji: selectedCat?.emoji,
      category,
      rules: rules.trim() || undefined,
      is_private: isPrivate,
      creator_email: user.email,
      creator_name: user.full_name || user.email,
      member_count: 1,
      post_count: 0,
      is_active: true,
    });
    // Auto-join as admin
    await base44.entities.GroupMember.create({
      group_id: group.id, group_name: group.name,
      user_email: user.email, user_name: user.full_name || user.email,
      role: "admin", joined_at: new Date().toISOString(),
    });
    setSaving(false);
    onCreated(group);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "#FAFAF8", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Create a Group</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
        </div>

        <div className="px-5 py-4 space-y-4 pb-10">
          {/* Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Group Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={40}
              placeholder="e.g. Film Buffs, Study Squad..."
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Category</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setCategory(c.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95"
                  style={{
                    backgroundColor: category === c.key ? "var(--accent-primary)" : "var(--bg-subtle)",
                    color: category === c.key ? "#fff" : "var(--text-secondary)",
                    borderColor: category === c.key ? "var(--accent-primary)" : "var(--border-light)",
                  }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={200}
              placeholder="What's this group about?"
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Rules */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Group Rules (optional)</label>
            <textarea value={rules} onChange={e => setRules(e.target.value)} rows={2} maxLength={300}
              placeholder="e.g. Be respectful, no spam..."
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Private toggle */}
          <div className="flex items-center justify-between py-1 px-3 rounded-xl"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Private Group</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Only members can see posts</p>
            </div>
            <button onClick={() => setIsPrivate(v => !v)}
              className="w-11 h-6 rounded-full transition-all relative shrink-0"
              style={{ backgroundColor: isPrivate ? "var(--accent-primary)" : "var(--border-medium)" }}>
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow transition-all"
                style={{ left: isPrivate ? "calc(100% - 22px)" : "2px" }} />
            </button>
          </div>

          <button onClick={handleCreate} disabled={!name.trim() || saving}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 16px rgba(46,107,79,0.35)" }}>
            {saving ? "Creating..." : "✦ Create Group"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}