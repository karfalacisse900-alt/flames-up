import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, RefreshCw, List, Layers, Zap, Users, Sparkles, TrendingUp, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import FullScreenSwipeCard from "../components/home/FullScreenSwipeCard";
import CreatePostModal from "../components/home/CreatePostModal";
import { getFontStyle } from "../components/home/FontPicker";

const typeStyles = {
  question: { label: "Question", dot: "bg-amber-400" },
  quote: { label: "Quote", dot: "bg-emerald-400" },
  concern: { label: "Concern", dot: "bg-rose-400" }
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState("swipe");
  const [activeFilter, setActiveFilter] = useState("all");
  const [feedTab, setFeedTab] = useState("for_you");
  const [showTopicPrefs, setShowTopicPrefs] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const listRef = useRef(null);
  const queryClient = useQueryClient();

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    const el = listRef.current;
    if (el && el.scrollTop > 0) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && dy < 100) {setPullY(dy);setIsPulling(true);}
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullY > 60) {
      setRefreshing(true);
      await refetch();
      setCurrentIndex(0);
      setRefreshing(false);
    }
    setPullY(0);
    setIsPulling(false);
  }, [pullY]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Auto-generate username + referral code if missing
      if (u && (!u.username || !u.referral_code)) {
        base44.functions.invoke("onSignup", {}).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: () => base44.entities.Post.list("-created_date", 50)
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user?.email
  });

  const followingEmails = new Set((following || []).map((f) => f.following_email));

  const mutedOrBlocked = new Set([
    ...(user?.muted_users || []),
    ...(user?.blocked_users || []),
  ]);

  // Muted topics from user prefs
  const mutedTopics = user?.muted_topics || [];
  const preferredTopics = user?.preferred_topics || [];

  const now = new Date();

  // Engagement score for trending
  const engagementScore = (p) => {
    const ageHours = (now - new Date(p.created_date)) / 3600000;
    const decay = Math.max(0.1, 1 - ageHours / 72); // decays over 72h
    return ((p.like_count || 0) * 2 + (p.reply_count || 0) * 3 + (p.total_votes || 0)) * decay;
  };

  const typeOfPost = (p) => p.type; // "question" | "quote" | "concern"

  const baseFilter = (p) => {
    if (p.author_email && mutedOrBlocked.has(p.author_email)) return false;
    const typeMatch = activeFilter === "all" ? true : activeFilter === "questions" ? p.type === "question" : activeFilter === "quotes" ? p.type === "quote" : p.type === "concern";
    if (!typeMatch) return false;
    if (mutedTopics.includes(p.type)) return false;
    return true;
  };

  const boosted = (arr) => [
    ...arr.filter((p) => p.is_boosted && p.boost_expires_at && new Date(p.boost_expires_at) > now),
    ...arr.filter((p) => !(p.is_boosted && p.boost_expires_at && new Date(p.boost_expires_at) > now)),
  ];

  let filtered;
  if (feedTab === "for_you") {
    // Personalised: preferred topics boosted, following authors boosted, liked types boosted
    const likedTypes = new Set(posts.filter(p => p.liked_by?.includes(user?.email)).map(p => p.type));
    const scored = posts.filter(baseFilter).map(p => {
      let score = 0;
      if (followingEmails.has(p.author_email)) score += 5;
      if (preferredTopics.includes(p.type)) score += 4;
      if (likedTypes.has(p.type)) score += 2;
      score += Math.min(3, (p.like_count || 0) / 5);
      const ageHours = (now - new Date(p.created_date)) / 3600000;
      score -= ageHours / 24;
      return { post: p, score };
    });
    filtered = boosted(scored.sort((a, b) => b.score - a.score).map(s => s.post));
  } else if (feedTab === "trending") {
    filtered = boosted(posts.filter(baseFilter).sort((a, b) => engagementScore(b) - engagementScore(a)));
  } else if (feedTab === "following") {
    filtered = boosted(posts.filter(p => baseFilter(p) && followingEmails.has(p.author_email)));
  } else {
    filtered = boosted(posts.filter(baseFilter));
  }


  const likeMutation = useMutation({
    mutationFn: ({ post, email }) => base44.entities.Post.update(post.id, {
      like_count: (post.like_count || 0) + 1,
      liked_by: [...(post.liked_by || []), email]
    }),
    onMutate: async ({ post, email }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const prev = queryClient.getQueryData(["posts"]);
      queryClient.setQueryData(["posts"], (old = []) =>
      old.map((p) => p.id === post.id ?
      { ...p, like_count: (p.like_count || 0) + 1, liked_by: [...(p.liked_by || []), email] } :
      p)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {queryClient.setQueryData(["posts"], ctx.prev);},
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] })
  });

  const handleLike = (post) => {
    const email = user?.email;
    if (!email) return;
    const likedBy = post.liked_by || [];
    if (!likedBy.includes(email)) {
      likeMutation.mutate({ post, email });
      if (post.author_email && post.author_email !== email) {
        base44.entities.Notification.create({
          recipient_email: post.author_email,
          actor_name: user?.display_name || user?.full_name || "Someone",
          actor_email: email,
          type: "post_liked",
          post_id: post.id,
          post_text: post.text?.slice(0, 80),
          is_read: false
        }).catch(() => {});
      }
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = () => setCurrentIndex((prev) => prev + 1);

  const handleReply = (post) => {
    window.location.href = createPageUrl("PostDetail") + `?id=${post.id}`;
  };

  const visiblePosts = filtered.slice(currentIndex);

  // attach touch listeners to list in list mode — handled inline via onTouch* props

  return (
    <div className="flex flex-col" style={{ height: "100dvh", backgroundColor: "var(--bg-app)", overflow: "hidden" }}>
      {/* Compact Header — fixed height so content never shifts */}
      <div className="px-4 pb-2 shrink-0" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        {/* Feed tabs */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide pb-0.5">
          {[
            { val: "for_you", label: "For You", icon: <Sparkles className="w-3 h-3" /> },
            { val: "trending", label: "Trending", icon: <TrendingUp className="w-3 h-3" /> },
            { val: "following", label: "Following", icon: <Users className="w-3 h-3" /> },
            { val: "all", label: "All", icon: null },
          ].map(({ val, label, icon }) =>
            <button key={val} onClick={() => { setFeedTab(val); setCurrentIndex(0); }}
              className="flex items-center gap-1 text-xs font-semibold pb-1 pr-2 transition-all whitespace-nowrap shrink-0"
              style={{
                color: feedTab === val ? "var(--accent-primary)" : "var(--text-hint)",
                borderBottom: feedTab === val ? "2px solid var(--accent-primary)" : "2px solid transparent"
              }}>
              {icon}{label}
            </button>
          )}
          <button onClick={() => setShowTopicPrefs(p => !p)}
            className="ml-auto p-1.5 rounded-full shrink-0 transition-all"
            style={{
              backgroundColor: showTopicPrefs ? "var(--accent-primary)" : "var(--bg-card)",
              color: showTopicPrefs ? "#fff" : "var(--text-hint)",
              border: "1px solid var(--border-light)"
            }}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Topic prefs panel */}
        {showTopicPrefs && (
          <div className="rounded-2xl p-3 mb-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-hint)" }}>Preferred Topics (see more of)</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {["question", "quote", "concern"].map(t => {
                const on = preferredTopics.includes(t);
                return (
                  <button key={t} onClick={async () => {
                    const updated = on ? preferredTopics.filter(x => x !== t) : [...preferredTopics, t];
                    await base44.auth.updateMe({ preferred_topics: updated });
                    setUser(u => ({ ...u, preferred_topics: updated }));
                  }} className="px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize"
                    style={{
                      backgroundColor: on ? "var(--accent-primary)" : "var(--bg-app)",
                      color: on ? "#fff" : "var(--text-secondary)",
                      borderColor: on ? "var(--accent-primary)" : "var(--border-light)"
                    }}>{t}s</button>
                );
              })}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-hint)" }}>Muted Topics (see less of)</p>
            <div className="flex gap-2 flex-wrap">
              {["question", "quote", "concern"].map(t => {
                const on = mutedTopics.includes(t);
                return (
                  <button key={t} onClick={async () => {
                    const updated = on ? mutedTopics.filter(x => x !== t) : [...mutedTopics, t];
                    await base44.auth.updateMe({ muted_topics: updated });
                    setUser(u => ({ ...u, muted_topics: updated }));
                  }} className="px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize"
                    style={{
                      backgroundColor: on ? "#EF444422" : "var(--bg-app)",
                      color: on ? "#EF4444" : "var(--text-secondary)",
                      borderColor: on ? "#EF444466" : "var(--border-light)"
                    }}>{t}s</button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "swipe" ? "list" : "swipe")}
              className="p-2 rounded-full border"
              title={viewMode === "swipe" ? "Switch to list view" : "Switch to swipe view"}
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
              {viewMode === "swipe" ? <List className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {setCurrentIndex(0);refetch();}}
              title="Refresh feed"
              className="p-2 rounded-full border"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-semibold"
              style={{ backgroundColor: "var(--accent-primary)" }}>
              <Plus className="w-4 h-4" /> Post
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          {[["all", "All"], ["questions", "Questions"], ["quotes", "Quotes"], ["concerns", "Concerns"]].map(([val, label]) =>
          <button
            key={val}
            onClick={() => {setActiveFilter(val);setCurrentIndex(0);}}
            className="px-3 py-1 text-xs rounded-full border whitespace-nowrap shrink-0 transition-all"
            style={{
              backgroundColor: activeFilter === val ? "var(--accent-primary)" : "var(--bg-nav)",
              color: activeFilter === val ? "#fff" : "var(--text-secondary)",
              borderColor: activeFilter === val ? "var(--accent-primary)" : "var(--border-light)"
            }}>
              {label}
            </button>
          )}
        </div>
      </div>

      {/* Content area — takes remaining space, no overflow at top level */}
      <div className="pt-2 pb-2 px-3 flex-1 min-h-0" style={{ backgroundColor: "var(--bg-app)", overflow: "hidden" }}>
        {isLoading ?
        <div className="h-full flex items-center justify-center">
            {/* Skeleton cards to prevent layout shift */}
            <div className="w-full h-full flex flex-col gap-3 pt-2">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", minHeight: 100 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
                    <div className="h-3 w-16 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 rounded-full w-full" style={{ backgroundColor: "var(--border-medium)" }} />
                    <div className="h-4 rounded-full w-4/5" style={{ backgroundColor: "var(--border-medium)" }} />
                    <div className="h-4 rounded-full w-3/5" style={{ backgroundColor: "var(--border-medium)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div> :
        viewMode === "swipe" ? (
        /* ---- SWIPE MODE ---- */
        visiblePosts.length === 0 ?
        <div className="h-full flex items-center justify-center">
              <div className="text-center">
                {feedTab === "following" && following.length === 0 ?
            <>
                    <p className="text-5xl mb-4">👥</p>
                    <p className="text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--text-secondary)" }}>Follow people to see their posts</p>
                    <p className="text-sm mt-2" style={{ color: "var(--text-hint)" }}>Visit someone's profile to follow them</p>
                  </> :

            <>
                    <p className="text-5xl mb-4">🌿</p>
                    <p className="text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--text-secondary)" }}>You've read everything</p>
                    <button
                onClick={() => {setCurrentIndex(0);refetch();}}
                className="mt-5 px-6 py-2.5 text-white rounded-full text-sm"
                style={{ backgroundColor: "var(--accent-primary)" }}>

                      Start Over
                    </button>
                  </>
            }
              </div>
            </div> :

        <div className="relative w-full h-full">
              <AnimatePresence mode="sync">
                {visiblePosts.slice(0, 3).map((post, i) =>
            <FullScreenSwipeCard
              key={post.id}
              post={post}
              isTop={i === 0}
              stackIndex={i}
              onLike={handleLike}
              onSkip={handleSkip}
              onReply={handleReply}
              onFavorite={() => {}}
              user={user} />

            )}
              </AnimatePresence>
              {/* Card counter */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs z-20 px-3 py-1 rounded-full" style={{ color: "var(--text-hint)", backgroundColor: "var(--bg-nav)", border: "1px solid var(--border-light)", opacity: 0.85 }}>
                {currentIndex + 1} / {filtered.length}
              </div>
            </div>) : (


        /* ---- LIST MODE ---- */
        <div
          ref={listRef}
          className="h-full overflow-y-auto space-y-3 pb-24"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>

            {/* Pull indicator */}
            <motion.div
            animate={{ height: pullY > 0 ? Math.min(pullY * 0.6, 56) : 0, opacity: pullY > 20 ? 1 : 0 }}
            className="flex items-center justify-center overflow-hidden">

              <motion.div animate={{ rotate: refreshing ? 360 : pullY * 3 }} transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: "linear" } : {}}>
                <RefreshCw className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
              </motion.div>
            </motion.div>
            {filtered.map((post) => {
            const ts = typeStyles[post.type] || typeStyles.quote;
            return (
              <div
                key={post.id}
                onClick={() => handleReply(post)}
                className="rounded-2xl p-5 cursor-pointer hover:shadow-sm transition-shadow"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>

                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${ts.dot}`} />
                    <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>{ts.label}</span>
                    <span className="ml-auto text-xs flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
                    {post.is_boosted && post.boost_expires_at && new Date(post.boost_expires_at) > new Date() &&
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> Boosted
                      </span>
                    }
                    {post.is_anonymous ? "Anonymous" : post.author_name}
                  </span>
                  </div>
                  <p className="leading-relaxed" style={{ fontFamily: getFontStyle(post.font_family || "serif"), fontSize: "1rem", color: "var(--text-primary)" }}>
                    {post.text}
                  </p>
                  <div className="flex gap-4 mt-3 text-xs" style={{ color: "var(--text-hint)" }}>
                    <span>♥ {post.like_count || 0}</span>
                    <span>💬 {post.reply_count || 0}</span>
                  </div>
                </div>);

          })}
          </div>)
        }
      </div>

      <CreatePostModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {refetch();setCurrentIndex(0);}}
        user={user} />

    </div>);

}