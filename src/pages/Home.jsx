import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, RefreshCw, List, Layers, Zap, Search, X } from "lucide-react";
import { usePullToRefresh } from "../components/hooks/usePullToRefresh";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import FullScreenSwipeCard from "../components/home/FullScreenSwipeCard";
import CreatePostModal from "../components/home/CreatePostModal";
import { getFontStyle } from "../components/home/FontPicker";
import WelcomePopup from "../components/home/WelcomePopup";
import CommunityFeed from "../components/community/CommunityFeed";

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
  const [mainTab, setMainTab] = useState("thoughts"); // "thoughts" | "community"
  const [feedTab, setFeedTab] = useState("all");
  const [likedTab, setLikedTab] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: () => base44.entities.Post.list("-created_date", 50)
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
    setCurrentIndex(0);
  }, [refetch]);

  const { containerRef: listRef, PullIndicator, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(handleRefresh);

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user?.email
  });

  // Liked posts = posts the user has liked
  const likedPosts = posts.filter((p) => user?.email && (p.liked_by || []).includes(user.email));

  const followingEmails = new Set((following || []).map((f) => f.following_email));

  const rawFiltered = (likedTab ? likedPosts : posts).filter((p) => {
    const typeMatch = activeFilter === "all" ? true : activeFilter === "questions" ? p.type === "question" : activeFilter === "quotes" ? p.type === "quote" : p.type === "concern";
    const feedMatch = likedTab || feedTab === "all" ? true : followingEmails.has(p.author_email);
    return typeMatch && feedMatch;
  });

  const now = new Date();
  const searchFiltered = searchQuery.trim() ?
  rawFiltered.filter((p) => p.text?.toLowerCase().includes(searchQuery.toLowerCase()) || p.author_name?.toLowerCase().includes(searchQuery.toLowerCase())) :
  rawFiltered;
  const filtered = [
  ...searchFiltered.filter((p) => p.is_boosted && p.boost_expires_at && new Date(p.boost_expires_at) > now),
  ...searchFiltered.filter((p) => !(p.is_boosted && p.boost_expires_at && new Date(p.boost_expires_at) > now))];


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
    <div className="flex flex-col" style={{ height: "calc(100dvh - 64px)", backgroundColor: "var(--bg-app)" }}>
      {/* Compact Header */}
      <div className="px-4 shrink-0" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        {/* Main tabs: Thoughts / Community */}
        <div className="flex gap-0 mb-3 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
          {[["thoughts","✦ Thoughts"],["community","🔥 Community"]].map(([val,label]) => (
            <button key={val} onClick={() => setMainTab(val)}
              className="flex-1 py-2 text-xs font-semibold transition-all"
              style={{
                backgroundColor: mainTab === val ? "var(--bg-card)" : "transparent",
                color: mainTab === val ? "var(--accent-primary)" : "var(--text-hint)",
                boxShadow: mainTab === val ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>{label}</button>
          ))}
        </div>
        {/* Feed tabs (only for Thoughts) */}
        <div className="flex items-center gap-3 mb-3 overflow-x-auto scrollbar-hide" style={{ display: mainTab === "thoughts" ? "flex" : "none" }}>
          {[["all", "✦ All Thoughts"], ["following", "👥 Following"]].map(([val, label]) =>
          <button
            key={val}
            onClick={() => {setFeedTab(val);setLikedTab(false);setCurrentIndex(0);}}
            className="flex items-center gap-1.5 text-sm font-semibold pb-1.5 transition-all whitespace-nowrap shrink-0"
            style={{
              color: !likedTab && feedTab === val ? "var(--accent-primary)" : "var(--text-hint)",
              borderBottom: !likedTab && feedTab === val ? "2.5px solid var(--accent-primary)" : "2.5px solid transparent"
            }}>
              {label}
            </button>
          )}
          <button
            onClick={() => {setLikedTab(true);setCurrentIndex(0);}}
            className="flex items-center gap-1.5 text-sm font-semibold pb-1.5 transition-all whitespace-nowrap shrink-0"
            style={{
              color: likedTab ? "#C86B6B" : "var(--text-hint)",
              borderBottom: likedTab ? "2.5px solid #C86B6B" : "2.5px solid transparent"
            }}>
            ♥ Liked
          </button>
        </div>
        {showSearch ?
        <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
              <input
              autoFocus
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value);setCurrentIndex(0);}}
              placeholder="Search posts..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--text-primary)", border: "none" }} />

              {searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} /></button>}
            </div>
            <button onClick={() => {setShowSearch(false);setSearchQuery("");}} className="text-xs font-medium px-2" style={{ color: "var(--accent-primary)" }}>Cancel</button>
          </div> :

        <div className="flex items-center justify-between">
            <span />
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSearch(true)} className="p-2 rounded-full border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                <Search className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode(viewMode === "swipe" ? "list" : "swipe")} className="p-2 rounded-full border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                {viewMode === "swipe" ? <List className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              </button>
              <button onClick={() => {setCurrentIndex(0);refetch();}} className="p-2 rounded-full border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setShowCreate(true)} className="bg-green-900 text-white px-4 py-2 text-xs font-semibold rounded-full flex items-center gap-1.5" style={{ backgroundColor: "var(--accent-primary)" }}>
                <Plus className="w-4 h-4" /> Post
              </button>
            </div>
          </div>
        }

        {/* Filter pills */}

        <div className="flex gap-2 mt-2 mb-2 overflow-x-auto scrollbar-hide">
          {[["all", "All"], ["questions", "Questions"], ["quotes", "Quotes"], ["concerns", "Concerns"]].map(([val, label]) =>
          <button
            key={val}
            onClick={() => {setActiveFilter(val);setCurrentIndex(0);}} className="px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-all"
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

      {/* Content area */}
      <div className="flex-1 overflow-hidden" style={{ backgroundColor: "var(--bg-app)" }}>
        {/* Community Feed */}
        {mainTab === "community" && (
          <div className="h-full overflow-y-auto">
            <CommunityFeed user={user} />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden px-4 py-3" style={{ backgroundColor: "var(--bg-app)", display: mainTab === "thoughts" ? "block" : "none" }}>
        {isLoading ?
        <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div> :
        viewMode === "swipe" ? (
        /* ---- SWIPE MODE ---- */
        visiblePosts.length === 0 ?
        <div className="h-full flex items-center justify-center">
              <div className="text-center">
                {(feedTab === "following" || likedTab) && !likedTab && following.length === 0 ?
            <>
                    <p className="text-5xl mb-4">👥</p>
                    <p className="text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--text-secondary)" }}>Follow people to see their posts</p>
                    <p className="text-sm mt-2" style={{ color: "var(--text-hint)" }}>Visit a post author's profile to follow them</p>
                  </> :
            likedTab && likedPosts.length === 0 ?
            <>
                    <p className="text-5xl mb-4">♥</p>
                    <p className="text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--text-secondary)" }}>No liked posts yet</p>
                    <p className="text-sm mt-2" style={{ color: "var(--text-hint)" }}>Swipe right or tap ♥ to like posts</p>
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
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-[#9B9B9B] z-20 pb-1">
                {currentIndex + 1} / {filtered.length}
              </div>
            </div>) : (


        /* ---- LIST MODE ---- */
        <div
          ref={listRef}
          className="h-full overflow-y-auto space-y-3 pb-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>

            {/* Pull indicator */}
            <PullIndicator />
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

      <WelcomePopup />
    </div>);

}