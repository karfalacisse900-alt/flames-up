import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Heart, MessageCircle, Share2, Shield, ChevronDown, X, Check } from "lucide-react";
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

const TOPICS = [
  { value: "all",            label: "All",            emoji: "✨" },
  { value: "opinion",        label: "Opinions",       emoji: "💬" },
  { value: "question",       label: "Questions",      emoji: "❓" },
  { value: "quote",          label: "Quotes",         emoji: "✍️" },
  { value: "confession",     label: "Confessions",    emoji: "🗣️" },
  { value: "advice",         label: "Advice",         emoji: "🤝" },
  { value: "concern",        label: "Concerns",       emoji: "💭" },
  { value: "life_story",     label: "Life Stories",   emoji: "📖" },
  { value: "random",         label: "Random Thoughts",emoji: "🌀" },
  { value: "college",        label: "College Life",   emoji: "🎓" },
  { value: "relationship",   label: "Relationships",  emoji: "❤️" },
  { value: "motivation",     label: "Motivation",     emoji: "🔥" },
];

const TOPIC_LABEL = Object.fromEntries(TOPICS.map(t => [t.value, `${t.emoji} ${t.label}`]));

export default function ListenDontJudge() {
  const [user, setUser] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [activeTopic, setActiveTopic] = useState("all");
  const [expandedPost, setExpandedPost] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["listenPosts"],
    queryFn: () => base44.entities.CommunityPost.filter({ tags: ["listen_dont_judge"] }, "-created_date", 200),
  });

  const filteredPosts = useMemo(() => {
    if (activeTopic === "all") return posts;
    return posts.filter(p => p.tags?.includes(activeTopic));
  }, [posts, activeTopic]);

  const likeMut = useMutation({
    mutationFn: async (post) => {
      const hasLiked = post.upvoted_by?.includes(user?.email);
      await base44.entities.CommunityPost.update(post.id, {
        upvotes: hasLiked ? Math.max(0, (post.upvotes || 0) - 1) : (post.upvotes || 0) + 1,
        upvoted_by: hasLiked
          ? (post.upvoted_by || []).filter(e => e !== user.email)
          : [...(post.upvoted_by || []), user.email],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listenPosts"] }),
  });

  const handleShare = (post) => setSharePost(post);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: "var(--bg-app)",
          borderColor: "var(--border-light)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              🤍
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                Listen, Don't Judge
              </h1>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>A safe space to share openly</p>
            </div>
            {user && (
              <button
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
              >
                <Plus className="w-4 h-4" /> Share
              </button>
            )}
          </div>

          {/* Guidelines */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{ backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "#6366f1" }} />
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Judgment-free zone — share respectfully, listen with empathy.
            </p>
          </div>

          {/* Topic filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {TOPICS.map(topic => {
              const isActive = activeTopic === topic.value;
              return (
                <button
                  key={topic.value}
                  onClick={() => setActiveTopic(topic.value)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                  style={{
                    backgroundColor: isActive ? "#6366f1" : "var(--bg-card)",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    border: `1.5px solid ${isActive ? "#6366f1" : "var(--border-light)"}`,
                    boxShadow: isActive ? "0 2px 10px rgba(99,102,241,0.3)" : "none",
                  }}
                >
                  <span>{topic.emoji}</span>
                  <span>{topic.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-5">
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
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">🤍</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {activeTopic === "all" ? "Be the first to share" : `No ${TOPICS.find(t => t.value === activeTopic)?.label} yet`}
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-hint)" }}>
              {activeTopic === "all" ? "This is a safe space to express yourself" : "Be the first to post in this topic"}
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
            <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>
              {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
              {activeTopic !== "all" && ` in ${TOPICS.find(t => t.value === activeTopic)?.label}`}
            </p>
            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                onLike={() => user && likeMut.mutate(post)}
                isExpanded={expandedPost === post.id}
                onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                onShare={() => handleShare(post)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <ComposerModal
          user={user}
          defaultTopic={activeTopic !== "all" ? activeTopic : "opinion"}
          onClose={() => setShowComposer(false)}
        />
      )}

      {/* Share Modal */}
      {sharePost && <ShareModal post={sharePost} onClose={() => setSharePost(null)} />}
    </div>
  );
}

function PostCard({ post, user, onLike, isExpanded, onToggle, onShare }) {
  const hasLiked = user?.email && post.upvoted_by?.includes(user.email);
  const isLong = (post.body || "").length > 280;
  const postTopic = TOPICS.find(t => post.tags?.includes(t.value) && t.value !== "all");

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: post.is_anonymous ? "linear-gradient(135deg, #d1d5db, #9ca3af)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
          }}
        >
          {post.is_anonymous ? "?" : (post.author_name?.[0] || "U").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {post.is_anonymous ? "Anonymous" : post.author_name || "User"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>{timeAgo(post.created_date)}</p>
        </div>
        {postTopic && (
          <span
            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "#6366f1" }}
          >
            {postTopic.emoji} {postTopic.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div>
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
          {isExpanded || !isLong ? post.body : `${post.body.slice(0, 280)}...`}
        </p>
        {isLong && (
          <button onClick={onToggle} className="text-xs font-semibold mt-1" style={{ color: "#6366f1" }}>
            {isExpanded ? "See less" : "See more"}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5 pt-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <button
          onClick={onLike}
          className="flex items-center gap-1.5 text-sm font-semibold pt-2"
          style={{ color: hasLiked ? "#E05C7A" : "var(--text-hint)" }}
        >
          <Heart className="w-4 h-4" style={{ fill: hasLiked ? "#E05C7A" : "none" }} />
          {post.upvotes || 0}
        </button>
        <Link
          to={createPageUrl(`PostComments?postId=${post.id}`)}
          className="flex items-center gap-1.5 text-sm font-semibold pt-2"
          style={{ color: "var(--text-hint)" }}
        >
          <MessageCircle className="w-4 h-4" />
          {post.comment_count || 0}
        </Link>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-sm font-semibold pt-2"
          style={{ color: "var(--text-hint)" }}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ShareModal({ post, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareText = post.is_anonymous ? "Someone shared on Listen, Don't Judge" : `${post.author_name} shared on Listen, Don't Judge`;

  const handleCopy = () => {
    navigator.clipboard.writeText(post.body || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Listen, Don't Judge", text: post.body });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl p-6"
        style={{ backgroundColor: "var(--bg-modal)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Share Post</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Post preview */}
        <div className="rounded-xl p-3 mb-5" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-hint)" }}>{shareText}</p>
          <p className="text-sm line-clamp-3" style={{ color: "var(--text-primary)" }}>{post.body}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : null}
            {copied ? "Copied!" : "Copy Text"}
          </button>
          <button
            onClick={handleNativeShare}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

function ComposerModal({ user, defaultTopic, onClose }) {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [topic, setTopic] = useState(defaultTopic || "opinion");
  const qc = useQueryClient();

  const composerTopics = TOPICS.filter(t => t.value !== "all");
  const currentTopic = composerTopics.find(t => t.value === topic) || composerTopics[0];

  const placeholders = {
    opinion: "Share your opinion...",
    question: "What would you like to ask?",
    quote: "Share a quote or thought...",
    confession: "What do you want to confess?",
    advice: "What do you need help with?",
    concern: "What's on your mind?",
    life_story: "Share a piece of your story...",
    random: "What's your random thought?",
    college: "What's happening in college life?",
    relationship: "Share your relationship thoughts...",
    motivation: "Inspire someone today...",
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await base44.entities.CommunityPost.create({
      type: "text_only",
      body: text,
      author_email: user.email,
      author_name: user.full_name || user.email,
      is_anonymous: isAnonymous,
      tags: ["listen_dont_judge", topic],
      upvotes: 0,
      upvoted_by: [],
      comment_count: 0,
    });
    qc.invalidateQueries({ queryKey: ["listenPosts"] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
        style={{ backgroundColor: "var(--bg-modal)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            Share Your Thoughts
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Category picker */}
        <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Choose a Category</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {composerTopics.map(t => {
            const isActive = topic === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTopic(t.value)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                style={{
                  backgroundColor: isActive ? "#6366f1" : "var(--bg-subtle)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  border: `1.5px solid ${isActive ? "#6366f1" : "var(--border-light)"}`,
                }}
              >
                {t.emoji} {t.label}
              </button>
            );
          })}
        </div>

        {/* Text area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholders[topic] || "Share your thoughts..."}
          className="w-full px-4 py-3 rounded-xl text-sm resize-none"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
            minHeight: "140px",
          }}
        />
        <p className="text-right text-xs mt-1 mb-3" style={{ color: text.length > 900 ? "#e11d48" : "var(--text-hint)" }}>
          {text.length}/1000
        </p>

        {/* Anonymity toggle */}
        <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1.5px solid var(--border-light)" }}>
          <button
            onClick={() => setIsAnonymous(false)}
            className="w-full flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: !isAnonymous ? "rgba(99,102,241,0.07)" : "transparent" }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }}>
              {(user?.full_name?.[0] || "U").toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Post with Profile</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>{user?.full_name || user?.email}</p>
            </div>
            {!isAnonymous && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#6366f1" }}><Check className="w-3 h-3 text-white" /></div>}
          </button>
          <div style={{ height: "1px", backgroundColor: "var(--border-light)" }} />
          <button
            onClick={() => setIsAnonymous(true)}
            className="w-full flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: isAnonymous ? "rgba(99,102,241,0.07)" : "transparent" }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(135deg, #9ca3af, #6b7280)", color: "#fff" }}>?</div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Post Anonymously</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Your identity stays hidden</p>
            </div>
            {isAnonymous && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#6366f1" }}><Check className="w-3 h-3 text-white" /></div>}
          </button>
        </div>

        <div className="flex gap-3">
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
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              opacity: text.trim() ? 1 : 0.5,
            }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}