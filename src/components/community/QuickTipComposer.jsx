import React, { useState, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Video, FileText, MoreHorizontal, Globe, ChevronDown, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { checkContent } from "../moderation/moderationHelper";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function QuickTipComposer({ user, onPosted }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postedFlash, setPostedFlash] = useState(false);
  const textareaRef = useRef(null);
  const qc = useQueryClient();

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight + 2, 60)}px`;
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
        author_email: user.email,
        author_name: user.display_name || user.full_name || "Anonymous",
        author_avatar_url: user.avatar_url || "",
        is_anonymous: false,
        upvotes: 0,
        comment_count: 0,
        tags: ["tip"],
      });
      setText("");
      setPostedFlash(true);
      setTimeout(() => { setPostedFlash(false); if (onPosted) onPosted(); }, 1500);
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
    } catch (e) {
      console.error("Tip post failed:", e);
    }
    setPosting(false);
  };

  if (!user) return null;

  const color = getColor(user.full_name);

  return (
    <div
      className="mx-3 my-2 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Start post</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePost}
            disabled={!text.trim() || posting}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: text.trim() ? "linear-gradient(135deg, #2E6B4F, #4CAF7D)" : "var(--bg-subtle)",
              color: text.trim() ? "#fff" : "var(--text-hint)",
              minHeight: "unset",
              minWidth: "unset",
              boxShadow: text.trim() ? "0 2px 8px rgba(46,107,79,0.3)" : "none",
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
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}33, ${color}66)`, color }}
          >
            {(user.full_name?.[0] || "U").toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {user.display_name || user.full_name || "You"}
          </span>
          <button
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              color: "var(--text-secondary)",
              minHeight: "unset",
              minWidth: "unset",
            }}
          >
            <Globe className="w-3 h-3" />
            Everyone
            <ChevronDown className="w-3 h-3" />
          </button>
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
          placeholder="Share a tip with the community…"
          className="w-full bg-transparent resize-none outline-none leading-relaxed"
          style={{
            color: "var(--text-primary)",
            fontSize: 15,
            minHeight: 60,
            border: "none",
            boxShadow: "none",
            padding: 0,
            borderRadius: 0,
            transform: "none",
          }}
          rows={2}
        />
      </div>

      {/* Hashtag suggestions */}
      {text.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {["#tip", "#community", "#advice"].map(tag => (
            <button
              key={tag}
              onClick={() => setText(t => t + " " + tag)}
              className="text-xs px-2.5 py-1 rounded-full font-medium"
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
      <div className="flex items-center gap-1 px-3 py-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {[
          { icon: Image, label: "Photo" },
          { icon: Video, label: "Video" },
          { icon: FileText, label: "Document" },
          { icon: MoreHorizontal, label: "More" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
            style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}
            title={label}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {postedFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-3 text-xs font-semibold"
            style={{ color: "var(--accent-secondary)" }}
          >
            ✓ Tip posted!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}