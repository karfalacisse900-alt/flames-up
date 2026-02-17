import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import SwipeCard from "../components/home/SwipeCard";
import CreatePostModal from "../components/home/CreatePostModal";

export default function Home() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: () => base44.entities.Post.list("-created_date", 50),
  });

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

  const handleSkip = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleReply = (post) => {
    window.location.href = createPageUrl("PostDetail") + `?id=${post.id}`;
  };

  const visiblePosts = posts.slice(currentIndex);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 px-5 pt-5 pb-3" style={{ backgroundColor: "rgba(250,248,245,0.95)", backdropFilter: "blur(10px)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
              Thoughts
            </h1>
            <p className="text-xs text-[#9B9B9B] mt-0.5">Swipe through what matters</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCurrentIndex(0); refetch(); }}
              className="p-2.5 rounded-full bg-white border border-[#EDE9E3] text-[#6B6B6B] hover:text-[#2C2C2C] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="p-2.5 rounded-full bg-[#7C8C6E] text-white shadow-md hover:bg-[#6B7B5E] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-2 mt-4">
          {["All", "Questions", "Quotes", "Concerns"].map((label) => (
            <button
              key={label}
              className="px-3 py-1.5 text-xs rounded-full border border-[#EDE9E3] bg-white text-[#6B6B6B] hover:border-[#7C8C6E] hover:text-[#7C8C6E] transition-all"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Swipe area */}
      <div className="relative mx-5 mt-4" style={{ height: "calc(100vh - 260px)" }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#7C8C6E] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[#9B9B9B] mt-3">Loading thoughts...</p>
            </div>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl mb-4">🌿</p>
              <p className="font-serif text-lg text-[#6B6B6B]" style={{ fontFamily: "var(--font-serif)" }}>
                You've seen everything
              </p>
              <p className="text-sm text-[#9B9B9B] mt-1">Pull to refresh or create a new post</p>
              <button
                onClick={() => { setCurrentIndex(0); refetch(); }}
                className="mt-4 px-5 py-2 bg-[#7C8C6E] text-white rounded-full text-sm hover:bg-[#6B7B5E] transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {visiblePosts.slice(0, 3).map((post, i) => (
              <SwipeCard
                key={post.id}
                post={post}
                isTop={i === 0}
                onLike={handleLike}
                onSkip={handleSkip}
                onReply={handleReply}
              />
            ))}
          </AnimatePresence>
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