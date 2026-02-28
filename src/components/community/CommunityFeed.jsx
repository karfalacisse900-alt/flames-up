import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, ImageIcon, Smile, ArrowUp } from "lucide-react";
import CreateCommunityPost from "./CreateCommunityPost";
import DebateCard from "./DebateCard";
import CommunityPostCard from "./CommunityPostCard";
import { requireVerified } from "../auth/EmailVerificationGate";
import { createPageUrl } from "@/utils";
import { rankFeedForUser, trackPostView } from "./feedRanking";



const TABS = [
  { key: "foryou", label: "For You" },
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
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const qc = useQueryClient();

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 100),
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.CommunityPost.subscribe((event) => {
      if (event.type === "create") {
        setNewPostsAvailable(n => n + 1);
      } else if (event.type === "update" || event.type === "delete") {
        qc.invalidateQueries({ queryKey: ["communityPosts"] });
      }
    });
    return unsub;
  }, [qc]);

  // Real-time comment updates
  useEffect(() => {
    const unsub = base44.entities.CommunityComment.subscribe((event) => {
      if (event.type === "create" && expandedPost === event.data?.post_id) {
        qc.invalidateQueries({ queryKey: ["communityComments", event.data.post_id] });
      }
    });
    return unsub;
  }, [expandedPost, qc]);

  // Real-time debate updates
  useEffect(() => {
    const unsub = base44.entities.CommunityDebate.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["communityDebates"] });
    });
    return unsub;
  }, [qc]);

  const loadNewPosts = () => {
    refetch();
    setNewPostsAvailable(0);
  };

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
      const hasUpvoted = post.upvoted_by?.includes(user.email);
      if (hasUpvoted) {
        // Unlike
        const newUpvotes = Math.max(0, (post.upvotes || 0) - 1);
        return base44.entities.CommunityPost.update(post.id, {
          upvotes: newUpvotes,
          upvoted_by: (post.upvoted_by || []).filter(e => e !== user.email),
          engagement_score: newUpvotes + ((post.comment_count || 0) * 2) - (post.downvotes || 0),
        });
      } else {
        // Like
        const newUpvotes = (post.upvotes || 0) + 1;
        return base44.entities.CommunityPost.update(post.id, {
          upvotes: newUpvotes,
          upvoted_by: [...(post.upvoted_by || []), user.email],
          engagement_score: newUpvotes + ((post.comment_count || 0) * 2) - (post.downvotes || 0),
        });
      }
    },
    onSuccess: (_, { post }) => {
      // Update only the specific post in cache without re-sorting
      qc.setQueryData(["communityPosts"], (old) => {
        if (!old) return old;
        return old.map(p => p.id === post.id
          ? {
              ...p,
              upvotes: post.upvoted_by?.includes(user.email)
                ? Math.max(0, (p.upvotes || 0) - 1)
                : (p.upvotes || 0) + 1,
              upvoted_by: post.upvoted_by?.includes(user.email)
                ? (p.upvoted_by || []).filter(e => e !== user.email)
                : [...(p.upvoted_by || []), user.email],
            }
          : p
        );
      });
    },
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
    onSuccess: () => {},
  });

  const filteredPosts = useMemo(() => {
    const list = posts.filter(p => p.type !== "review");
    if (user?.email) return rankFeedForUser(list, user.email, debates);
    return [...list].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
  }, [posts, user?.email, debates]);

  const getDebateForPost = (postId) => debates.find(d => d.post_id === postId);

  const renderPostCard = (post) => {
    const debate = getDebateForPost(post.id);
    // Track view for session-level adaptation
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
        <div className="px-4 py-2.5 flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Community Feed</p>
        </div>
      </div>

      {/* ── New posts indicator ── */}
      <AnimatePresence>
        {newPostsAvailable > 0 && (
          <motion.button initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            onClick={loadNewPosts}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
            <ArrowUp className="w-3.5 h-3.5" />
            {newPostsAvailable} new post{newPostsAvailable !== 1 ? "s" : ""}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Quick compose row ── */}
      <div className="px-4 py-2.5 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #2E6B4F08, #4CAF7D10)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
          style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", flexShrink: 0 }}>
          {user?.full_name?.[0]?.toUpperCase() || "?"}
        </div>
        <button onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
          className="flex-1 text-left px-4 py-2.5 rounded-full text-sm transition-all"
          style={{ background: "linear-gradient(135deg, #2E6B4F12, #4CAF7D0A)", color: "#2E6B4F", border: "1.5px solid #2E6B4F30", fontWeight: 500 }}>
          ✍️ What's on your mind?
        </button>
        <button onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "linear-gradient(135deg, #2E6B4F20, #4CAF7D20)", color: "#2E6B4F" }}>
          <ImageIcon className="w-4 h-4" />
        </button>
        <button onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "linear-gradient(135deg, #D98B6220, #F5A86220)", color: "#D98B62" }}>
          <Smile className="w-4 h-4" />
        </button>
      </div>

      {/* ====== FEED ====== */}
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

      <AnimatePresence>
        {showCreate && (
          <CreateCommunityPost user={user} onClose={() => setShowCreate(false)}
            onCreated={() => { qc.invalidateQueries({ queryKey: ["communityPosts"] }); qc.invalidateQueries({ queryKey: ["communityDebates"] }); }} />
        )}
      </AnimatePresence>
    </div>
  );
}