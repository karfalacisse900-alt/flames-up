import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Layers, List, ChevronLeft, ChevronRight } from "lucide-react";
import CreateCommunityPost from "./CreateCommunityPost";
import DailySpotlight from "./DailySpotlight";
import DebateCard from "./DebateCard";
import CommunityPostCard from "./CommunityPostCard";

const FILTER_OPTIONS = [
  { key: "all",       label: "✦ All" },
  { key: "trending",  label: "🔥 Trending" },
  { key: "newest",    label: "🆕 Newest" },
  { key: "upvoted",   label: "▲ Most Upvoted" },
  { key: "commented", label: "💬 Most Commented" },
  { key: "debated",   label: "⚔️ Debates" },
  { key: "questions", label: "❓ Questions" },
  { key: "lists",     label: "📋 Lists" },
  { key: "opinions",  label: "💬 Opinions" },
  { key: "quotes",    label: "✦ Quotes" },
];

const MEDIA_FILTERS = [
  { key: "all",     label: "All Topics" },
  { key: "movie",   label: "🎬 Movies" },
  { key: "show",    label: "📺 Shows" },
  { key: "book",    label: "📚 Books" },
  { key: "game",    label: "🎮 Games" },
  { key: "music",   label: "🎵 Music" },
  { key: "general", label: "💬 General" },
];

export default function CommunityFeed({ user }) {
  const [filter, setFilter] = useState("all");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" | "swipe"
  const [swipeIndex, setSwipeIndex] = useState(0);
  const qc = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 100),
    refetchInterval: 30000,
  });

  const { data: debates = [] } = useQuery({
    queryKey: ["communityDebates"],
    queryFn: () => base44.entities.CommunityDebate.list("-created_date", 50),
  });

  const upvoteMut = useMutation({
    mutationFn: ({ post }) => base44.entities.CommunityPost.update(post.id, {
      upvotes: (post.upvotes || 0) + 1,
      upvoted_by: [...(post.upvoted_by || []), user.email],
      engagement_score: (post.upvotes || 0) + 1 + ((post.comment_count || 0) * 2) - (post.downvotes || 0),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communityPosts"] }),
  });

  const downvoteMut = useMutation({
    mutationFn: ({ post }) => base44.entities.CommunityPost.update(post.id, {
      downvotes: (post.downvotes || 0) + 1,
      downvoted_by: [...(post.downvoted_by || []), user.email],
      engagement_score: (post.upvotes || 0) + ((post.comment_count || 0) * 2) - ((post.downvotes || 0) + 1),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communityPosts"] }),
  });

  const spotlight = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaySpotlights = posts.filter(p => p.spotlight_date === today && p.is_daily_spotlight);
    if (todaySpotlights.length > 0) return todaySpotlights;
    return [...posts].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0)).slice(0, 3);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let list = posts.filter(p => !p.is_daily_spotlight && p.type !== "review");
    if (mediaFilter !== "all") list = list.filter(p => p.media_type === mediaFilter);

    switch (filter) {
      case "trending":  list = [...list].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0)); break;
      case "newest":    break;
      case "upvoted":   list = [...list].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)); break;
      case "commented": list = [...list].sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0)); break;
      case "debated":   list = list.filter(p => p.type === "debate"); break;
      case "questions": list = list.filter(p => p.type === "question"); break;
      case "lists":     list = list.filter(p => p.type === "list"); break;
      case "opinions":  list = list.filter(p => p.type === "opinion"); break;
      case "quotes":    list = list.filter(p => p.type === "quote_of_day" || p.type === "discussion"); break;
    }
    return list;
  }, [posts, filter, mediaFilter]);

  const getDebateForPost = (postId) => debates.find(d => d.post_id === postId);

  const renderPostCard = (post) => (
    post.type === "debate" ? (
      <DebateCard key={post.id} post={post} debate={getDebateForPost(post.id)} user={user}
        onUpvote={() => user && !post.upvoted_by?.includes(user.email) && upvoteMut.mutate({ post })}
        onDownvote={() => user && !post.downvoted_by?.includes(user.email) && downvoteMut.mutate({ post })}
        isExpanded={expandedPost === post.id}
        onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
      />
    ) : (
      <CommunityPostCard key={post.id} post={post} user={user}
        onUpvote={() => user && !post.upvoted_by?.includes(user.email) && upvoteMut.mutate({ post })}
        onDownvote={() => user && !post.downvoted_by?.includes(user.email) && downvoteMut.mutate({ post })}
        isExpanded={expandedPost === post.id}
        onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
      />
    )
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 sticky top-0 z-20" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Community</h1>
            <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>Share opinions, ask questions, start debates</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <button onClick={() => { setViewMode(v => v === "list" ? "swipe" : "list"); setSwipeIndex(0); setExpandedPost(null); }}
              className="p-2 rounded-full border transition-all"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
              {viewMode === "list" ? <Layers className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}>
              <Plus className="w-3.5 h-3.5" /> Post
            </button>
          </div>
        </div>
      </div>

      {/* Daily Spotlight */}
      {spotlight.length > 0 && <DailySpotlight posts={spotlight} user={user} />}

      {/* Filter strip */}
      <div className="px-4 pt-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="flex gap-1.5 pb-1" style={{ width: "max-content" }}>
          {FILTER_OPTIONS.map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setSwipeIndex(0); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all"
              style={{
                backgroundColor: filter === f.key ? "var(--accent-primary)" : "var(--bg-card)",
                color: filter === f.key ? "#fff" : "var(--text-secondary)",
                borderColor: filter === f.key ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media topic filter */}
      <div className="px-4 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="flex gap-1.5 pt-1 pb-2" style={{ width: "max-content" }}>
          {MEDIA_FILTERS.map(f => (
            <button key={f.key} onClick={() => { setMediaFilter(f.key); setSwipeIndex(0); }}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap transition-all"
              style={{
                backgroundColor: mediaFilter === f.key ? "var(--accent-primary-light)" : "transparent",
                color: mediaFilter === f.key ? "var(--accent-primary)" : "var(--text-hint)",
                borderColor: mediaFilter === f.key ? "var(--accent-primary)" : "transparent",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post count */}
      <p className="px-5 pb-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
        {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
      </p>

      {/* ====== LIST MODE ====== */}
      {viewMode === "list" && (
        <div className="px-4 space-y-3 pb-24">
          {filteredPosts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No posts yet</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
                Be the first to post
              </button>
            </div>
          ) : filteredPosts.map(renderPostCard)}
        </div>
      )}

      {/* ====== SWIPE MODE ====== */}
      {viewMode === "swipe" && (
        <div className="px-4 pb-24">
          {filteredPosts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>No posts found</p>
            </div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div key={filteredPosts[swipeIndex]?.id}
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}>
                  {filteredPosts[swipeIndex] && renderPostCard(filteredPosts[swipeIndex])}
                </motion.div>
              </AnimatePresence>
              {/* Swipe nav */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={() => setSwipeIndex(i => Math.max(0, i - 1))} disabled={swipeIndex === 0}
                  className="p-2.5 rounded-full border disabled:opacity-30 transition-all"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
                  <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                </button>
                <span className="text-xs font-medium" style={{ color: "var(--text-hint)" }}>
                  {swipeIndex + 1} / {filteredPosts.length}
                </span>
                <button onClick={() => setSwipeIndex(i => Math.min(filteredPosts.length - 1, i + 1))} disabled={swipeIndex === filteredPosts.length - 1}
                  className="p-2.5 rounded-full border disabled:opacity-30 transition-all"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
                  <ChevronRight className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateCommunityPost user={user} onClose={() => setShowCreate(false)}
            onCreated={() => { qc.invalidateQueries({ queryKey: ["communityPosts"] }); qc.invalidateQueries({ queryKey: ["communityDebates"] }); }} />
        )}
      </AnimatePresence>

      <p className="text-[10px] text-center px-5 pb-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        Opinions expressed are those of community members.
      </p>
    </div>
  );
}