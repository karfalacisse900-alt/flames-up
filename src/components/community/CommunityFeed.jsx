import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Flame, Sparkles, MessageSquare, ChevronDown, Star, Flag } from "lucide-react";
import CreateCommunityPost from "./CreateCommunityPost";
import DailySpotlight from "./DailySpotlight";
import DebateCard from "./DebateCard";
import CommunityPostCard from "./CommunityPostCard";

const FILTER_OPTIONS = [
  { key: "all", label: "✦ All" },
  { key: "trending", label: "🔥 Trending" },
  { key: "newest", label: "🆕 Newest" },
  { key: "debated", label: "⚔️ Debates" },
  { key: "reviews", label: "⭐ Reviews" },
  { key: "questions", label: "❓ Questions" },
  { key: "lists", label: "📋 Lists" },
];

const MEDIA_FILTERS = [
  { key: "all", label: "All Topics" },
  { key: "movie", label: "🎬 Movies" },
  { key: "show", label: "📺 Shows" },
  { key: "book", label: "📚 Books" },
  { key: "game", label: "🎮 Games" },
  { key: "music", label: "🎵 Music" },
  { key: "general", label: "💬 General" },
];

export default function CommunityFeed({ user }) {
  const [filter, setFilter] = useState("all");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
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
    // fallback: pick 3 high-engagement posts as spotlight
    return [...posts].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0)).slice(0, 3);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let list = posts.filter(p => !p.is_daily_spotlight);

    if (mediaFilter !== "all") {
      list = list.filter(p => p.media_type === mediaFilter);
    }

    switch (filter) {
      case "trending":
        list = [...list].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
        break;
      case "newest":
        break; // already sorted by created_date desc
      case "debated":
        list = list.filter(p => p.type === "debate");
        break;
      case "reviews":
        list = list.filter(p => p.type === "review");
        break;
      case "questions":
        list = list.filter(p => p.type === "question");
        break;
      case "lists":
        list = list.filter(p => p.type === "list");
        break;
    }

    return list;
  }, [posts, filter, mediaFilter]);

  const getDebateForPost = (postId) => debates.find(d => d.post_id === postId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Daily Spotlight */}
      {spotlight.length > 0 && <DailySpotlight posts={spotlight} user={user} />}

      {/* Filter strip */}
      <div className="px-4 pt-3 pb-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 w-max">
          {FILTER_OPTIONS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
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
      <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 w-max pt-1.5">
          {MEDIA_FILTERS.map(f => (
            <button key={f.key} onClick={() => setMediaFilter(f.key)}
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
      <p className="px-5 mb-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
        {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
      </p>

      {/* Posts */}
      <div className="px-4 space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No posts yet</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
              Be the first to post
            </button>
          </div>
        ) : (
          filteredPosts.map(post => (
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
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-20 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 active:scale-90 transition-all"
        style={{ backgroundColor: "var(--accent-primary)" }}>
        <Plus className="w-6 h-6 text-white" />
      </button>

      <AnimatePresence>
        {showCreate && (
          <CreateCommunityPost user={user} onClose={() => setShowCreate(false)}
            onCreated={() => { qc.invalidateQueries({ queryKey: ["communityPosts"] }); qc.invalidateQueries({ queryKey: ["communityDebates"] }); }} />
        )}
      </AnimatePresence>

      <p className="text-[10px] text-center px-5 mt-6 pb-4 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        Opinions expressed are those of community members. This platform is not responsible for user-generated content.
      </p>
    </div>
  );
}