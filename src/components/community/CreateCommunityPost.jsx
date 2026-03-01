import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Plus, Minus, ImageIcon } from "lucide-react";
import { checkContent, createModerationReport } from "../moderation/moderationHelper";
import { requireVerified } from "../auth/EmailVerificationGate";
import PhotoEditor from "../editor/PhotoEditor";

const POST_TYPES = [
  { key: "opinion",      label: "Opinion",    emoji: "💬", desc: "Share your take on anything" },
  { key: "question",     label: "Question",   emoji: "❓", desc: "Ask the community anything" },
  { key: "debate",       label: "Debate",     emoji: "⚔️", desc: "Create a two-sided debate" },
  { key: "list",         label: "List",       emoji: "📋", desc: "Share a ranked list" },
  { key: "quote_of_day", label: "Quote",      emoji: "✦",  desc: "Share an inspiring quote" },
  { key: "discussion",   label: "Discussion", emoji: "🗣", desc: "Start a general discussion" },
];

const MEDIA_TYPES = [
  { key: "general", label: "General" },
  { key: "movie",   label: "🎬 Movie" },
  { key: "show",    label: "📺 Show" },
  { key: "book",    label: "📚 Book" },
  { key: "game",    label: "🎮 Game" },
  { key: "music",   label: "🎵 Music" },
];

export default function CreateCommunityPost({ user, onClose, onCreated }) {
  const [step, setStep] = useState("type");
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaType, setMediaType] = useState("general");
  const [mediaRef, setMediaRef] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [listItems, setListItems] = useState(["", ""]);
  const [sideA, setSideA] = useState("");
  const [sideB, setSideB] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setEditingFile(file);
    e.target.value = "";
  };

  const handleEditorDone = (editedFile, editedUrl) => {
    setImageFile(editedFile);
    setImagePreview(editedUrl);
    setImageUrl(""); // will upload on submit
    setEditingFile(null);
  };

  const handleSubmit = async () => {
    if (!requireVerified(user)) return;
    if (!body.trim() && type !== "debate") return;
    if (type === "debate" && (!title.trim() || !sideA.trim() || !sideB.trim())) return;
    // Require at least an image/gif for non-structured post types
    const requiresMedia = !["debate", "list", "question", "quote_of_day"].includes(type);
    if (requiresMedia && !imageUrl) {
      setMediaError(true);
      return;
    }
    setMediaError(false);
    setSaving(true);

    // Upload image if picked but not yet uploaded
    if (imageFile && !imageUrl) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      setImageUrl(file_url);
      setUploading(false);
    }

    // AI moderation check
    const textToCheck = [title, body, sideA, sideB].filter(Boolean).join(" ");
    const modResult = await checkContent(textToCheck);
    if (!modResult.safe) {
      // Still create the post but flag it for moderation review
      const newPost = await base44.entities.CommunityPost.create({
        type, title: title.trim() || undefined, body: body.trim() || title.trim(),
        author_email: user?.email || "", author_name: user?.display_name || user?.full_name || "Anonymous",
        author_avatar_url: user?.avatar_url || "",
        is_anonymous: isAnon, media_type: mediaType, media_ref_title: mediaRef.trim() || undefined,
        upvotes: 0, downvotes: 0, comment_count: 0, engagement_score: 0,
        is_daily_spotlight: false, is_reported: true,
        list_items: type === "list" ? listItems.filter(i => i.trim()) : undefined,
      });
      await createModerationReport("post", newPost.id, user?.email, user?.display_name || user?.full_name, modResult.flags, modResult.confidence);
      setSaving(false);
      onCreated();
      onClose();
      return;
    }

    const postData = {
      type,
      title: title.trim() || undefined,
      body: body.trim() || title.trim(),
      author_email: user?.email || "",
      author_name: user?.display_name || user?.full_name || "Anonymous",
      author_avatar_url: user?.avatar_url || "",
      is_anonymous: isAnon,
      media_type: mediaType,
      media_ref_title: mediaRef.trim() || undefined,
      image_url: imageUrl || undefined,

      upvotes: 0, downvotes: 0, comment_count: 0, engagement_score: 0,
      is_daily_spotlight: false,
      list_items: type === "list" ? listItems.filter(i => i.trim()) : undefined,
    };

    const newPost = await base44.entities.CommunityPost.create(postData);

    if (type === "debate" && newPost?.id) {
      await base44.entities.CommunityDebate.create({
        post_id: newPost.id,
        topic: title.trim(),
        side_a_label: sideA.trim(),
        side_b_label: sideB.trim(),
        side_a_votes: 0, side_b_votes: 0,
      });
    }

    setSaving(false);
    onCreated();
    onClose();
  };

  if (editingFile) {
    return <PhotoEditor file={editingFile} onDone={handleEditorDone} onCancel={() => setEditingFile(null)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "#F2EDE4", maxHeight: "90vh", overflowY: "auto", color: "#1E1E1E" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />

        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              {step === "type" ? "What would you like to post?" : "Compose Your Post"}
            </h2>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          {/* Step 1: Pick type */}
          {step === "type" && (
            <div className="grid grid-cols-2 gap-2 pb-6">
              {POST_TYPES.map(t => (
                <button key={t.key} onClick={() => { setType(t.key); setStep("compose"); }}
                  className="p-3 rounded-2xl text-left transition-all active:scale-95"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                  <p className="text-2xl mb-1">{t.emoji}</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-hint)" }}>{t.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Compose */}
          {step === "compose" && (
            <div className="space-y-3 pb-6">
              <button onClick={() => setStep("type")} className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
                ← Change type
              </button>
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl mb-1" style={{ backgroundColor: "#3C6E5A14" }}>
                <span className="text-xl">{POST_TYPES.find(t => t.key === type)?.emoji}</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: "#3C6E5A" }}>{POST_TYPES.find(t => t.key === type)?.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>{POST_TYPES.find(t => t.key === type)?.desc}</p>
                </div>
              </div>

              {/* Media topic */}
              <div>
                <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Topic (optional)</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {MEDIA_TYPES.map(m => (
                    <button key={m.key} onClick={() => setMediaType(m.key)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                      style={{
                        backgroundColor: mediaType === m.key ? "var(--accent-primary)" : "transparent",
                        color: mediaType === m.key ? "#fff" : "var(--text-secondary)",
                        borderColor: mediaType === m.key ? "var(--accent-primary)" : "var(--border-light)",
                      }}>{m.label}</button>
                  ))}
                </div>
                {mediaType !== "general" && (
                  <input value={mediaRef} onChange={e => setMediaRef(e.target.value)}
                    placeholder={`Name of the ${mediaType}...`}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                )}
              </div>

              {/* Title (for debate/list) */}
              {(type === "debate" || type === "list") && (
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={type === "debate" ? "Debate topic..." : "List title..."}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              )}

              {/* Body */}
              {type !== "debate" && (
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  placeholder={type === "quote_of_day" ? "Enter the quote..." : type === "list" ? "Describe your list..." : "Write your thoughts..."}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              )}

              {/* Photo/GIF upload */}
              {type !== "debate" && type !== "list" && (
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={imagePreview} alt="Upload" className="w-full max-h-64 object-cover" />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button onClick={() => setEditingFile(imageFile)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: "rgba(46,107,79,0.85)" }}>✨ Edit</button>
                        <button onClick={() => { setImageFile(null); setImagePreview(null); setImageUrl(""); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setMediaError(false); fileInputRef.current?.click(); }} disabled={uploading}
                      className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-all active:scale-95"
                      style={{
                        backgroundColor: "var(--bg-subtle)",
                        borderColor: mediaError ? "#E05C7A" : "var(--border-light)",
                        color: mediaError ? "#E05C7A" : "var(--text-secondary)"
                      }}>
                      <ImageIcon className="w-4 h-4" />
                      {uploading ? "Uploading..." : mediaError ? "⚠️ Photo/GIF required" : "Add Photo / GIF"}
                    </button>
                  )}
                  {mediaError && !imagePreview && (
                    <p className="text-xs mt-1" style={{ color: "#E05C7A" }}>Please add a photo or GIF before posting.</p>
                  )}
                </div>
              )}

              {/* Debate sides */}
              {type === "debate" && (
                <>
                  <textarea value={body} onChange={e => setBody(e.target.value)}
                    placeholder="Describe the debate (optional)..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] font-medium mb-1" style={{ color: "#3C6E5A" }}>🟢 Side A</p>
                      <input value={sideA} onChange={e => setSideA(e.target.value)} placeholder="e.g. Yes"
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ backgroundColor: "#EEF3F0", border: "1px solid #3C6E5A33", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium mb-1" style={{ color: "#D98B62" }}>🟠 Side B</p>
                      <input value={sideB} onChange={e => setSideB(e.target.value)} placeholder="e.g. No"
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ backgroundColor: "#FFF3E8", border: "1px solid #D98B6233", color: "var(--text-primary)" }} />
                    </div>
                  </div>
                </>
              )}

              {/* List items */}
              {type === "list" && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>List items</p>
                  {listItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-xs font-bold w-5 text-center" style={{ color: "var(--accent-primary)" }}>{i+1}</span>
                      <input value={item} onChange={e => { const n = [...listItems]; n[i] = e.target.value; setListItems(n); }}
                        placeholder={`Item ${i+1}...`}
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                      {listItems.length > 2 && (
                        <button onClick={() => setListItems(l => l.filter((_, j) => j !== i))}>
                          <Minus className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setListItems(l => [...l, ""])} className="flex items-center gap-1 text-xs mt-1" style={{ color: "var(--accent-primary)" }}>
                    <Plus className="w-3.5 h-3.5" /> Add item
                  </button>
                </div>
              )}

              {/* Anonymous toggle */}
              <div className="flex items-center justify-between py-1">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Post anonymously</p>
                <button onClick={() => setIsAnon(v => !v)}
                  className="w-10 h-5 rounded-full transition-all relative"
                  style={{ backgroundColor: isAnon ? "var(--accent-primary)" : "var(--border-medium)" }}>
                  <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: isAnon ? "calc(100% - 18px)" : "2px" }} />
                </button>
              </div>

              <button onClick={handleSubmit} disabled={saving}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ backgroundColor: "#3C6E5A", boxShadow: "0 4px 16px rgba(60,110,90,0.35)", letterSpacing: "0.02em" }}>
                {saving ? "⏳ Posting..." : "✦ Post to Community"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}