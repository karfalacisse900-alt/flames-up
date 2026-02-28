import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Heart, ExternalLink, Plus, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const MAX_CONTENT = 500;
const MAX_TITLE = 80;

function SubmitForm({ user, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || content.length > MAX_CONTENT || !agreed) return;
    setSubmitting(true);
    await base44.entities.DidYouKnow.create({
      title: title.trim().slice(0, MAX_TITLE),
      content: content.trim(),
      source_link: sourceLink.trim() || undefined,
      status: "pending",
      submitter_email: user?.email,
      submitter_name: user?.full_name,
      like_count: 0,
      liked_by: [],
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(() => { onSuccess?.(); onClose(); }, 1800);
  };

  if (done) return (
    <div className="p-6 text-center">
      <div className="text-4xl mb-3">✅</div>
      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Submitted for review!</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Your submission will appear once approved by admin.</p>
    </div>
  );

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Share a Did You Know?</h3>
        <button onClick={onClose} className="p-1"><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>
      </div>

      <div>
        <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Title (optional)</label>
        <input value={title} maxLength={MAX_TITLE} onChange={e => setTitle(e.target.value)}
          placeholder="Short title..." className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        <p className="text-right text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>{title.length}/{MAX_TITLE}</p>
      </div>

      <div>
        <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Fact / Tip <span style={{ color: "#ef4444" }}>*</span></label>
        <textarea value={content} maxLength={MAX_CONTENT} onChange={e => setContent(e.target.value)}
          rows={4} placeholder="Did you know that..." className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none resize-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        <p className="text-right text-[10px] mt-0.5" style={{ color: content.length > MAX_CONTENT * 0.9 ? "#ef4444" : "var(--text-hint)" }}>{content.length}/{MAX_CONTENT}</p>
      </div>

      <div>
        <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Source Link (optional)</label>
        <input value={sourceLink} onChange={e => setSourceLink(e.target.value)}
          placeholder="https://..." type="url" className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
        <button onClick={() => setAgreed(a => !a)} className="mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center"
          style={{ backgroundColor: agreed ? "var(--accent-primary)" : "transparent", borderColor: agreed ? "var(--accent-primary)" : "var(--border-medium)" }}>
          {agreed && <span className="text-white text-[10px] font-bold">✓</span>}
        </button>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          I confirm this is factual, not misleading, and does not contain copyrighted or harmful content.
        </p>
      </div>

      <button onClick={handleSubmit} disabled={!content.trim() || !agreed || submitting || content.length > MAX_CONTENT}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-all"
        style={{ backgroundColor: "var(--accent-primary)" }}>
        {submitting ? "Submitting..." : "Submit for Review"}
      </button>
    </div>
  );
}

export default function DidYouKnowSection({ user }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [current, setCurrent] = useState(0);

  const { data: posts = [] } = useQuery({
    queryKey: ["didYouKnow"],
    queryFn: () => base44.entities.DidYouKnow.filter({ status: "approved" }, "-approved_at", 20),
  });

  const likeMut = useMutation({
    mutationFn: (post) => {
      const liked = post.liked_by?.includes(user?.email);
      if (liked) {
        return base44.entities.DidYouKnow.update(post.id, {
          like_count: Math.max(0, (post.like_count || 0) - 1),
          liked_by: (post.liked_by || []).filter(e => e !== user?.email),
        });
      }
      return base44.entities.DidYouKnow.update(post.id, {
        like_count: (post.like_count || 0) + 1,
        liked_by: [...(post.liked_by || []), user?.email],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["didYouKnow"] }),
  });

  if (posts.length === 0) return null;

  const post = posts[current];
  const isLiked = user?.email && post.liked_by?.includes(user.email);

  return (
    <div className="px-4 pt-4 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Link to={createPageUrl("DidYouKnow")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-lg">💡</span>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Did You Know?</p>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
        </Link>
        {user && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)30" }}>
            <Plus className="w-3 h-3" /> Submit
          </button>
        )}
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div key={post.id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="p-4 rounded-2xl"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", background: "linear-gradient(135deg, #2E6B4F08 0%, #D98B6205 100%)" }}>
          {post.title && (
            <p className="text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--accent-primary)" }}>{post.title}</p>
          )}
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{post.content}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <button onClick={() => user && likeMut.mutate(post)}
                className="flex items-center gap-1.5 transition-all active:scale-90">
                <Heart className={`w-4 h-4 transition-colors ${isLiked ? "fill-current" : ""}`}
                  style={{ color: isLiked ? "#E05C7A" : "var(--text-hint)" }} />
                <span className="text-xs font-medium" style={{ color: isLiked ? "#E05C7A" : "var(--text-hint)" }}>{post.like_count || 0}</span>
              </button>
              {post.source_link && (
                <a href={post.source_link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs" style={{ color: "var(--accent-primary)" }}>
                  <ExternalLink className="w-3 h-3" /> Source
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
                {post.is_anonymous ? "Anonymous" : post.submitter_name || "Community"}
              </p>
              <div className="flex gap-1">
                {posts.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ backgroundColor: i === current ? "var(--accent-primary)" : "var(--border-medium)" }} />
                ))}
              </div>
              {current < posts.length - 1 && (
                <button onClick={() => setCurrent(c => Math.min(posts.length - 1, c + 1))}>
                  <ChevronRight className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Submit form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setShowForm(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full rounded-t-3xl max-h-[92vh] overflow-y-auto"
              style={{ backgroundColor: "var(--bg-modal)" }}
              onClick={e => e.stopPropagation()}>
              <SubmitForm user={user} onClose={() => setShowForm(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ["didYouKnow"] })} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}