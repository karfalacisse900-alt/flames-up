import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Zap, Flame, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CommunityPostCard from "@/components/community/CommunityPostCard";

const CHALLENGE_QUESTIONS = [
  "What fact shocked you the most?",
  "What's the best city you ever visited?",
  "Post a fact about your city 🏙️",
  "What's a life tip everyone should know?",
  "What's something people don't know about your country?",
  "What place should everyone visit at least once?",
  "What free thing online changed your life?",
  "What's an underrated skill everyone should learn?",
  "What's the most beautiful thing you've ever seen?",
  "What's a local tradition that makes your city unique?",
  "What book changed the way you see the world?",
  "What's a money-saving tip that actually works?",
  "What's the kindest thing a stranger ever did for you?",
  "Share a hidden gem in your neighborhood",
  "What's a simple habit that improved your daily life?",
  "What app do you wish more people knew about?",
  "What's the best advice you've ever received?",
  "What's a cultural difference that surprised you?",
];

function getTodayQuestion() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return CHALLENGE_QUESTIONS[dayOfYear % CHALLENGE_QUESTIONS.length];
}

const TABS = ["Top Answers", "New Answers"];

export default function DailyChallenge() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Top Answers");
  const todayStr = new Date().toISOString().split("T")[0];
  const question = getTodayQuestion();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allPosts = [] } = useQuery({
    queryKey: ["challengePosts"],
    queryFn: () => base44.entities.CommunityPost.filter({ tags: "daily_challenge" }, "-created_date", 100),
    staleTime: 30000,
  });

  const todayPosts = allPosts.filter((p) => p.created_date?.startsWith(todayStr));
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weeklyPosts = allPosts.filter((p) => p.created_date >= weekAgo);

  // Weekly winner = most upvoted this week
  const weeklyWinner = weeklyPosts.reduce((best, p) => (!best || (p.upvotes || 0) > (best.upvotes || 0) ? p : best), null);

  const sortedPosts = activeTab === "Top Answers"
    ? [...todayPosts].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    : [...todayPosts].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const handleUpvote = async (post) => {
    if (!user) return;
    const hasLiked = post.upvoted_by?.includes(user.email);
    await base44.entities.CommunityPost.update(post.id, {
      upvotes: (post.upvotes || 0) + (hasLiked ? -1 : 1),
      upvoted_by: hasLiked
        ? (post.upvoted_by || []).filter((e) => e !== user.email)
        : [...(post.upvoted_by || []), user.email],
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl("Home")} className="p-1.5 rounded-full" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" style={{ color: "#FFD700" }} />
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              Daily Challenge
            </h1>
          </div>
        </div>

        {/* Today's question card */}
        <div
          className="rounded-2xl p-4 mb-3"
          style={{
            background: "linear-gradient(135deg, #2E6B4F 0%, #1a4a36 100%)",
            boxShadow: "0 4px 20px rgba(46,107,79,0.3)",
          }}
        >
          <div className="text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em" }}>
            TODAY'S QUESTION
          </div>
          <p className="font-bold text-base leading-snug" style={{ color: "#fff", fontFamily: "var(--font-serif)" }}>
            "{question}"
          </p>
          <div className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            {todayPosts.length} {todayPosts.length === 1 ? "answer" : "answers"} today
          </div>
        </div>

        {/* Weekly winner */}
        {weeklyWinner && (
          <div
            className="rounded-xl p-3 mb-3 flex items-center gap-3"
            style={{ backgroundColor: "#FFF8E1", border: "1px solid #FFD700" }}
          >
            <Trophy className="w-5 h-5 shrink-0" style={{ color: "#FFD700" }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold" style={{ color: "#B8860B" }}>🏆 Weekly Top Answer</div>
              <p className="text-xs truncate mt-0.5" style={{ color: "#5a4a00" }}>
                {weeklyWinner.author_name || "Anonymous"} · {weeklyWinner.upvotes || 0} likes
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: activeTab === tab ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: activeTab === tab ? "#fff" : "var(--text-secondary)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Posts list */}
      <div>
        {sortedPosts.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="text-4xl mb-3">✍️</div>
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>No answers yet today</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Be the first to answer today's challenge!</p>
            <Link
              to={createPageUrl("Home")}
              className="inline-block mt-4 px-5 py-2 rounded-full font-bold text-sm"
              style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
            >
              Answer Now
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {sortedPosts.map((post) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <CommunityPostCard post={post} user={user} onUpvote={() => handleUpvote(post)} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}