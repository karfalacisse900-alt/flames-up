import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, ImageIcon, Loader2, Paperclip, FileText } from "lucide-react";
import { checkContent, createModerationReport } from "@/components/moderation/moderationHelper";
import PhotoEditor from "@/components/editor/PhotoEditor";

const POST_TYPES = [
  { key: "opinion", label: "Opinion", emoji: "💬" },
  { key: "question", label: "Question", emoji: "❓" },
  { key: "quote_of_day", label: "Quote", emoji: "✦" },
  { key: "discussion", label: "Discussion", emoji: "🗣" },
];

export default function GroupPostCompose({ group, user, onClose, onCreated }) {
  const [type, setType] = useState("opinion");
  const [body, setBody] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const handleImagePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    setEditingFile(null); // don't auto-open editor, let user tap Edit button
    e.target.value = "";
  };

  const handleEditorDone = (editedFile, editedUrl) => {
    setImageFile(editedFile);
    setImagePreview(editedUrl);
    setEditingFile(null);
  };

  const handleSubmit = async () => {
    if (!body.trim() || saving) return;
    setSaving(true);

    let imageUrl = null;
    if (imageFile) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = file_url;
      setUploading(false);
    }

    const modResult = await checkContent(body);

    const newPost = await base44.entities.CommunityPost.create({
      type, body: body.trim(),
      author_email: isAnon ? "" : user.email,
      author_name: isAnon ? "Anonymous" : (user.display_name || user.full_name || "User"),
      author_avatar_url: isAnon ? "" : (user.avatar_url || ""),
      is_anonymous: isAnon,
      image_url: imageUrl || undefined,
      group_id: group.id,
      group_name: group.name,
      upvotes: 0, downvotes: 0, comment_count: 0, engagement_score: 0,
      is_reported: !modResult.safe,
    });

    if (!modResult.safe) {
      await createModerationReport("post", newPost.id, user.email, user.full_name, modResult.flags, modResult.confidence);
    }

    // Increment post count
    await base44.entities.Group.update(group.id, { post_count: (group.post_count || 0) + 1 });

    setSaving(false);
    onCreated();
  };

  if (editingFile) {
    return <PhotoEditor file={editingFile} onDone={handleEditorDone} onCancel={() => setEditingFile(null)} />;
  }

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
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Post to {group.name}</h2>
            <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>{group.emoji} {group.category}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
        </div>

        <div className="px-4 py-4 space-y-3 pb-8">
          {/* Type selector */}
          <div className="flex gap-2">
            {POST_TYPES.map(t => (
              <button key={t.key} onClick={() => setType(t.key)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: type === t.key ? "var(--accent-primary)" : "var(--bg-subtle)",
                  color: type === t.key ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${type === t.key ? "var(--accent-primary)" : "var(--border-light)"}`,
                }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
            placeholder={type === "question" ? "Ask the group anything..." : type === "quote_of_day" ? "Share an inspiring quote..." : "Share with the group..."}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

          {/* Image/GIF */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={imagePreview} alt="" className="w-full max-h-52 object-cover" />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button onClick={() => setEditingFile(imageFile)}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-white"
                  style={{ backgroundColor: "rgba(46,107,79,0.85)" }}>✨ Edit</button>
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-all"
              style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
              <ImageIcon className="w-4 h-4" />
              {uploading ? "Uploading..." : "Add Photo / GIF"}
            </button>
          )}

          {/* Anonymous */}
          <div className="flex items-center justify-between py-1">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Post anonymously</p>
            <button onClick={() => setIsAnon(v => !v)}
              className="w-10 h-5 rounded-full transition-all relative"
              style={{ backgroundColor: isAnon ? "var(--accent-primary)" : "var(--border-medium)" }}>
              <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow"
                style={{ left: isAnon ? "calc(100% - 18px)" : "2px" }} />
            </button>
          </div>

          <button onClick={handleSubmit} disabled={!body.trim() || saving}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 16px rgba(46,107,79,0.3)" }}>
            {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Posting...</span> : "✦ Post to Group"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}