import React, { useState, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { checkContent } from "../moderation/moderationHelper";

export default function QuickTipComposer({ user, onPosted }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postedFlash, setPostedFlash] = useState(false);
  const textareaRef = useRef(null);
  const qc = useQueryClient();

  // Auto-resize textarea
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight + 2, 40)}px`;
  }, [text]);

  const handlePost = async () => {
    if (!text.trim() || posting || !user) return;
    setPosting(true);
    try {
      const mod = await checkContent(text.trim());
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

  return (
    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div
        className="rounded-3xl px-4 py-3 flex flex-col gap-2"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1.5px solid var(--border-light)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--accent-primary-light)" }}>
            <Zap className="w-3 h-3" style={{ color: "var(--accent-primary)" }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent-primary)" }}>
            Share a Tip
          </span>
        </div>

        {/* Input row */}
        <div className="flex items-end gap-2">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              {(user.full_name?.[0] || "U").toUpperCase()}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost(); }
            }}
            placeholder="Share a quick tip with the community…"
            className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
            style={{
              color: "var(--text-primary)",
              fontSize: 15,
              minHeight: 40,
              border: "none",
              boxShadow: "none",
              padding: 0,
              borderRadius: 0,
              transform: "none",
            }}
            rows={1}
          />

          <button
            onClick={handlePost}
            disabled={!text.trim() || posting}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all"
            style={{
              background: text.trim() ? "linear-gradient(135deg, #E05C7A, #F97316)" : "var(--bg-subtle)",
              border: text.trim() ? "none" : "1.5px solid var(--border-medium)",
              minHeight: "unset",
              minWidth: "unset",
            }}
          >
            <ArrowUp className="w-4 h-4" style={{ color: text.trim() ? "#fff" : "var(--text-hint)" }} />
          </button>
        </div>

        <AnimatePresence>
          {postedFlash && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-semibold"
              style={{ color: "var(--accent-secondary)" }}
            >
              ✓ Tip posted!
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}