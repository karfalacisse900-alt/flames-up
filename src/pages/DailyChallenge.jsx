import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Zap, Clock, Users, Flame } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import { useQuery } from "@tanstack/react-query";

const FALLBACK_QUESTIONS = [
  "What fact shocked you the most?",
  "What's the best city you ever visited?",
  "Post a fact about your city",
  "What's a life tip everyone should know?",
  "What's something people don't know about your country?",
  "What place should everyone visit once?",
  "What free thing online changed your life?",
  "What's one book that changed how you see the world?",
  "What's the most underrated food in your culture?",
  "What's a small habit that made a big difference in your life?",
  "What's the most beautiful natural place you've ever been to?",
  "If you could live anywhere for one year, where would it be?",
];

function getDayQuestion() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return FALLBACK_QUESTIONS[dayOfYear % FALLBACK_QUESTIONS.length];
}

function getCountdown() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function DailyChallengePage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("top");
  const [challenge, setChallenge] = useState(null);
  const [countdown, setCountdown] = useState(getCountdown());
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const today = new Date().toISOString().slice(0, 10);
    base44.entities.DailyChallenge.filter({ date: today, is_active: true }, "-created_date", 1)
      .then(r => {
        setChallenge(r[0] || { question: getDayQuestion(), date: today, answer_count: 0 });
      })
      .catch(() => setChallenge({ question: getDayQuestion(), date: new Date().toISOString().slice(0, 10) }));
    const timer = setInterval(() => setCountdown(getCountdown()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["challengePosts"],
    queryFn: async () => {
      const posts = await base44.entities.CommunityPost.list("-created_date", 200);
      return posts.filter(p => p.tags?.includes("daily_challenge") && !p.group_id);
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const todayPosts = allPosts.filter(p => new Date(p.created_date) >= todayStart);

  const topPosts = [...allPosts].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  const newPosts = [...allPosts].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const friendPosts = user?.email
    ? allPosts.filter(p => p.author_email !== user.email)
    : [];

  const displayPosts = activeTab === "top" ? topPosts : activeTab === "new" ? newPosts : friendPosts;

  // Find weekly winner (highest upvoted this week)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0);
  const weekPosts = allPosts.filter(p => new Date(p.created_date) >= weekStart);
  const weekWinner = weekPosts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))[0];

  const upvoteMut = async (post) => {
    if (!user) return;
    const hasUpvoted = post.upvoted_by?.includes(user.email);
    await base44.entities.CommunityPost.update(post.id, {
      upvotes: hasUpvoted ? Math.max(0, (post.upvotes || 0) - 1) : (post.upvotes || 0) + 1,
      upvoted_by: hasUpvoted
        ? (post.upvoted_by || []).filter(e => e !== user.email)
        : [...(post.upvoted_by || []), user.email],
    });
  };

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-12 pb-0"
        style={{ backgroundColor: "rgba(242,237,228,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1A4231, #2E6B4F)" }}>
              <Zap className="w-4 h-4 text-yellow-300" />
            </div>
            <h1 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Daily Challenge</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {[
            { key: "top", label: "🏆 Top" },
            { key: "new", label: "✨ New" },
            { key: "friends", label: "👥 Community" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 text-sm font-semibold border-b-2 transition-all"
              style={{
                borderColor: activeTab === tab.key ? "var(--accent-primary)" : "transparent",
                color: activeTab === tab.key ? "var(--accent-primary)" : "var(--text-hint)",
                backgroundColor: "transparent",
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Question Card */}
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1A4231 0%, #2E6B4F 70%)", padding: "16px" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-[11px] font-bold tracking-widest text-yellow-300 uppercase">Today's Question</span>
          </div>
          <p className="text-white font-bold leading-snug mb-3" style={{ fontFamily: "var(--font-serif)", fontSize: 16 }}>
            "{challenge?.question || "..."}"
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{todayPosts.length} answers today</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Resets in {countdown}</span>
            </div>
            <button
              onClick={() => navigate(createPageUrl("Home"))}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
              style={{ backgroundColor: "#F97316" }}>
              ✦ Answer
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Winner */}
      {weekWinner && (
        <div className="px-4 pb-2">
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)" }}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#F59E0B" }}>🏆 Weekly Winner</p>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {weekWinner.author_name || "Anonymous"}
              </p>
              <p className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>
                {weekWinner.body?.replace(/<[^>]*>/g, "").slice(0, 60)}…
              </p>
            </div>
            <span className="text-xs font-bold shrink-0" style={{ color: "#F59E0B" }}>❤️ {weekWinner.upvotes || 0}</span>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="pb-28">
        {isLoading ? (
          <div className="flex flex-col gap-3 px-4 pt-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl p-4 space-y-2.5" style={{ backgroundColor: "var(--bg-card)" }}>
                <div className="flex gap-2 items-center"><div className="w-9 h-9 rounded-full skeleton" /><div className="h-3 w-28 rounded skeleton" /></div>
                <div className="h-3 rounded skeleton" />
                <div className="h-3 w-3/4 rounded skeleton" />
              </div>
            ))}
          </div>
        ) : displayPosts.length === 0 ? (
          <div className="py-16 text-center px-8">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-base font-bold mb-1.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No answers yet</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-hint)" }}>Be the first to answer today's challenge!</p>
            <button onClick={() => navigate(createPageUrl("Home"))}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
              ✦ Answer Challenge
            </button>
          </div>
        ) : (
          displayPosts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <CommunityPostCard post={post} user={user} onUpvote={() => upvoteMut(post)} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}