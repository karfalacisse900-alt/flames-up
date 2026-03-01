import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles, ImageIcon, MessageSquarePlus, Flame, TrendingUp, Clock } from "lucide-react";
import CreateCommunityPost from "./CreateCommunityPost";
import DebateCard from "./DebateCard";
import CommunityPostCard from "./CommunityPostCard";
import { requireVerified } from "../auth/EmailVerificationGate";
import { rankFeedForUser, trackPostView } from "./feedRanking";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const FEED_TABS = [
  { key: "foryou",   label: "For You",  icon: Sparkles },
  { key: "trending", label: "Trending", icon: TrendingUp },
  { key: "latest",   label: "Latest",   icon: Clock },
];

export default function CommunityFeed({ user }) {
  const [tab, setTab] = useState("foryou");
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const qc = useQueryClient();

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 100),
  });

  useEffect(() => {
    const unsub = base44.entities.CommunityPost.subscribe((event) => {
      if (event.type === "create") setNewPostsAvailable(n => n + 1);
      else qc.invalidateQueries({ queryKey: ["communityPosts"] });
    });
    return unsub;
  }, [qc]);

  useEffect(() => {
    const unsub = base44.entities.CommunityComment.subscribe((event) => {
      if (event.type === "create" && expandedPost === event.data?.post_id) {
        qc.invalidateQueries({ queryKey: ["communityComments", event.data.post_id] });
      }
    });
    return unsub;
  }, [expandedPost, qc]);

  useEffect(() => {
    const unsub = base44.entities.CommunityDebate.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["communityDebates"] });
    });
    return unsub;
  }, [qc]);

  const loadNewPosts = () => { refetch(); setNewPostsAvailable(0); };

  const { data: debates = [] } = useQuery({
    queryKey: ["communityDebates"],
    queryFn: () => base44.entities.CommunityDebate.list("-created_date", 50),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["myFollows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user?.email,
  });

  const upvoteMut = useMutation({
    mutationFn: ({ post }) => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      const hasUpvoted = post.upvoted_by?.includes(user.email);
      if (hasUpvoted) {
        const newUpvotes = Math.max(0, (post.upvotes || 0) - 1);
        return base44.entities.CommunityPost.update(post.id, {
          upvotes: newUpvotes,
          upvoted_by: (post.upvoted_by || []).filter(e => e !== user.email),
          engagement_score: newUpvotes + ((post.comment_count || 0) * 2),
        });
      }
      const newUpvotes = (post.upvotes || 0) + 1;
      return base44.entities.CommunityPost.update(post.id, {
        upvotes: newUpvotes,
        upvoted_by: [...(post.upvoted_by || []), user.email],
        engagement_score: newUpvotes + ((post.comment_count || 0) * 2),
      });
    },
    onSuccess: (_, { post }) => {
      qc.setQueryData(["communityPosts"], (old) => {
        if (!old) return old;
        const hasLiked = post.upvoted_by?.includes(user.email);
        return old.map(p => p.id === post.id
          ? {
              ...p,
              upvotes: hasLiked ? Math.max(0, (p.upvotes || 0) - 1) : (p.upvotes || 0) + 1,
              upvoted_by: hasLiked
                ? (p.upvoted_by || []).filter(e => e !== user.email)
                : [...(p.upvoted_by || []), user.email],
            }
          : p
        );
      });
    },
  });

  const filteredPosts = useMemo(() => {
    const list = posts.filter(p => p.type !== "review");
    if (tab === "latest") return [...list].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    if (tab === "trending") return [...list].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
    if (user?.email) return rankFeedForUser(list, user.email, debates);
    return [...list].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
  }, [posts, user?.email, debates, tab]);

  const getDebateForPost = (postId) => debates.find(d => d.post_id === postId);

  const openCreate = (type = null) => {
    if (!requireVerified(user)) return;
    setCreateType(type);
    setShowCreate(true);
  };

  const renderPostCard = (post) => {
    const debate = getDebateForPost(post.id);
    if (user?.email) trackPostView(post.id);
    return post.type === "debate" || post.type === "question" ? (
      <DebateCard key={post.id} post={post} debate={debate} user={user}
        onUpvote={() => user && !post.upvoted_by?.includes(user.email) && upvoteMut.mutate({ post })}
        isExpanded={expandedPost === post.id}
        onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
      />
    ) : (
      <CommunityPostCard key={post.id} post={post} user={user}
        onUpvote={() => user && !post.upvoted_by?.includes(user.email) && upvoteMut.mutate({ post })}
        isExpanded={expandedPost === post.id}
        onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
      />
    );
  };

  return (
    <div style={{ backgroundColor: "var(--bg-app)" }}>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)", backdropFilter: "blur(12px)" }}>

        {/* Feed tabs */}
        <div className="flex px-4 pt-3 pb-0 gap-1">
          {FEED_TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  backgroundColor: active ? "var(--accent-primary)" : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                }}>
                <Icon className="w-3.5 h-3.5" style={{ strokeWidth: active ? 2.5 : 1.5 }} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "var(--border-subtle)", marginTop: 6 }} />
      </div>

      {/* ── New posts floating indicator ── */}
      <AnimatePresence>
        {newPostsAvailable > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -24, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={loadNewPosts}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-xl"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff", boxShadow: "0 4px 20px rgba(46,107,79,0.4)" }}>
            <ArrowUp className="w-3.5 h-3.5" />
            {newPostsAvailable} new post{newPostsAvailable !== 1 ? "s" : ""}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Compose card ── */}
      <div className="px-4 py-3">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          {/* Top row */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: user ? "linear-gradient(135deg,#2E6B4F,#4CAF7D)" : "linear-gradient(135deg,#ccc,#aaa)" }}
            >
              {user?.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <button
              onClick={() => openCreate()}
              className="flex-1 text-left px-4 py-2.5 rounded-xl text-sm transition-all active:scale-95"
              style={{
                background: "var(--bg-subtle)",
                color: "var(--text-hint)",
                border: "1px solid var(--border-light)",
                fontWeight: 400,
              }}
            >
              What&apos;s on your mind?
            </button>
          </div>

          {/* Quick action buttons */}
          <div className="flex border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <button onClick={() => openCreate("opinion")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all active:scale-95"
              style={{ color: "#E05C7A", borderRight: "1px solid var(--border-subtle)" }}>
              <Flame className="w-4 h-4" /> Post
            </button>
            <button onClick={() => openCreate("question")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all active:scale-95"
              style={{ color: "#2E6B4F", borderRight: "1px solid var(--border-subtle)" }}>
              <MessageSquarePlus className="w-4 h-4" /> Ask
            </button>
            <button onClick={() => openCreate()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all active:scale-95"
              style={{ color: "#D98B62" }}>
              <ImageIcon className="w-4 h-4" /> Photo
            </button>
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="pb-24">
        {isLoading ? (
          <div className="space-y-3 px-4 py-4">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-full skeleton w-1/3" />
                    <div className="h-2 rounded-full skeleton w-2/3" />
                    <div className="h-2 rounded-full skeleton w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center px-6">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Nothing here yet</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Be the first to start a conversation</p>
            <button onClick={() => openCreate()}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#2E6B4F,#4CAF7D)", boxShadow: "0 4px 16px rgba(46,107,79,0.35)" }}>
              ✦ Create Post
            </button>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2), duration: 0.25 }}
              >
                {renderPostCard(post)}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateCommunityPost
            user={user}
            initialType={createType}
            onClose={() => { setShowCreate(false); setCreateType(null); }}
            onCreated={() => {
              qc.invalidateQueries({ queryKey: ["communityPosts"] });
              qc.invalidateQueries({ queryKey: ["communityDebates"] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}