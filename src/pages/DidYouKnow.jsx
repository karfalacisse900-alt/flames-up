import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Heart, ExternalLink, Plus, X, ChevronLeft, Lightbulb, Sparkles, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const MAX_CONTENT = 500;
const MAX_TITLE = 80;

// ── Submit Form ──────────────────────────────────────────
function SubmitForm({ user, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [moderationError, setModerationError] = useState(null);

  const handleSubmit = async () => {
    if (!content.trim() || content.length > MAX_CONTENT || !agreed) return;
    setSubmitting(true);
    setModerationError(null);

    // AI Moderation check
    const modRes = await base44.functions.invoke("moderateContent", {
      text: content + (title ? " " + title : ""),
      content_type: "did_you_know",
    });
    const verdict = modRes.data?.verdict;
    if (verdict === "block") {
      setSubmitting(false);
      setModerationError("Your submission was flagged as inappropriate and cannot be submitted.");
      return;
    }

    await base44.entities.DidYouKnow.create({
      title: title.trim().slice(0, MAX_TITLE),
      content: content.trim(),
      source_link: sourceLink.trim() || undefined,
      status: verdict === "review" ? "pending" : "pending",
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
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        <div className="text-5xl mb-4">✅</div>
      </motion.div>
      <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Submitted for review!</p>
      <p className="text-sm mt-1" style={{ color: "var(--text-hint)" }}>Appears once approved by admin.</p>
    </div>
  );

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Share a Fact</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
        </button>
      </div>

      {moderationError && (
        <div className="p-3 rounded-xl text-xs font-medium" style={{ backgroundColor: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
          ⚠️ {moderationError}
        </div>
      )}

      <div>
        <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Title <span style={{ color: "var(--text-hint)" }}>(optional)</span></label>
        <input value={title} maxLength={MAX_TITLE} onChange={e => setTitle(e.target.value)}
          placeholder="Short title..."
          className="w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        <p className="text-right text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>{title.length}/{MAX_TITLE}</p>
      </div>

      <div>
        <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          Fact / Tip <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <textarea value={content} maxLength={MAX_CONTENT} onChange={e => setContent(e.target.value)}
          rows={4} placeholder="Did you know that..."
          className="w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        <p className="text-right text-[10px] mt-0.5" style={{ color: content.length > MAX_CONTENT * 0.9 ? "#ef4444" : "var(--text-hint)" }}>
          {content.length}/{MAX_CONTENT}
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Source Link <span style={{ color: "var(--text-hint)" }}>(optional)</span></label>
        <input value={sourceLink} onChange={e => setSourceLink(e.target.value)}
          placeholder="https://..." type="url"
          className="w-full mt-1.5 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
      </div>

      <button onClick={() => setAgreed(a => !a)}
        className="w-full flex items-start gap-3 p-3 rounded-xl text-left"
        style={{ backgroundColor: agreed ? "var(--accent-primary-light)" : "var(--bg-subtle)", border: `1px solid ${agreed ? "var(--accent-primary)" : "var(--border-light)"}` }}>
        <div className="mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center"
          style={{ backgroundColor: agreed ? "var(--accent-primary)" : "transparent", borderColor: agreed ? "var(--accent-primary)" : "var(--border-medium)" }}>
          {agreed && <span className="text-white text-[10px] font-bold">✓</span>}
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          I confirm this is factual, not misleading, and does not contain copyrighted or harmful content.
        </p>
      </button>

      <button onClick={handleSubmit}
        disabled={!content.trim() || !agreed || submitting || content.length > MAX_CONTENT}
        className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-all"
        style={{ backgroundColor: "var(--accent-primary)" }}>
        {submitting ? "Checking & Submitting..." : "Submit for Review"}
      </button>
    </div>
  );
}

// ── Fact Card ────────────────────────────────────────────
function FactCard({ post, user, onLike, index }) {
  const isLiked = user?.email && post.liked_by?.includes(user.email);
  const gradients = [
    "linear-gradient(135deg, #2E6B4F08 0%, #4CAF7D05 100%)",
    "linear-gradient(135deg, #D98B6208 0%, #F5A86205 100%)",
    "linear-gradient(135deg, #7C69C408 0%, #A78BFA05 100%)",
    "linear-gradient(135deg, #E05C7A08 0%, #FB923C05 100%)",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 rounded-2xl mb-3"
      style={{ background: gradients[index % 4], border: "1px solid var(--border-light)", backgroundColor: "var(--bg-card)" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg, #2E6B4F20, #4CAF7D20)" }}>
          <span className="text-lg">💡</span>
        </div>
        <div className="flex-1 min-w-0">
          {post.title && (
            <p className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>{post.title}</p>
          )}
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{post.content}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <button onClick={() => user && onLike(post)}
                className="flex items-center gap-1.5 transition-all active:scale-90">
                <Heart className={`w-4 h-4 transition-all ${isLiked ? "fill-current scale-110" : ""}`}
                  style={{ color: isLiked ? "#E05C7A" : "var(--text-hint)" }} />
                <span className="text-xs font-semibold" style={{ color: isLiked ? "#E05C7A" : "var(--text-hint)" }}>
                  {post.like_count || 0}
                </span>
              </button>
              {post.source_link && (
                <a href={post.source_link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
                  <ExternalLink className="w-3 h-3" /> Source
                </a>
              )}
            </div>
            <p className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {post.is_anonymous ? "Anonymous" : post.submitter_name || "Community"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────
export default function DidYouKnowPage() {
  const qc = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

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

  const filtered = posts.filter(p =>
    !search ||
    p.content?.toLowerCase().includes(search.toLowerCase()) ||
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const topFacts = [...posts].sort((a, b) => (b.like_count || 0) - (a.like_count || 0)).slice(0, 3);

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      {/* Header */}
      <div className="sticky top-0 z-30"
        style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Home")} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Did You Know?</h1>
                <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{posts.length} community facts</p>
              </div>
            </div>
          </div>
          {user && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
              <Plus className="w-3.5 h-3.5" /> Submit
            </button>
          )}
        </div>
      </div>

      {/* Hero banner */}
      <div className="mx-4 mt-4 p-4 rounded-2xl"
        style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", color: "white" }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide opacity-90">Community Knowledge</span>
        </div>
        <p className="text-sm font-medium leading-relaxed opacity-90">
          Discover fascinating facts, tips, and insights shared by the community. Learn something new every day!
        </p>
        {!user && (
          <p className="text-[11px] mt-2 opacity-70">Log in to submit your own facts ✍️</p>
        )}
      </div>

      {/* Top facts */}
      {topFacts.length > 0 && (
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🏆</span>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Most Liked</p>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {topFacts.map(post => (
              <div key={post.id} className="shrink-0 w-52 p-3 rounded-2xl"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                {post.title && <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--accent-primary)" }}>{post.title}</p>}
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--text-primary)" }}>{post.content}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Heart className="w-3 h-3 fill-current" style={{ color: "#E05C7A" }} />
                  <span className="text-[10px] font-bold" style={{ color: "#E05C7A" }}>{post.like_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-4 mt-4 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search facts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        </div>
      </div>

      {/* All facts */}
      <div className="px-4 pt-2 pb-8">
        {isLoading ? (
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--text-hint)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {search ? "No matching facts" : "No facts yet"}
            </p>
            {!search && user && (
              <button onClick={() => setShowForm(true)}
                className="mt-3 text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                Be the first to submit! ✍️
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs mb-3" style={{ color: "var(--text-hint)" }}>
              {filtered.length} fact{filtered.length !== 1 ? "s" : ""}
              {search ? ` matching "${search}"` : ""}
            </p>
            {filtered.map((post, i) => (
              <FactCard key={post.id} post={post} user={user} onLike={p => likeMut.mutate(p)} index={i} />
            ))}
          </>
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