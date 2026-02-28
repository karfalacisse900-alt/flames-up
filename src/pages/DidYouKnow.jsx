import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Heart, ExternalLink, Plus, X, ChevronLeft, Lightbulb } from "lucide-react";
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

function FactCard({ post, user, onLike }) {
  const isLiked = user?.email && post.liked_by?.includes(user.email);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl mb-3"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", background: "linear-gradient(135deg, #2E6B4F08 0%, #D98B6205 100%)" }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5 shrink-0">💡</span>
        <div className="flex-1 min-w-0">
          {post.title && (
            <p className="text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--accent-primary)" }}>{post.title}</p>
          )}
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{post.content}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <button onClick={() => user && onLike(post)}
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
            <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
              {post.is_anonymous ? "Anonymous" : post.submitter_name || "Community"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function DidYouKnowPage() {
  const qc = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [showForm, setShowForm] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["didYouKnow"],
    queryFn: () => base44.entities.DidYouKnow.filter({ status: "approved" }, "-approved_at", 50),
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

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3 flex items-center justify-between"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Home")} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Did You Know?</h1>
          </div>
        </div>
        {user && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
            <Plus className="w-3.5 h-3.5" /> Submit
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No facts yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Be the first to submit one!</p>
          </div>
        ) : (
          <div>
            <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>{posts.length} facts from the community</p>
            {posts.map(post => (
              <FactCard key={post.id} post={post} user={user} onLike={p => likeMut.mutate(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Submit form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="w-full max-w-lg mx-auto rounded-t-3xl flex flex-col"
              style={{ backgroundColor: "#FAFAF8", maxHeight: "90vh" }}
              onClick={e => e.stopPropagation()}>
              <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "#CEC8BC" }} />
              <div className="overflow-y-auto flex-1 pb-8">
                <SubmitForm user={user} onClose={() => setShowForm(false)}
                  onSuccess={() => qc.invalidateQueries({ queryKey: ["didYouKnow"] })} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}