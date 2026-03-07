import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, ArrowUp, Zap, MapPin, Loader2 } from "lucide-react";
import CreateCommunityPost from "./CreateCommunityPost";
import DebateCard from "./DebateCard";
import CommunityPostCard from "./CommunityPostCard";
import DailyChallengeCard from "./DailyChallengeCard";
import { requireVerified } from "../auth/EmailVerificationGate";
import { rankFeedForUser, trackPostView } from "./feedRanking";



export default function CommunityFeed({ user }) {
  const [showCreate, setShowCreate] = useState(false);
  const [challengeContext, setChallengeContext] = useState(null); // {question}
  const [expandedPost, setExpandedPost] = useState(null);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const [activeTab, setActiveTab] = useState("for_you"); // "for_you" | "nearby"
  const [userCity, setUserCity] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const qc = useQueryClient();

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["communityPosts"],
    // Only show posts that don't belong to any group (group_id is null/undefined)
    queryFn: async () => {
      const all = await base44.entities.CommunityPost.list("-created_date", 100);
      return all.filter(p => !p.group_id);
    },
  });

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const addr = data.address || {};
          setUserCity(addr.city || addr.town || addr.village || addr.county || "");
        } catch {}
        setLocationLoading(false);
      },
      () => setLocationLoading(false)
    );
  };

  useEffect(() => {
    if (activeTab === "nearby" && !userCity && !locationLoading) detectLocation();
  }, [activeTab]);

  useEffect(() => {
    const unsub = base44.entities.CommunityPost.subscribe((event) => {
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
      if (event.type === "create") {
        setNewPostsAvailable(n => n + 1);
      }
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
      const hasUpvoted = post.upvoted_by?.includes(user?.email);
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

  const followedEmails = useMemo(() => follows.map(f => f.following_email), [follows]);

  // Stable post order — sorted once on load by created_date, never re-sorted on likes
  const [stablePostIds, setStablePostIds] = useState([]);

  useEffect(() => {
    if (posts.length > 0) {
      const list = posts.filter(p => p.type !== "review");
      const ranked = user?.email
        ? rankFeedForUser(list, user.email, debates, followedEmails)
        : [...list].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setStablePostIds(prev => {
        // Only add new posts to front; keep existing order intact
        const existingIds = new Set(prev);
        const newIds = ranked.filter(p => !existingIds.has(p.id)).map(p => p.id);
        return newIds.length > 0 ? [...newIds, ...prev] : prev.length === 0 ? ranked.map(p => p.id) : prev;
      });
    }
  }, [posts.map(p => p.id).join(",")]); // only re-run when post list changes (not on like updates)

  const filteredPosts = useMemo(() => {
    const postMap = new Map(posts.filter(p => p.type !== "review").map(p => [p.id, p]));
    const base = stablePostIds.map(id => postMap.get(id)).filter(Boolean);
    if (activeTab === "nearby" && userCity) {
      return base.filter(p => p.location_city && p.location_city.toLowerCase() === userCity.toLowerCase());
    }
    return base;
  }, [stablePostIds, posts, activeTab, userCity]);

  const getDebateForPost = (postId) => debates.find(d => d.post_id === postId);

  const renderPostCard = (post, index) => {
    const debate = getDebateForPost(post.id);
    if (user?.email) trackPostView(post.id);
    return (
      <div key={post.id} className="fade-slide-in" style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s`, animationFillMode: "both" }}>
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
      </div>
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
    <div style={{ backgroundColor: "var(--bg-app)", maxWidth: 680, margin: "0 auto" }}>
      {/* Sticky feed header */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: "rgba(242,237,228,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="px-4 pt-2.5 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Community</p>
          </div>
          <button
            onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", color: "#fff", boxShadow: "0 2px 8px rgba(46,107,79,0.35)" }}>
            <Plus className="w-3 h-3" /> Post
          </button>
        </div>
        {/* Feed tabs */}
        <div className="flex gap-0 px-4 pt-2 pb-0">
          {[
            { key: "for_you", label: "For You" },
            { key: "nearby", label: "Nearby", icon: MapPin },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-semibold border-b-2 transition-all"
              style={{
                borderColor: activeTab === tab.key ? "var(--accent-primary)" : "transparent",
                color: activeTab === tab.key ? "var(--accent-primary)" : "var(--text-hint)",
                backgroundColor: "transparent",
              }}>
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* New posts floating pill */}
      {newPostsAvailable > 0 && (
        <button
          onClick={loadNewPosts}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)",
            color: "#fff",
            boxShadow: "0 6px 24px rgba(46,107,79,0.45)",
            animation: "slideUp 0.25s ease",
          }}>
          <ArrowUp className="w-3.5 h-3.5" />
          {newPostsAvailable} new post{newPostsAvailable !== 1 ? "s" : ""}
        </button>
      )}

      {/* Daily Challenge Card */}
      {activeTab === "for_you" && (
        <DailyChallengeCard
          user={user}
          onAnswerChallenge={(ch) => {
            if (!requireVerified(user)) return;
            setChallengeContext(ch);
            setShowCreate(true);
          }}
        />
      )}

      {/* Feed */}
      <div className="pb-28">
        {activeTab === "nearby" && locationLoading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--accent-primary)" }} />
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Finding your location…</p>
          </div>
        ) : activeTab === "nearby" && !userCity ? (
          <div className="py-16 text-center px-8">
            <MapPin className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
            <p className="text-base font-bold mb-1.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Location access needed</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-hint)" }}>Allow location to see posts from people near you</p>
            <button onClick={detectLocation}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
              Enable Location
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center px-8" style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="text-5xl mb-4">{activeTab === "nearby" ? "📍" : "💬"}</div>
            <p className="text-base font-bold mb-1.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {activeTab === "nearby" ? `No posts from ${userCity} yet` : "Start the conversation"}
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--text-hint)" }}>
              {activeTab === "nearby" ? "Be the first to post with your location tagged!" : "Be the first to share a thought with the community"}
            </p>
            <button
              onClick={() => { if (!requireVerified(user)) return; setShowCreate(true); }}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 16px rgba(46,107,79,0.35)" }}>
              ✦ {activeTab === "nearby" ? "Post from here" : "Create First Post"}
            </button>
          </div>
        ) : (
          filteredPosts.map((post, index) => renderPostCard(post, index))
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateCommunityPost
            user={user}
            challengeContext={challengeContext}
            onClose={() => { setShowCreate(false); setChallengeContext(null); }}
            onCreated={async () => {
              await qc.invalidateQueries({ queryKey: ["communityPosts"] });
              await qc.invalidateQueries({ queryKey: ["communityDebates"] });
              await refetch();
            }} />
        )}
      </AnimatePresence>
    </div>
  );
}