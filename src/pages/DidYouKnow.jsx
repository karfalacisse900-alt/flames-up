import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Heart, ExternalLink, Plus, X, ChevronLeft, Lightbulb, Sparkles, TrendingUp } from "lucide-react";
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
    <div className="p-8 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
        <div className="text-5xl mb-4">✅</div>
      </motion.div>
      <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Submitted for review!</p>
      <p className="text-sm mt-1" style={{ color: "var(--text-hint)" }}>Your fact will appear once approved.</p>
    </div>
  );

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-primary-light)" }}>
            <Lightbulb className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          </div>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Share a Fact</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
        </button>
      </div>

      <div>
        <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Title <span style={{ color: "var(--text-hint)" }}>(optional)</span></label>
        <input value={title} maxLength={MAX_TITLE} onChange={e => setTitle(e.target.value)}
          placeholder="Short title..."
          className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        <p className="text-right text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>{title.length}/{MAX_TITLE}</p>
      </div>

      <div>
        <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          Fact / Tip <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <textarea value={content} maxLength={MAX_CONTENT} onChange={e => setContent(e.target.value)}
          rows={4} placeholder="Did you know that..."
          className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: `1px solid ${content.length > MAX_CONTENT * 0.9 ? "#ef4444" : "var(--border-light)"}`, color: "var(--text-primary)" }} />
        <p className="text-right text-[10px] mt-0.5" style={{ color: content.length > MAX_CONTENT * 0.9 ? "#ef4444" : "var(--text-hint)" }}>{content.length}/{MAX_CONTENT}</p>
      </div>

      <div>
        <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Source Link <span style={{ color: "var(--text-hint)" }}>(optional)</span></label>
        <input value={sourceLink} onChange={e => setSourceLink(e.target.value)}
          placeholder="https://..."
          type="url"
          className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
      </div>

      <button onClick={() => setAgreed(a => !a)}
        className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
        style={{ backgroundColor: agreed ? "var(--accent-primary-light)" : "var(--bg-subtle)", border: `1px solid ${agreed ? "var(--accent-primary)" : "var(--border-light)"}` }}>
        <div className="mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
          style={{ backgroundColor: agreed ? "var(--accent-primary)" : "transparent", borderColor: agreed ? "var(--accent-primary)" : "var(--border-medium)" }}>
          {agreed && <span className="text-white text-[11px] font-bold">✓</span>}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          I confirm this is factual, not misleading, and does not contain copyrighted or harmful content.
        </p>
      </button>

      <button onClick={handleSubmit}
        disabled={!content.trim() || !agreed || submitting || content.length > MAX_CONTENT}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
        style={{ backgroundColor: "var(--accent-primary)", boxShadow: agreed && content.trim() ? "0 4px 16px rgba(46,107,79,0.3)" : "none" }}>
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
      className="p-5 rounded-2xl mb-3 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, var(--accent-primary), transparent)", transform: "translate(30%, -30%)" }} />

      <div className="flex items-start gap-3 relative">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
          <Lightbulb className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div className="flex-1 min-w-0">
          {post.title && (
            <p className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>{post.title}</p>
          )}
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{post.content}</p>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <button onClick={() => user && onLike(post)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                style={{ backgroundColor: isLiked ? "#FEF0F4" : "var(--bg-subtle)", border: `1px solid ${isLiked ? "#E05C7A40" : "var(--border-light)"}` }}>
                <Heart className={`w-3.5 h-3.5 transition-all ${isLiked ? "fill-current scale-110" : ""}`}
                  style={{ color: isLiked ? "#E05C7A" : "var(--text-hint)" }} />
                <span className="text-xs font-semibold" style={{ color: isLiked ? "#E05C7A" : "var(--text-hint)" }}>{post.like_count || 0}</span>
              </button>
              {post.source_link && (
                <a href={post.source_link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                  <ExternalLink className="w-3 h-3" /> Source
                </a>
              )}
            </div>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-hint)" }}>
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
  const [sortBy, setSortBy] = useState("newest");

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["didYouKnow"],
    queryFn: () => base44.entities.DidYouKnow.filter({ status: "approved" }, "-approved_at", 100),
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

  const sorted = [...posts].sort((a, b) => {
    if (sortBy === "top") return (b.like_count || 0) - (a.like_count || 0);
    return new Date(b.approved_at || b.created_date) - new Date(a.approved_at || a.created_date);
  });

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-4 pb-6"
        style={{ background: "linear-gradient(135deg, #2E6B4F15 0%, #D98B6210 100%)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center justify-between mb-4">
          <Link to={createPageUrl("Home")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-card)" }}>
            <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
          </Link>
          {user && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 12px rgba(46,107,79,0.3)" }}>
              <Plus className="w-4 h-4" /> Share a Fact
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Did You Know?</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{posts.length} community facts</p>
          </div>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        {[["newest", "🕐 Newest", TrendingUp], ["top", "❤️ Most Liked", Sparkles]].map(([val, label]) => (
          <button key={val} onClick={() => setSortBy(val)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: sortBy === val ? "var(--accent-primary)" : "var(--bg-card)",
              color: sortBy === val ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border-light)",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pt-2 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "linear-gradient(135deg, #2E6B4F15, #4CAF7D10)" }}>
                <Lightbulb className="w-10 h-10" style={{ color: "var(--accent-primary)", opacity: 0.5 }} />
              </div>
            </motion.div>
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>No facts yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-hint)" }}>Be the first to share something interesting!</p>
            {user && (
              <button onClick={() => setShowForm(true)}
                className="mt-4 px-6 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                Share a Fact
              </button>
            )}
          </div>
        ) : (
          sorted.map(post => (
            <FactCard key={post.id} post={post} user={user} onLike={p => likeMut.mutate(p)} />
          ))
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