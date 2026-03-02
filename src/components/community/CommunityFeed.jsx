import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, ArrowUp, Zap, Bell } from "lucide-react";
import CreateCommunityPost from "./CreateCommunityPost";
import DebateCard from "./DebateCard";
import CommunityPostCard from "./CommunityPostCard";
import { requireVerified } from "../auth/EmailVerificationGate";
import { rankFeedForUser, trackPostView } from "./feedRanking";

const PAGE_SIZE = 15;



export default function CommunityFeed({ user }) {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef(null);
  const qc = useQueryClient();

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: async () => {
      const all = await base44.entities.CommunityPost.list("-created_date", 300);
      return all.filter(p => !p.group_id);
    },
  });

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount(n => n + PAGE_SIZE);
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const unsub = base44.entities.CommunityPost.subscribe((event) => {
      if (event.type === "create") setNewPostsAvailable(n => n + 1);
      else if (event.type === "update" || event.type === "delete") qc.invalidateQueries({ queryKey: ["communityPosts"] });
    });
    return unsub;
  }, [qc]);

  useEffect(() => {
    const unsub = base44.entities.CommunityComment.subscribe((event) => {
      if (event.type === "create" && expandedPost === event.data?.post_id)
        qc.invalidateQueries({ queryKey: ["communityComments", event.data.post_id] });
    });
    return unsub;
  }, [expandedPost, qc]);

  useEffect(() => {
    const unsub = base44.entities.CommunityDebate.subscribe(() => qc.invalidateQueries({ queryKey: ["communityDebates"] }));
    return unsub;
  }, [qc]);

  const { data: debates = [] } = useQuery({
    queryKey: ["communityDebates"],
    queryFn: () => base44.entities.CommunityDebate.list("-created_date", 50),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["myFollows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user?.email,
  });

  const loadNewPosts = () => { refetch(); setNewPostsAvailable(0); };

  const upvoteMut = useMutation({
    mutationFn: ({ post }) => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      const hasUpvoted = post.upvoted_by?.includes(user.email);
      if (hasUpvoted) {
        const newUpvotes = Math.max(0, (post.upvotes || 0) - 1);
        return base44.entities.CommunityPost.update(post.id, {
          upvotes: newUpvotes,
          upvoted_by: (post.upvoted_by || []).filter(e => e !== user.email),
          engagement_score: newUpvotes + ((post.comment_count || 0) * 2) - (post.downvotes || 0),
        });
      } else {
        const newUpvotes = (post.upvotes || 0) + 1;
        return base44.entities.CommunityPost.update(post.id, {
          upvotes: newUpvotes,
          upvoted_by: [...(post.upvoted_by || []), user.email],
          engagement_score: newUpvotes + ((post.comment_count || 0) * 2) - (post.downvotes || 0),
        });
      }
    },
    onMutate: ({ post }) => {
      // Optimistic update so UI toggles immediately
      const hasUpvoted = post.upvoted_by?.includes(user.email);
      qc.setQueryData(["communityPosts"], (old) => {
        if (!old) return old;
        return old.map(p => p.id !== post.id ? p : {
          ...p,
          upvotes: hasUpvoted ? Math.max(0, (p.upvotes || 0) - 1) : (p.upvotes || 0) + 1,
          upvoted_by: hasUpvoted
            ? (p.upvoted_by || []).filter(e => e !== user.email)
            : [...(p.upvoted_by || []), user.email],
        });
      });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const rankedPosts = useMemo(() => {
    const list = posts.filter(p => p.type !== "review");
    if (user?.email) return rankFeedForUser(list, user.email, debates);
    return [...list].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
  }, [posts, user?.email, debates]);

  const filteredPosts = rankedPosts.slice(0, visibleCount);

  const getDebateForPost = (postId) => debates.find(d => d.post_id === postId);

  const renderPostCard = (post, index) => {
    const debate = getDebateForPost(post.id);
    if (user?.email) trackPostView(post.id);
    return (
      <motion.div
        key={post.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
      >
        {post.type === "debate" || post.type === "question" ? (
          <DebateCard post={post} debate={debate} user={user}
            onUpvote={() => user && upvoteMut.mutate({ post })}
            isExpanded={expandedPost === post.id}
            onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
          />
        ) : (
          <CommunityPostCard post={post} user={user}
            onUpvote={() => user && upvoteMut.mutate({ post })}
            isExpanded={expandedPost === post.id}
            onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
          />
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-6">
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
    );
  }

  return (
    <div style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Sticky feed header */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: "rgba(242,237,228,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Community Feed</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", color: "#fff", boxShadow: "0 2px 8px rgba(46,107,79,0.35)" }}>
            <Plus className="w-3 h-3" /> Post
          </motion.button>
        </div>
      </div>

      {/* New posts floating pill */}
      <AnimatePresence>
        {newPostsAvailable > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={loadNewPosts}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold shadow-xl"
            style={{
              background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)",
              color: "#fff",
              boxShadow: "0 6px 24px rgba(46,107,79,0.45)",
            }}>
            <motion.span animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 1 }}>
              <ArrowUp className="w-3.5 h-3.5" />
            </motion.span>
            {newPostsAvailable} new post{newPostsAvailable !== 1 ? "s" : ""}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div className="pb-28">
        {filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center px-8"
          >
            <div className="text-5xl mb-4">💬</div>
            <p className="text-base font-bold mb-1.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Start the conversation</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-hint)" }}>Be the first to share a thought with the community</p>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 16px rgba(46,107,79,0.35)" }}>
              ✦ Create First Post
            </motion.button>
          </motion.div>
        ) : (
          filteredPosts.map((post, index) => renderPostCard(post, index))
        )}
        {/* Infinite scroll sentinel */}
        {visibleCount < rankedPosts.length && (
          <div ref={loaderRef} className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateCommunityPost user={user} onClose={() => setShowCreate(false)}
            onCreated={() => {
              qc.invalidateQueries({ queryKey: ["communityPosts"] });
              qc.invalidateQueries({ queryKey: ["communityDebates"] });
            }} />
        )}
      </AnimatePresence>
    </div>
  );
}