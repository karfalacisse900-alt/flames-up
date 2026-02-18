import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, RefreshCw, List, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import FullScreenSwipeCard from "../components/home/FullScreenSwipeCard";
import CreatePostModal from "../components/home/CreatePostModal";

const typeStyles = {
  question: { label: "Question", dot: "bg-amber-400" },
  quote: { label: "Quote", dot: "bg-emerald-400" },
  concern: { label: "Concern", dot: "bg-rose-400" },
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState("swipe"); // "swipe" | "list"
  const [activeFilter, setActiveFilter] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: () => base44.entities.Post.list("-created_date", 50),
  });

  const rawFiltered = posts.filter((p) =>
    activeFilter === "all" ? true :
    activeFilter === "questions" ? p.type === "question" :
    activeFilter === "quotes" ? p.type === "quote" :
    p.type === "concern"
  );

  // Boosted posts (still active) float to top
  const now = new Date();
  const filtered = [
    ...rawFiltered.filter((p) => p.is_boosted && p.boost_expires_at && new Date(p.boost_expires_at) > now),
    ...rawFiltered.filter((p) => !(p.is_boosted && p.boost_expires_at && new Date(p.boost_expires_at) > now)),
  ];

  const handleLike = async (post) => {
    const email = user?.email;
    if (!email) return;
    const likedBy = post.liked_by || [];
    if (!likedBy.includes(email)) {
      await base44.entities.Post.update(post.id, {
        like_count: (post.like_count || 0) + 1,
        liked_by: [...likedBy, email],
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = () => setCurrentIndex((prev) => prev + 1);

  const handleReply = (post) => {
    window.location.href = createPageUrl("PostDetail") + `?id=${post.id}`;
  };

  const visiblePosts = filtered.slice(currentIndex);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", backgroundColor: "var(--bg-app)" }}>
      {/* Compact Header */}
      <div className="px-5 pt-5 pb-3 shrink-0" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Thoughts</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "swipe" ? "list" : "swipe")}
              className="p-2 rounded-full border"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}
              title={viewMode === "swipe" ? "Switch to list" : "Switch to swipe"}
            >
              {viewMode === "swipe" ? <List className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { setCurrentIndex(0); refetch(); }}
              className="p-2 rounded-full border"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-semibold"
              style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 14px rgba(60,110,90,0.4)" }}
            >
              <Plus className="w-4 h-4" /> Post
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {[["all", "All"], ["questions", "Questions"], ["quotes", "Quotes"], ["concerns", "Concerns"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setActiveFilter(val); setCurrentIndex(0); }}
              className="px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeFilter === val ? "var(--accent-primary)" : "var(--bg-nav)",
                color: activeFilter === val ? "#fff" : "var(--text-secondary)",
                borderColor: activeFilter === val ? "var(--accent-primary)" : "var(--border-light)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden px-4 pt-2 pb-4" style={{ backgroundColor: "var(--bg-app)" }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : viewMode === "swipe" ? (
          /* ---- SWIPE MODE ---- */
          visiblePosts.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-5xl mb-4">🌿</p>
                <p className="text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--text-secondary)" }}>You've read everything</p>
                <button
                  onClick={() => { setCurrentIndex(0); refetch(); }}
                  className="mt-5 px-6 py-2.5 text-white rounded-full text-sm"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                >
                  Start Over
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <AnimatePresence mode="sync">
                {visiblePosts.slice(0, 3).map((post, i) => (
                  <FullScreenSwipeCard
                  key={post.id}
                  post={post}
                  isTop={i === 0}
                  stackIndex={i}
                  onLike={handleLike}
                  onSkip={handleSkip}
                  onReply={handleReply}
                  onFavorite={() => {}}
                  user={user}
                  />
                ))}
              </AnimatePresence>
              {/* Card counter */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-[#9B9B9B] z-20 pb-1">
                {currentIndex + 1} / {filtered.length}
              </div>
            </div>
          )
        ) : (
          /* ---- LIST MODE ---- */
          <div className="h-full overflow-y-auto space-y-3 pb-4">
            {filtered.map((post) => {
              const ts = typeStyles[post.type] || typeStyles.quote;
              return (
                <div
                  key={post.id}
                  onClick={() => handleReply(post)}
                  className="rounded-2xl p-5 cursor-pointer hover:shadow-sm transition-shadow"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${ts.dot}`} />
                    <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>{ts.label}</span>
                    <span className="ml-auto text-xs" style={{ color: "var(--text-hint)" }}>{post.is_anonymous ? "Anonymous" : post.author_name}</span>
                  </div>
                  <p className="leading-relaxed" style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--text-primary)" }}>
                    {post.text}
                  </p>
                  <div className="flex gap-4 mt-3 text-xs" style={{ color: "var(--text-hint)" }}>
                    <span>♥ {post.like_count || 0}</span>
                    <span>💬 {post.reply_count || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreatePostModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { refetch(); setCurrentIndex(0); }}
        user={user}
      />
    </div>
  );
}