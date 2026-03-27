import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Loader2, MapPin, ChevronDown, Image, Type, Video } from "lucide-react";

const DURATIONS = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "3h", minutes: 180 },
  { label: "12h", minutes: 720 },
  { label: "24h", minutes: 1440 },
  { label: "3d", minutes: 4320 },
  { label: "7d", minutes: 10080 },
];

const MOODS = ["😊", "🔥", "😴", "🤔", "💪", "🥺", "🎉", "😤", "❤️", "👀"];
const CATEGORIES = [
  { id: "general", label: "General", emoji: "💬" },
  { id: "food", label: "Food", emoji: "🍕" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "question", label: "Question", emoji: "❓" },
  { id: "events", label: "Events", emoji: "🎪" },
  { id: "local_tips", label: "Tips", emoji: "💡" },
];

export default function CreateNowStatusModal({ user, onClose, onCreated }) {
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [contentType, setContentType] = useState("text");
  const [duration, setDuration] = useState(DURATIONS[4]);
  const [category, setCategory] = useState("general");
  const [mood, setMood] = useState("");
  const [locationName, setLocationName] = useState("");
  const [saving, setSaving] = useState(false);
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
    try {
      let mediaUrl = null;
      if (mediaFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
        mediaUrl = file_url;
      }
      const expiresAt = new Date(Date.now() + duration.minutes * 60000).toISOString();
      await base44.entities.NowStatus.create({
        author_email: user.email,
        author_name: user.full_name || user.email,
        author_avatar_url: user.avatar_url || "",
        content_type: contentType,
        text: contentType === "text" ? text.trim() : (text.trim() || undefined),
        media_url: mediaUrl,
        duration_minutes: duration.minutes,
        expires_at: expiresAt,
        category,
        mood_tag: mood || undefined,
        location_name: locationName || undefined,
        is_active: true,
        reactions: {},
        reaction_users: {},
      });
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const canPost = contentType === "text" ? text.trim().length > 0 : !!mediaFile;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-[2rem] overflow-hidden"
          style={{ backgroundColor: "#0D1117", maxHeight: "92dvh", overflowY: "auto" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header row */}
          <div className="flex items-center justify-between px-5 pt-3 pb-4">
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)", minHeight: "unset", minWidth: "unset" }}>
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Content type switcher */}
            <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              {[
                { type: "text", icon: Type },
                { type: "photo", icon: Image },
                { type: "video", icon: Video },
              ].map(({ type, icon: Icon }) => (
                <button key={type} onClick={() => { setContentType(type); setMediaFile(null); setMediaPreview(null); }}
                  className="w-9 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ backgroundColor: contentType === type ? "white" : "transparent", minHeight: "unset", minWidth: "unset" }}>
                  <Icon className="w-4 h-4" style={{ color: contentType === type ? "#0D1117" : "rgba(255,255,255,0.5)" }} />
                </button>
              ))}
            </div>

            <button
              onClick={handleCreate}
              disabled={!canPost || saving}
              className="px-5 py-2 rounded-full text-sm font-bold transition-all"
              style={{ backgroundColor: canPost && !saving ? "white" : "rgba(255,255,255,0.15)", color: canPost && !saving ? "#0D1117" : "rgba(255,255,255,0.4)", minHeight: "unset" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
            </button>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-5 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
              {user?.full_name?.[0] || "?"}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.full_name || "You"}</p>
              <div className="flex items-center gap-1.5">
                {/* Duration picker */}
                <div className="relative">
                  <select
                    value={duration.minutes}
                    onChange={e => setDuration(DURATIONS.find(d => d.minutes === Number(e.target.value)))}
                    className="appearance-none text-xs font-semibold pl-2 pr-5 py-0.5 rounded-full cursor-pointer"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", border: "none", backgroundImage: "none", minHeight: "unset" }}
                  >
                    {DURATIONS.map(d => <option key={d.minutes} value={d.minutes}>{d.label}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.5)" }} />
                </div>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
                {/* Category */}
                <div className="relative">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="appearance-none text-xs font-semibold pl-2 pr-5 py-0.5 rounded-full cursor-pointer"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", border: "none", backgroundImage: "none", minHeight: "unset" }}
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.5)" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Main input */}
          <div className="px-5">
            {contentType === "text" ? (
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What's happening right now?"
                maxLength={280}
                rows={5}
                className="w-full resize-none outline-none text-xl font-medium leading-relaxed"
                style={{ backgroundColor: "transparent", color: "white", border: "none", caretColor: "#6366F1" }}
              />
            ) : (
              <>
                <input ref={mediaInputRef} type="file" accept={contentType === "photo" ? "image/*" : "video/*"} onChange={handleMediaPick} className="hidden" />
                {mediaPreview ? (
                  <div className="relative rounded-2xl overflow-hidden mb-3" style={{ maxHeight: 340 }}>
                    {contentType === "photo"
                      ? <img src={mediaPreview} alt="" className="w-full object-cover rounded-2xl" />
                      : <video src={mediaPreview} className="w-full rounded-2xl" controls />}
                    <button onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)", minHeight: "unset", minWidth: "unset" }}>
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => mediaInputRef.current?.click()}
                    className="w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 mb-3 transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.04)" }}>
                    {contentType === "photo" ? <Image className="w-8 h-8 text-white/30" /> : <Video className="w-8 h-8 text-white/30" />}
                    <span className="text-sm text-white/40">Tap to add {contentType}</span>
                  </button>
                )}
                {/* Caption for media */}
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={140}
                  rows={2}
                  className="w-full resize-none outline-none text-base"
                  style={{ backgroundColor: "transparent", color: "white", border: "none", caretColor: "#6366F1" }}
                />
              </>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="px-5 py-4 mt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {/* Mood row */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
              {MOODS.map(m => (
                <button key={m} onClick={() => setMood(mood === m ? "" : m)}
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all"
                  style={{ backgroundColor: mood === m ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)", border: mood === m ? "2px solid #6366F1" : "2px solid transparent", minHeight: "unset", minWidth: "unset" }}>
                  {m}
                </button>
              ))}
            </div>

            {/* Location row */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
              <input
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="Add location..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "rgba(255,255,255,0.6)", border: "none", minHeight: "unset" }}
              />
            </div>

            {/* Char count */}
            {contentType === "text" && text.length > 200 && (
              <p className="text-xs mt-2 text-right" style={{ color: text.length > 270 ? "#EF4444" : "rgba(255,255,255,0.35)" }}>
                {280 - text.length}
              </p>
            )}
          </div>

          {/* Safe area spacer */}
          <div style={{ height: "env(safe-area-inset-bottom, 16px)" }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}