import React, { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, ImageIcon, Smile } from "lucide-react";
import CreateCommunityPost from "./CreateCommunityPost";
import DebateCard from "./DebateCard";
import CommunityPostCard from "./CommunityPostCard";
import SwipeModeView from "./SwipeModeView";
import { requireVerified } from "../auth/EmailVerificationGate";



const TABS = [
  { key: "foryou", label: "For You" },
  { key: "following", label: "Following" },
];

const FILTER_OPTIONS = [
  { key: "all",       label: "✦ All" },
  { key: "trending",  label: "🔥 Hot" },
  { key: "questions", label: "❓ Q&A" },
  { key: "debated",   label: "⚔️ Debates" },
  { key: "quotes",    label: "✦ Quotes" },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function CommunityFeed({ user }) {
  const [tab, setTab] = useState("foryou");
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const qc = useQueryClient();

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 100),
    refetchInterval: 30000,
  });

  const { data: debates = [] } = useQuery({
    queryKey: ["communityDebates"],
    queryFn: () => base44.entities.CommunityDebate.list("-created_date", 50),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["myFollows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user?.email,
  });

  const followingEmails = useMemo(() => follows.map(f => f.following_email), [follows]);

  const upvoteMut = useMutation({
    mutationFn: ({ post }) => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      return base44.entities.CommunityPost.update(post.id, {
        upvotes: (post.upvotes || 0) + 1,
        upvoted_by: [...(post.upvoted_by || []), user.email],
        engagement_score: (post.upvotes || 0) + 1 + ((post.comment_count || 0) * 2) - (post.downvotes || 0),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communityPosts"] }),
  });

  const downvoteMut = useMutation({
    mutationFn: ({ post }) => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      return base44.entities.CommunityPost.update(post.id, {
        downvotes: (post.downvotes || 0) + 1,
        downvoted_by: [...(post.downvoted_by || []), user.email],
        engagement_score: (post.upvotes || 0) + ((post.comment_count || 0) * 2) - ((post.downvotes || 0) + 1),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communityPosts"] }),
  });

  const filteredPosts = useMemo(() => {
    let list = posts.filter(p => p.type !== "review");

    if (tab === "following" && followingEmails.length > 0) {
      list = list.filter(p => followingEmails.includes(p.author_email));
    }

    switch (filter) {
      case "trending":  list = [...list].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0)); break;
      case "debated":   list = list.filter(p => p.type === "debate"); break;
      case "questions": list = list.filter(p => p.type === "question"); break;
      case "quotes":    list = list.filter(p => p.type === "quote_of_day" || p.type === "discussion"); break;
    }
    return list;
  }, [posts, filter, tab, followingEmails]);

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
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--bg-app)" }}>
      {/* ── Header ── */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h1 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Community</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => { setViewMode(v => v === "swipe" ? "list" : "swipe"); window.dispatchEvent(new CustomEvent("swipemode", { detail: { active: viewMode !== "swipe" } })); }}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={{ backgroundColor: viewMode === "swipe" ? "var(--accent-primary)" : "transparent", color: viewMode === "swipe" ? "#fff" : "var(--text-hint)", borderColor: viewMode === "swipe" ? "var(--accent-primary)" : "var(--border-light)" }}>
              {viewMode === "swipe" ? "✕ Swipe" : "↕ Swipe"}
            </button>
            <button onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}>
              <Plus className="w-3.5 h-3.5" /> Post
            </button>
          </div>
        </div>

        {/* Tabs: For You / Following */}
        <div className="flex border-b" style={{ borderColor: "var(--border-light)" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 text-sm font-semibold relative transition-all"
              style={{ color: tab === t.key ? "var(--accent-primary)" : "var(--text-hint)" }}>
              {t.label}
              {tab === t.key && (
                <motion.div layoutId="feedTab" className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary)" }} />
              )}
            </button>
          ))}
        </div>

        {/* Filter chips */}
        <div className="px-3 py-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5" style={{ width: "max-content" }}>
            {FILTER_OPTIONS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-all"
                style={{
                  backgroundColor: filter === f.key ? "var(--accent-primary)" : "transparent",
                  color: filter === f.key ? "#fff" : "var(--text-secondary)",
                  borderColor: filter === f.key ? "var(--accent-primary)" : "var(--border-light)",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick compose row ── */}
      {viewMode === "list" && (
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
            {user?.full_name?.[0]?.toUpperCase() || "?"}
          </div>
          <button onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
            className="flex-1 text-left px-4 py-2.5 rounded-full text-sm transition-all"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)", border: "1px solid var(--border-light)" }}>
            What's on your mind?
          </button>
          <button onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
            className="p-2 rounded-full" style={{ color: "var(--accent-primary)" }}>
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ====== LIST MODE ====== */}
      {viewMode === "list" && (
        <div className="pb-24">
          {filteredPosts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {tab === "following" ? "Follow people to see their posts here" : "No posts yet"}
              </p>
              <button onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
                className="mt-3 text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
                Be the first to post
              </button>
            </div>
          ) : filteredPosts.map(renderPostCard)}
        </div>
      )}

      {/* ====== SWIPE MODE ====== */}
      {viewMode === "swipe" && (
        <SwipeModeView
          posts={filteredPosts}
          debates={debates}
          user={user}
          onUpvote={(post) => user && !post.upvoted_by?.includes(user.email) && upvoteMut.mutate({ post })}
          onClose={() => { setViewMode("list"); window.dispatchEvent(new CustomEvent("swipemode", { detail: { active: false } })); }}
        />
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateCommunityPost user={user} onClose={() => setShowCreate(false)}
            onCreated={() => { qc.invalidateQueries({ queryKey: ["communityPosts"] }); qc.invalidateQueries({ queryKey: ["communityDebates"] }); }} />
        )}
      </AnimatePresence>
    </div>
  );
}