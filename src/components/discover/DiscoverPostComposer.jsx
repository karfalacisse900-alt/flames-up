import React, { useState, useRef } from "react";
import { X, Image, Video, Link2, BookOpen, ChevronDown, Play, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "foryou", label: "For you" },
  { id: "culture", label: "Culture" },
  { id: "science", label: "Science" },
  { id: "featured", label: "Featured" },
  { id: "daily", label: "Daily" },
];

export default function DiscoverPostComposer({ user, onClose, onPosted }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState("foryou");
  const [sourceLink, setSourceLink] = useState("");
  const [bookName, setBookName] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [mediaItems, setMediaItems] = useState([]); // {url, type}
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showTabPicker, setShowTabPicker] = useState(false);
  const mediaInputRef = useRef(null);

  const handleMediaUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setMediaItems(prev => [...prev, { url: file_url, type: isVideo ? "video" : "photo" }]);
      } catch (e) {
        console.error("Upload failed:", e);
      }
    }
    setUploading(false);
  };

  const removeMedia = (idx) => setMediaItems(prev => prev.filter((_, i) => i !== idx));

  const handlePost = async () => {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      await base44.entities.DiscoverUserPost.create({
        author_email: user.email,
        author_name: user.display_name || user.full_name || "Anonymous",
        author_avatar: user.avatar_url || "",
        title: title.trim(),
        body: body.trim(),
        tab,
        media_urls: mediaItems.map(m => m.url),
        media_types: mediaItems.map(m => m.type),
        source_link: sourceLink.trim() || undefined,
        book_name: bookName.trim() || undefined,
        source_label: sourceLabel.trim() || undefined,
        like_count: 0,
        liked_by: [],
        comment_count: 0,
      });
      onPosted?.();
      onClose();
    } catch (e) {
      console.error("Post failed:", e);
    }
    setPosting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-light)", paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
          <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>
        <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>New Post</h2>
        <button onClick={handlePost} disabled={!body.trim() || posting}
          className="px-4 py-1.5 rounded-full text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", color: "#fff", opacity: (!body.trim() || posting) ? 0.45 : 1, minHeight: "unset", minWidth: "unset" }}>
          {posting ? "Posting…" : "Publish"}
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Author */}
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              {(user.full_name?.[0] || "U").toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{user.display_name || user.full_name}</p>
            {/* Tab picker */}
            <button onClick={() => setShowTabPicker(v => !v)}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", minHeight: "unset", minWidth: "unset" }}>
              {TABS.find(t => t.id === tab)?.label}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Tab dropdown */}
        <AnimatePresence>
          {showTabPicker && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setShowTabPicker(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium"
                  style={{ backgroundColor: tab === t.id ? "var(--accent-primary-light)" : "transparent", color: tab === t.id ? "var(--accent-primary)" : "var(--text-primary)", minHeight: "unset", minWidth: "unset" }}>
                  {t.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Add a title (optional)"
          className="w-full text-lg font-bold bg-transparent outline-none border-none"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)", boxShadow: "none", borderRadius: 0, padding: 0, transform: "none" }} />

        {/* Upload buttons — always visible inline */}
        <div className="flex gap-2 mb-2">
          <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={e => handleMediaUpload(e.target.files)} />
          <button onClick={() => mediaInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff", minHeight: "unset", minWidth: "unset" }}>
            <Image className="w-4 h-4" />
            Photo / Video
          </button>
          {mediaItems.length > 0 && (
            <span className="flex items-center text-xs font-semibold" style={{ color: "var(--accent-secondary)" }}>
              {mediaItems.length} added
            </span>
          )}
          {uploading && <span className="flex items-center text-xs" style={{ color: "var(--text-hint)" }}>Uploading…</span>}
        </div>

        {/* Body */}
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="Share what you learned, discovered, or want to discuss..."
          className="w-full bg-transparent resize-none outline-none border-none min-h-[120px]"
          style={{ color: "var(--text-primary)", fontSize: 15, lineHeight: 1.7, boxShadow: "none", borderRadius: 0, padding: 0, transform: "none" }} />

        {/* Media previews */}
        {mediaItems.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {mediaItems.map((m, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden aspect-square">
                {m.type === "video" ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video src={m.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                )}
                <button onClick={() => removeMedia(idx)}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)", minHeight: "unset", minWidth: "unset" }}>
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <span className="absolute bottom-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}>
                  {m.type === "video" ? "VIDEO" : "PHOTO"}
                </span>
              </div>
            ))}
          </div>
        )}


        {/* Source section */}
        <button onClick={() => setShowSource(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--accent-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <BookOpen className="w-4 h-4" />
          {showSource ? "Hide source info" : "Add source / reference"}
        </button>

        <AnimatePresence>
          {showSource && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3">
              <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
                  <input value={sourceLink} onChange={e => setSourceLink(e.target.value)}
                    placeholder="Source URL (article, video, website…)"
                    className="flex-1 bg-transparent text-sm outline-none border-none"
                    style={{ color: "var(--text-primary)", boxShadow: "none", borderRadius: 0, padding: 0, transform: "none" }} />
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
                  <input value={bookName} onChange={e => setBookName(e.target.value)}
                    placeholder="Book / course / podcast name"
                    className="flex-1 bg-transparent text-sm outline-none border-none"
                    style={{ color: "var(--text-primary)", boxShadow: "none", borderRadius: 0, padding: 0, transform: "none" }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0" style={{ color: "var(--text-hint)" }}>📌</span>
                  <input value={sourceLabel} onChange={e => setSourceLabel(e.target.value)}
                    placeholder="Source type (e.g. YouTube, Research Paper, Ted Talk)"
                    className="flex-1 bg-transparent text-sm outline-none border-none"
                    style={{ color: "var(--text-primary)", boxShadow: "none", borderRadius: 0, padding: 0, transform: "none" }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}