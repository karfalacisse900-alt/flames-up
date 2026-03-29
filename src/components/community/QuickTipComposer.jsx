import React, { useState, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Video, FileText, MoreHorizontal, Globe, Users, ChevronDown, X, Camera, Link2, AlignLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { checkContent } from "../moderation/moderationHelper";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

const AUDIENCES = [
  { id: "everyone", label: "Everyone", icon: Globe },
  { id: "connections", label: "Connections", icon: Users },
];

export default function QuickTipComposer({ user, onPosted }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postedFlash, setPostedFlash] = useState(false);
  const [audience, setAudience] = useState("everyone");
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const docInputRef = useRef(null);
  const qc = useQueryClient();

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight + 2, 72)}px`;
  }, [text]);

  const handlePost = async () => {
    if (!text.trim() || posting || !user) return;
    setPosting(true);
    try {
      await checkContent(text.trim());
      await base44.entities.CommunityPost.create({
        type: "tip",
        title: "",
        body: text.trim(),
        image_url: uploadedImage || undefined,
        author_email: user.email,
        author_name: user.display_name || user.full_name || "Anonymous",
        author_avatar_url: user.avatar_url || "",
        is_anonymous: false,
        upvotes: 0,
        comment_count: 0,
        tags: ["tip"],
      });
      setText("");
      setUploadedImage(null);
      setPostedFlash(true);
      setTimeout(() => { setPostedFlash(false); if (onPosted) onPosted(); }, 1500);
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
    } catch (e) {
      console.error("Tip post failed:", e);
    }
    setPosting(false);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedImage(file_url);
    } catch (e) {
      console.error("Upload failed:", e);
    }
    setUploading(false);
  };

  if (!user) return null;

  const color = getColor(user.full_name);
  const currentAudience = AUDIENCES.find(a => a.id === audience);
  const AudienceIcon = currentAudience.icon;

  return (
    <div
      className="mx-3 my-2 rounded-2xl overflow-visible"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Top bar: title + Post + X */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Start post</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePost}
            disabled={!text.trim() || posting}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)",
              color: "#fff",
              minHeight: "unset",
              minWidth: "unset",
              opacity: (!text.trim() || posting) ? 0.45 : 1,
              boxShadow: "0 2px 8px rgba(46,107,79,0.3)",
            }}
          >
            {posting ? "Posting…" : "Post"}
          </button>
          <button
            onClick={onPosted}
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}
          >
            <X className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
      </div>

      {/* Author row */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}33, ${color}66)`, color }}>
            {(user.full_name?.[0] || "U").toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {user.display_name || user.full_name || "You"}
          </span>
          {/* Audience selector */}
          <div className="relative">
            <button
              onClick={() => setShowAudiencePicker(v => !v)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: "var(--accent-primary-light)",
                border: "1px solid var(--accent-primary)",
                color: "var(--accent-primary)",
                minHeight: "unset",
                minWidth: "unset",
              }}
            >
              <AudienceIcon className="w-3 h-3" />
              {currentAudience.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showAudiencePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-8 rounded-xl overflow-hidden z-50"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 140 }}
                >
                  {AUDIENCES.map(a => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        onClick={() => { setAudience(a.id); setShowAudiencePicker(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-left"
                        style={{
                          backgroundColor: audience === a.id ? "var(--accent-primary-light)" : "transparent",
                          color: audience === a.id ? "var(--accent-primary)" : "var(--text-primary)",
                          minHeight: "unset",
                          minWidth: "unset",
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {a.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Text input */}
      <div className="px-4 pb-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handlePost(); }
          }}
          placeholder="Share a tip, thought or update with the community…"
          className="w-full bg-transparent resize-none outline-none leading-relaxed"
          style={{
            color: "var(--text-primary)",
            fontSize: 15,
            minHeight: 72,
            border: "none",
            boxShadow: "none",
            padding: 0,
            borderRadius: 0,
            transform: "none",
          }}
          rows={3}
        />
      </div>

      {/* Uploaded image preview */}
      {uploadedImage && (
        <div className="px-4 pb-2 relative">
          <img src={uploadedImage} alt="attached" className="w-full rounded-xl object-cover max-h-48" />
          <button
            onClick={() => setUploadedImage(null)}
            className="absolute top-3 right-6 w-7 h-7 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", minHeight: "unset", minWidth: "unset" }}
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {/* Hashtag chips */}
      {text.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {["#tip", "#community", "#advice"].map(tag => (
            <button
              key={tag}
              onClick={() => setText(t => t.trimEnd() + " " + tag)}
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{
                backgroundColor: "var(--accent-primary-light)",
                color: "var(--accent-primary)",
                minHeight: "unset",
                minWidth: "unset",
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="flex items-center px-2 py-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {/* Photo */}
        <button
          onClick={() => photoInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ color: "#16A34A", minHeight: "unset", minWidth: "unset" }}
          title="Photo"
        >
          <Image className="w-4 h-4" />
          <span className="hidden sm:inline">Photo</span>
        </button>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => handleFileUpload(e.target.files?.[0])} />

        {/* Camera */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ color: "#2563EB", minHeight: "unset", minWidth: "unset" }}
          title="Camera"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Camera</span>
        </button>
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => handleFileUpload(e.target.files?.[0])} />

        {/* Document */}
        <button
          onClick={() => docInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ color: "#D97706", minHeight: "unset", minWidth: "unset" }}
          title="Document"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Doc</span>
        </button>
        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
          onChange={e => handleFileUpload(e.target.files?.[0])} />

        {/* More */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowMoreMenu(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
            style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}
            title="More"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-10 right-0 rounded-xl overflow-hidden z-50"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 160 }}
              >
                {[
                  { label: "Add a link", icon: Link2, color: "#7C3AED" },
                  { label: "Write article", icon: AlignLeft, color: "#0EA5E9" },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => setShowMoreMenu(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left"
                      style={{ color: "var(--text-primary)", minHeight: "unset", minWidth: "unset" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: item.color }} />
                      {item.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {uploading && (
        <div className="px-4 pb-2 text-xs" style={{ color: "var(--text-hint)" }}>Uploading…</div>
      )}

      <AnimatePresence>
        {postedFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-3 text-xs font-semibold"
            style={{ color: "var(--accent-secondary)" }}
          >
            ✓ Posted!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}