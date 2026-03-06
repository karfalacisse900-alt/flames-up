import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, ImageIcon, Save, Plus } from "lucide-react";
import { checkContent, createModerationReport } from "../moderation/moderationHelper";
import { requireVerified } from "../auth/EmailVerificationGate";
import PhotoEditor from "../editor/PhotoEditor";
import ReactQuill from "react-quill";

const QUILL_MODULES = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};
const QUILL_FORMATS = ["bold", "italic", "underline", "list", "bullet", "link"];

const POST_TYPES = [
  { key: "opinion",      label: "Opinion",  emoji: "💬", desc: "Share your take on anything" },
  { key: "question",     label: "Question", emoji: "❓", desc: "Ask the community anything" },
  { key: "quote_of_day", label: "Quote",    emoji: "✦",  desc: "Share an inspiring quote" },
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
  const [imageUrl, setImageUrl] = useState("");
  const [imageFiles, setImageFiles] = useState([]); // array of {file, preview}
  const [imageFile, setImageFile] = useState(null); // legacy single
  const [imagePreview, setImagePreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState("");
  const [editingFile, setEditingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const isBodyEmpty = (html) => {
    const txt = (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return txt.length === 0;
  };

  // Load draft on mount
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.PostDraft.filter({ user_email: user.email }, "-created_date", 1).then(drafts => {
      const d = drafts[0];
      if (!d) return;
      if (d.type) { setType(d.type); setStep("compose"); }
      if (d.title) setTitle(d.title);
      if (d.body) setBody(d.body);
      if (d.media_type) setMediaType(d.media_type);
      if (d.media_ref) setMediaRef(d.media_ref);
      if (d.is_anonymous !== undefined) setIsAnon(d.is_anonymous);
    }).catch(() => {});
  }, [user?.email]);

  const saveDraft = async () => {
    if (!user?.email) return;
    const data = { user_email: user.email, type, title, body, media_type: mediaType, media_ref: mediaRef, is_anonymous: isAnon };
    try {
      const existing = await base44.entities.PostDraft.filter({ user_email: user.email });
      if (existing[0]) await base44.entities.PostDraft.update(existing[0].id, data);
      else await base44.entities.PostDraft.create(data);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (e) {
      console.error("Draft save failed", e);
    }
  };

  const clearDraft = async () => {
    if (!user?.email) return;
    const existing = await base44.entities.PostDraft.filter({ user_email: user.email });
    for (const d of existing) await base44.entities.PostDraft.delete(d.id);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // multi-photo: add to existing imageFiles array (max 10)
    const newEntries = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setImageFiles(prev => {
      const combined = [...prev, ...newEntries].slice(0, 10);
      return combined;
    });
    setVideoFile(null);
    setVideoPreview(null);
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    setEditingFile(null);
    e.target.value = "";
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    // Check duration
    const vid = document.createElement("video");
    vid.src = url;
    vid.onloadedmetadata = () => {
      if (vid.duration > 60) {
        setVideoError("Video must be 60 seconds or less.");
        return;
      }
      setVideoFile(file);
      setVideoPreview(url);
      setVideoDuration(Math.round(vid.duration));
      setVideoError("");
      setImageFile(null);
      setImagePreview(null);
    };
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
    if (isBodyEmpty(body)) return;
    setMediaError(false);
    setSaving(true);

    // Upload image(s) or video first
    let finalImageUrl = null;
    let finalImageUrls = [];
    let finalVideoUrl = null;
    if (imageFiles.length > 0) {
      setUploading(true);
      try {
        const uploads = await Promise.all(imageFiles.map(({ file }) => base44.integrations.Core.UploadFile({ file })));
        finalImageUrls = uploads.map(r => r.file_url);
        finalImageUrl = finalImageUrls[0];
      } catch (err) {
        console.error("Image upload failed:", err);
      }
      setUploading(false);
    } else if (imageFile) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
        finalImageUrl = file_url;
        finalImageUrls = [file_url];
      } catch (err) {
        console.error("Image upload failed:", err);
      }
      setUploading(false);
    } else if (videoFile) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: videoFile });
        finalVideoUrl = file_url;
      } catch (err) {
        console.error("Video upload failed:", err);
        alert('Video upload failed. Please try a shorter/lighter video.');
      }
      setUploading(false);
    }

    // Auto-detect: if no media, treat as text_only card
    const effectiveType = (!finalImageUrl && !finalVideoUrl && type === "opinion") ? "text_only" : type;

    // AI moderation check
    const textToCheck = [body].filter(Boolean).join(" ");
    const modResult = await checkContent(textToCheck);
    if (!modResult.safe) {
      const newPost = await base44.entities.CommunityPost.create({
        type: effectiveType, body: body,
        author_email: user?.email || "", author_name: user?.display_name || user?.full_name || "Anonymous",
        author_avatar_url: user?.avatar_url || "",
        is_anonymous: isAnon,
        image_url: finalImageUrl || undefined,
        image_urls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
        video_url: finalVideoUrl || undefined,
        upvotes: 0, downvotes: 0, comment_count: 0, engagement_score: 0,
        is_daily_spotlight: false, is_reported: true,
      });
      await createModerationReport("post", newPost.id, user?.email, user?.display_name || user?.full_name, modResult.flags, modResult.confidence);
      setSaving(false);
      onCreated();
      onClose();
      return;
    }

    const postData = {
      type: effectiveType,
      body: body,
      author_email: user?.email || "",
      author_name: user?.display_name || user?.full_name || "Anonymous",
      author_avatar_url: user?.avatar_url || "",
      is_anonymous: isAnon,
      image_url: finalImageUrl || undefined,
      image_urls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      video_url: finalVideoUrl || undefined,
      upvotes: 0, downvotes: 0, comment_count: 0, engagement_score: 0,
      is_daily_spotlight: false,
    };

    await base44.entities.CommunityPost.create(postData);
    setSaving(false);
    await clearDraft();
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
            <div className="flex items-center gap-2">
              {step === "compose" && (
                <button onClick={saveDraft} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                  style={{ borderColor: "var(--border-light)", color: draftSaved ? "var(--accent-primary)" : "var(--text-secondary)", backgroundColor: draftSaved ? "var(--accent-primary-light)" : "transparent" }}>
                  <Save className="w-3 h-3" />
                  {draftSaved ? "Saved!" : "Save draft"}
                </button>
              )}
              <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
            </div>
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





              {/* Body */}
              {(
                type === "quote_of_day" ? (
                  <textarea value={body} onChange={e => setBody(e.target.value)}
                    placeholder="Enter the quote..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)", fontStyle: "italic", fontFamily: "var(--font-serif)" }} />
                ) : (
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-light)", backgroundColor: "var(--bg-subtle)" }}>
                    <ReactQuill
                      theme="snow"
                      value={body}
                      onChange={setBody}
                      modules={QUILL_MODULES}
                      formats={QUILL_FORMATS}
                      placeholder={type === "list" ? "Describe your list..." : "Write your thoughts..."}
                      style={{ fontSize: 14 }}
                    />
                  </div>
                )
              )}

              {/* Photo/GIF/Video upload */}
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

                {/* Video preview */}
                {videoPreview && (
                  <div className="relative rounded-xl overflow-hidden mb-2">
                    <video src={videoPreview} controls className="w-full max-h-64 rounded-xl object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>⏱ {videoDuration}s</span>
                      <button onClick={() => { setVideoFile(null); setVideoPreview(null); setVideoError(""); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {videoError && <p className="text-xs mb-1" style={{ color: "#E05C7A" }}>{videoError}</p>}

                {/* Multi-photo thumbnail grid */}
                {imageFiles.length > 0 && (
                  <div className="mb-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      {imageFiles.map((img, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1" }}>
                          <img src={img.preview} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                            <X className="w-3 h-3" />
                          </button>
                          {i === 0 && (
                            <div className="absolute bottom-1 left-1 text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: "rgba(46,107,79,0.8)" }}>Cover</div>
                          )}
                        </div>
                      ))}
                      {/* Add more button if under 10 */}
                      {imageFiles.length < 10 && (
                        <button
                          onClick={() => { setMediaError(false); fileInputRef.current?.click(); }}
                          className="rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-dashed"
                          style={{ aspectRatio: "1", borderColor: "var(--border-medium)", color: "var(--text-hint)" }}>
                          <Plus className="w-5 h-5" />
                          <span className="text-[10px]">Add more</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] mt-1.5" style={{ color: "var(--text-hint)" }}>
                      {imageFiles.length}/10 photos · Swipe carousel in feed
                    </p>
                  </div>
                )}

                {imageFiles.length === 0 && !videoPreview ? (
                  <div className="flex gap-2">
                    <button onClick={() => { setMediaError(false); fileInputRef.current?.click(); }} disabled={uploading}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-all active:scale-95"
                      style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                      <ImageIcon className="w-4 h-4" />
                      Photos (up to 10)
                    </button>
                    <button onClick={() => { setVideoError(""); videoInputRef.current?.click(); }} disabled={uploading}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-all active:scale-95"
                      style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                      🎥 Video (≤60s)
                    </button>
                  </div>
                ) : null}
              </div>

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