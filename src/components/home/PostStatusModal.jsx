import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, Video as VideoIcon, Loader2, Type, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
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

const TEXT_POSITIONS = [
  { id: "top-left",     label: "↖", style: { top: 40, left: 16, textAlign: "left" } },
  { id: "top-center",   label: "↑",  style: { top: 40, left: "50%", transform: "translateX(-50%)", textAlign: "center" } },
  { id: "top-right",    label: "↗", style: { top: 40, right: 16, textAlign: "right" } },
  { id: "center-left",  label: "←",  style: { top: "50%", left: 16, transform: "translateY(-50%)", textAlign: "left" } },
  { id: "center",       label: "⊙", style: { top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" } },
  { id: "center-right", label: "→", style: { top: "50%", right: 16, transform: "translateY(-50%)", textAlign: "right" } },
  { id: "bottom-left",  label: "↙", style: { bottom: 50, left: 16, textAlign: "left" } },
  { id: "bottom-center",label: "↓", style: { bottom: 50, left: "50%", transform: "translateX(-50%)", textAlign: "center" } },
  { id: "bottom-right", label: "↘", style: { bottom: 50, right: 16, textAlign: "right" } },
];

const FONT_SIZES = [
  { label: "S", size: 18 },
  { label: "M", size: 24 },
  { label: "L", size: 32 },
  { label: "XL", size: 40 },
];

export default function PostStatusModal({ user, onClose, onPosted }) {
  const groupId = null;
  const groupName = null;
  const [text, setText] = useState("");
  const [bg, setBg] = useState(BG_PRESETS[0]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [textPosition, setTextPosition] = useState("center");
  const [fontSize, setFontSize] = useState(24);
  const [showTextOptions, setShowTextOptions] = useState(false);

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setMediaUrl(file_url);
    setMediaType(type);
    setUploading(false);
  };

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);

    const existingProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    let userProfile;
    if (existingProfiles.length > 0) {
      userProfile = existingProfiles[0];
      if (existingProfiles.length > 1) {
        for (let i = 1; i < existingProfiles.length; i++) {
          base44.entities.UserProfile.delete(existingProfiles[i].id).catch(() => {});
        }
      }
    } else {
      userProfile = await base44.entities.UserProfile.create({
        user_email: user.email,
        user_name: user.full_name || user.email.split("@")[0],
        status_count: 0,
      });
    }

    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await base44.entities.CreatorStatus.create({
      author_email: user.email,
      author_name: user.full_name || user.email?.split("@")[0] || "Creator",
      creator_profile_id: userProfile.id,
      author_type: groupId ? "group_owner" : "creator",
      text: text.trim(),
      text_position: textPosition,
      text_size: fontSize,
      background: mediaUrl ? undefined : bg,
      image_url: mediaType === "image" ? mediaUrl : undefined,
      video_url: mediaType === "video" ? mediaUrl : undefined,
      group_id: groupId || undefined,
      group_name: groupName || undefined,
      expires_at: expires,
      view_count: 0,
      viewed_by: [],
    });

    await base44.entities.UserProfile.update(userProfile.id, {
      status_count: (userProfile.status_count || 0) + 1,
    });

    setPosting(false);
    onPosted?.();
    onClose();
  };

  const posConfig = TEXT_POSITIONS.find(p => p.id === textPosition) || TEXT_POSITIONS[4];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={e => e.stopPropagation()}>

        {/* Preview — full aspect ratio story style */}
        <div className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "9/16",
            maxHeight: "55vh",
            background: !mediaUrl ? bg : undefined,
          }}>

          {/* Background media fills with no black bars */}
          {mediaType === "image" && mediaUrl && (
            <img src={mediaUrl} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
          )}
          {mediaType === "video" && mediaUrl && (
            <video src={mediaUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
          )}

          {/* Dark overlay for readability */}
          {mediaUrl && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />}

          {/* Close */}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Overlay text at chosen position */}
          {text && (
            <div className="absolute z-10 max-w-[80%]" style={{ ...posConfig.style }}>
              <p style={{
                color: "#fff",
                fontFamily: "var(--font-serif)",
                fontSize: fontSize,
                fontWeight: 700,
                lineHeight: 1.25,
                textShadow: "0 2px 16px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.9)",
                textAlign: posConfig.style.textAlign,
              }}>
                {text}
              </p>
            </div>
          )}

          {/* Group tag */}
          {groupName && (
            <span className="absolute bottom-3 left-3 text-xs font-bold text-white/80 z-10">📍 {groupName}</span>
          )}
        </div>

        <div className="p-4 space-y-3 max-h-[45vh] overflow-y-auto">
          {/* Text input */}
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Type your caption… it will appear as overlay text"
            rows={2} maxLength={180}
            className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

          {/* Text options toggle */}
          <button onClick={() => setShowTextOptions(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: showTextOptions ? "var(--accent-primary-light)" : "var(--bg-subtle)", color: showTextOptions ? "var(--accent-primary)" : "var(--text-secondary)" }}>
            <Type className="w-3.5 h-3.5" /> Text Style
          </button>

          <AnimatePresence>
            {showTextOptions && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3">
                {/* Font size */}
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-hint)" }}>Size</p>
                  <div className="flex gap-2">
                    {FONT_SIZES.map(f => (
                      <button key={f.size} onClick={() => setFontSize(f.size)}
                        className="w-10 h-10 rounded-xl text-sm font-bold transition-all"
                        style={{ backgroundColor: fontSize === f.size ? "var(--accent-primary)" : "var(--bg-subtle)", color: fontSize === f.size ? "#fff" : "var(--text-secondary)" }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Position grid */}
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-hint)" }}>Position</p>
                  <div className="grid grid-cols-3 gap-1.5 w-28">
                    {TEXT_POSITIONS.map(p => (
                      <button key={p.id} onClick={() => setTextPosition(p.id)}
                        className="w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all"
                        style={{ backgroundColor: textPosition === p.id ? "var(--accent-primary)" : "var(--bg-subtle)", color: textPosition === p.id ? "#fff" : "var(--text-secondary)" }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background picker */}
          {!mediaUrl && (
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

          {/* Media upload */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              {mediaType === "image" ? "Change photo" : "Add photo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, "image")} />
            </label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <VideoIcon className="w-4 h-4" />}
              {mediaType === "video" ? "Change video" : "Add video"}
              <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, "video")} />
            </label>
            {mediaUrl && (
              <button onClick={() => { setMediaUrl(""); setMediaType(null); }} className="text-xs font-semibold"
                style={{ color: "#E05C7A" }}>Remove</button>
            )}
          </div>

          {/* Post button */}
          <button onClick={handlePost} disabled={!text.trim() || posting}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: bg }}>
            {posting ? "Posting…" : groupId ? "Post Group Status" : "Post Status (48h)"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}