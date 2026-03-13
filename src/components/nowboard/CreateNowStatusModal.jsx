import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Plus, Loader2, Clock, MapPin } from "lucide-react";

const DURATIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "12 hours", minutes: 720 },
  { label: "24 hours", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "7 days", minutes: 10080 },
  { label: "10 days", minutes: 14400 },
];

const CATEGORIES = ["food", "travel", "music", "question", "events", "local_tips", "general"];

export default function CreateNowStatusModal({ user, onClose, onCreated }) {
  const [step, setStep] = useState(1); // 1=content, 2=details
  const [contentType, setContentType] = useState("text");
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [duration, setDuration] = useState(DURATIONS[4]); // 24 hours default
  const [category, setCategory] = useState("general");
  const [moodTag, setMoodTag] = useState("");
  const [locationName, setLocationName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const mediaInputRef = useRef(null);

  const handleMediaPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCreate = async () => {
    if (!user) return;
    if (contentType === "text" && !text.trim()) return;
    if (contentType !== "text" && !mediaFile) return;

    setSaving(true);
    setUploading(mediaFile ? true : false);

    try {
      let mediaUrl = null;
      if (mediaFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
        mediaUrl = file_url;
        setUploading(false);
      }

      const expiresAt = new Date(Date.now() + duration.minutes * 60000).toISOString();

      await base44.entities.NowStatus.create({
        author_email: user.email,
        author_name: user.full_name || user.email,
        author_avatar_url: user.avatar_url || "",
        content_type: contentType,
        text: contentType === "text" ? text.trim() : undefined,
        media_url: mediaUrl,
        duration_minutes: duration.minutes,
        expires_at: expiresAt,
        category,
        mood_tag: moodTag || undefined,
        location_name: locationName || undefined,
        is_active: true,
        reactions: {},
        reaction_users: {},
      });

      onCreated();
    } catch (err) {
      console.error("Error creating status:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {step === 1 ? "What's happening?" : "Post Details"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
          </button>
        </div>

        <div className="px-5 py-6 max-h-[70vh] overflow-y-auto space-y-6">
          {step === 1 ? (
            <>
              {/* Content Type */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  What are you sharing?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["text", "photo", "video"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setContentType(type)}
                      className="p-4 rounded-2xl text-sm font-semibold transition-all capitalize"
                      style={{
                        backgroundColor: contentType === type ? "var(--accent-primary)" : "var(--bg-subtle)",
                        color: contentType === type ? "white" : "var(--text-secondary)",
                        border: `2px solid ${contentType === type ? "var(--accent-primary)" : "var(--border-light)"}`
                      }}
                    >
                      {type === "photo" ? "📷" : type === "video" ? "🎥" : "✍️"} {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Input */}
              {contentType === "text" ? (
                <div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Share your thoughts, ask a question, or post an update..."
                    maxLength={280}
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                    rows={5}
                    style={{
                      backgroundColor: "var(--bg-subtle)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-primary)"
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: "var(--text-hint)" }}>
                    {text.length}/280
                  </p>
                </div>
              ) : (
                <div>
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept={contentType === "photo" ? "image/*" : "video/*"}
                    onChange={handleMediaPick}
                    className="hidden"
                  />
                  {mediaPreview ? (
                    <div className="relative rounded-2xl overflow-hidden" style={{ height: "280px" }}>
                      {contentType === "photo" ? (
                        <img src={mediaPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={mediaPreview} className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => mediaInputRef.current?.click()}
                      className="w-full py-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all"
                      style={{
                        borderColor: "var(--border-medium)",
                        color: "var(--text-hint)",
                        backgroundColor: "var(--bg-subtle)"
                      }}
                    >
                      <Plus className="w-6 h-6" />
                      Click to upload {contentType}
                    </button>
                  )}
                </div>
              )}

              {/* Next Button */}
              <button
                onClick={() => setStep(2)}
                disabled={contentType === "text" ? !text.trim() : !mediaFile}
                className="w-full py-3 rounded-2xl text-base font-bold text-white disabled:opacity-50 transition-all"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                Next: Add Details
              </button>
            </>
          ) : (
            <>
              {/* Duration */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  <Clock className="w-4 h-4" /> How long should this stay visible?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.minutes}
                      onClick={() => setDuration(d)}
                      className="px-2 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: duration.minutes === d.minutes ? "var(--accent-primary)" : "var(--bg-subtle)",
                        color: duration.minutes === d.minutes ? "white" : "var(--text-secondary)",
                        border: `1px solid ${duration.minutes === d.minutes ? "var(--accent-primary)" : "var(--border-light)"}`
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
                      style={{
                        backgroundColor: category === cat ? "var(--accent-primary)" : "var(--bg-subtle)",
                        color: category === cat ? "white" : "var(--text-secondary)"
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  <MapPin className="w-4 h-4" /> Location (optional)
                </label>
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Central Park, NYC"
                  className="w-full px-4 py-2 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Mood (optional)
                </label>
                <input
                  value={moodTag}
                  onChange={(e) => setMoodTag(e.target.value)}
                  placeholder="e.g. 😊 Happy, 🤔 Thinking"
                  className="w-full px-4 py-2 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-light)"
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploading ? "Uploading..." : "Posting..."}
                    </>
                  ) : (
                    "✨ Post to Now Board"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}