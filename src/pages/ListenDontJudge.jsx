import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Heart, MessageCircle, Share2, Shield, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ListenDontJudge() {
  const [user, setUser] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["listenPosts"],
    queryFn: () => base44.entities.CommunityPost.filter({ tags: ["listen_dont_judge"] }, "-created_date", 100),
  });

  const likeMut = useMutation({
    mutationFn: async (post) => {
      const hasLiked = post.upvoted_by?.includes(user?.email);
      const newUpvotes = hasLiked ? Math.max(0, (post.upvotes || 0) - 1) : (post.upvotes || 0) + 1;
      const newUpvotedBy = hasLiked
        ? (post.upvoted_by || []).filter(e => e !== user.email)
        : [...(post.upvoted_by || []), user.email];
      await base44.entities.CommunityPost.update(post.id, {
        upvotes: newUpvotes,
        upvoted_by: newUpvotedBy,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listenPosts"] }),
  });

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-4 border-b"
        style={{
          background: "linear-gradient(180deg, rgba(242,237,228,0.98), rgba(242,237,228,0.92))",
          backdropFilter: "blur(16px)",
          borderColor: "var(--border-light)",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              🤍
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                Listen, Don't Judge
              </h1>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                A safe space to share openly
              </p>
            </div>
            {user && (
              <button
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
              >
                <Plus className="w-4 h-4" /> Share
              </button>
            )}
          </div>

          {/* Community Guidelines Banner */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#6366f1" }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              This is a judgment-free zone. Share respectfully, listen with empathy.
            </p>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full skeleton" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 rounded skeleton" />
                    <div className="h-2.5 w-16 rounded skeleton" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 rounded skeleton" />
                  <div className="h-3 w-4/5 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">🤍</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              Be the first to share
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-hint)" }}>
              This is a safe space to express yourself without judgment
            </p>
            {user && (
              <button
                onClick={() => setShowComposer(true)}
                className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                Share Your Thoughts
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                onLike={() => user && likeMut.mutate(post)}
                isExpanded={expandedPost === post.id}
                onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Composer Modal */}
      {showComposer && <ComposerModal user={user} onClose={() => setShowComposer(false)} />}
    </div>
  );
}

function PostCard({ post, user, onLike, isExpanded, onToggle }) {
  const hasLiked = user?.email && post.upvoted_by?.includes(user.email);
  const showAuthor = !post.is_anonymous && post.author_email;
  const isLong = (post.body || "").length > 280;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Author */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            background: post.is_anonymous ? "linear-gradient(135deg, #d1d5db, #9ca3af)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
          }}
        >
          {post.is_anonymous ? "?" : (post.author_name?.[0] || "U").toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {post.is_anonymous ? "Anonymous" : post.author_name || "User"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>
            {timeAgo(post.created_date)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div>
        <p
          className="text-sm leading-relaxed whitespace-pre-line"
          style={{ color: "var(--text-secondary)" }}
        >
          {isExpanded || !isLong ? post.body : `${post.body.slice(0, 280)}...`}
        </p>
        {isLong && (
          <button
            onClick={onToggle}
            className="text-sm font-semibold mt-1"
            style={{ color: "var(--accent-primary)" }}
          >
            {isExpanded ? "See less" : "See more"}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={onLike}
          className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: hasLiked ? "#E05C7A" : "var(--text-hint)" }}
        >
          <Heart className="w-4 h-4" style={{ fill: hasLiked ? "#E05C7A" : "none" }} />
          {post.upvotes || 0}
        </button>
        <Link
          to={createPageUrl(`PostComments?postId=${post.id}`)}
          className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "var(--text-hint)" }}
        >
          <MessageCircle className="w-4 h-4" />
          {post.comment_count || 0}
        </Link>
        <button className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--text-hint)" }}>
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ComposerModal({ user, onClose }) {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [type, setType] = useState("thought");
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const qc = useQueryClient();

  const types = [
    { value: "thought", label: "💭 Personal Thought", placeholder: "What's on your mind?" },
    { value: "question", label: "❓ Question", placeholder: "What would you like to ask?" },
    { value: "advice", label: "🤝 Advice Request", placeholder: "What do you need help with?" },
    { value: "confession", label: "🗣️ Confession", placeholder: "What do you want to share?" },
    { value: "quote", label: "✨ Quote/Opinion", placeholder: "Share your wisdom..." },
  ];

  const currentType = types.find(t => t.value === type) || types[0];

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await base44.entities.CommunityPost.create({
      type: "text_only",
      body: text,
      author_email: user.email,
      author_name: user.full_name || user.email,
      is_anonymous: isAnonymous,
      tags: ["listen_dont_judge", type],
      upvotes: 0,
      upvoted_by: [],
      comment_count: 0,
    });
    qc.invalidateQueries({ queryKey: ["listenPosts"] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--bg-modal)" }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          Share Your Thoughts
        </h3>

        {/* Type selector */}
        <div className="relative mb-4">
          <button
            onClick={() => setShowTypeMenu(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
          >
            <span style={{ color: "var(--text-primary)" }}>{currentType.label}</span>
            <ChevronDown className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
          </button>
          {showTypeMenu && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
              style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid var(--border-light)" }}
            >
              {types.map(t => (
                <button
                  key={t.value}
                  onClick={() => { setType(t.value); setShowTypeMenu(false); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--bg-subtle)]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={currentType.placeholder}
          className="w-full px-4 py-3 rounded-xl text-sm resize-none"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
            minHeight: "150px",
          }}
        />

        <label className="flex items-center gap-3 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-5 h-5 rounded"
          />
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Post anonymously
          </span>
        </label>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", opacity: text.trim() ? 1 : 0.5 }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}