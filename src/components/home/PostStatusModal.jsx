import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const BG_PRESETS = [
  "linear-gradient(135deg, #7C3AED, #4F46E5)",
  "linear-gradient(135deg, #DB2777, #9D174D)",
  "linear-gradient(135deg, #EA580C, #D97706)",
  "linear-gradient(135deg, #059669, #0D9488)",
  "linear-gradient(135deg, #0284C7, #6D28D9)",
  "linear-gradient(135deg, #1E1E3A, #4C1D95)",
  "linear-gradient(135deg, #B45309, #92400E)",
  "linear-gradient(135deg, #BE185D, #7C3AED)",
];

export default function PostStatusModal({ user, groupId, groupName, onClose, onPosted }) {
  const [text, setText] = useState("");
  const [bg, setBg] = useState(BG_PRESETS[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setUploading(false);
  };

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await base44.entities.CreatorStatus.create({
      author_email: user.email,
      author_name: user.full_name || user.email?.split("@")[0] || "Creator",
      author_type: groupId ? "group_owner" : "creator",
      text: text.trim(),
      background: imageUrl ? undefined : bg,
      image_url: imageUrl || undefined,
      group_id: groupId || undefined,
      group_name: groupName || undefined,
      expires_at: expires,
      view_count: 0,
      viewed_by: [],
    });
    setPosting(false);
    onPosted?.();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={e => e.stopPropagation()}>

        {/* Preview */}
        <div className="relative h-52 flex flex-col items-center justify-center p-6"
          style={{ background: imageUrl ? undefined : bg, backgroundImage: imageUrl ? `url(${imageUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
          {imageUrl && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />}
          <p className="relative z-10 text-white text-xl font-bold text-center leading-snug"
            style={{ fontFamily: "var(--font-serif)", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            {text || "Your status text…"}
          </p>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <X className="w-4 h-4 text-white" />
          </button>
          {groupName && (
            <span className="absolute bottom-3 left-3 text-xs font-bold text-white/80 z-10">📍 {groupName}</span>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Text input */}
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="What's happening? (e.g. Going to yoga 🧘, Check out our new class!)"
            rows={2} maxLength={180}
            className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

          {/* Background picker */}
          {!imageUrl && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-hint)" }}>Background</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {BG_PRESETS.map((preset, i) => (
                  <button key={i} onClick={() => setBg(preset)}
                    className="w-9 h-9 rounded-xl shrink-0 transition-all"
                    style={{ background: preset, border: bg === preset ? "3px solid var(--text-primary)" : "3px solid transparent" }} />
                ))}
              </div>
            </div>
          )}

          {/* Image upload */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              {imageUrl ? "Change photo" : "Add photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            {imageUrl && (
              <button onClick={() => setImageUrl("")} className="text-xs font-semibold"
                style={{ color: "#E05C7A" }}>Remove</button>
            )}
          </div>

          {/* Post button */}
          <button onClick={handlePost} disabled={!text.trim() || posting}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: bg }}>
            {posting ? "Posting…" : groupId ? "Post Group Status" : "Post Status (24h)"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}