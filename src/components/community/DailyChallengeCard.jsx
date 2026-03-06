import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Zap, Users, Clock } from "lucide-react";

// Rotating questions by day-of-year
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
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return CHALLENGE_QUESTIONS[dayOfYear % CHALLENGE_QUESTIONS.length];
}

function getCountdown() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight - now;
  const h = Math.floor(diffMs / (1000 * 60 * 60));
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${h}h ${m}m`;
}

export default function DailyChallengeCard({ user, onOpenPostCreator }) {
  const [answerCount, setAnswerCount] = useState(null);
  const [countdown, setCountdown] = useState(getCountdown());
  const question = getTodayQuestion();
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    // Fetch today's answer count (posts tagged with daily_challenge for today)
    base44.entities.CommunityPost.filter({ tags: "daily_challenge" }, "-created_date", 100)
      .then((posts) => {
        const todayPosts = posts.filter((p) => {
          if (!p.created_date) return false;
          return p.created_date.startsWith(todayStr);
        });
        setAnswerCount(todayPosts.length);
      })
      .catch(() => setAnswerCount(0));
  }, [todayStr]);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAnswer = () => {
    if (!user) return;
    onOpenPostCreator({ challengeQuestion: question });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-3 mb-2 mt-1"
    >
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #2E6B4F 0%, #1a4a36 60%, #0f2e22 100%)",
          boxShadow: "0 4px 20px rgba(46,107,79,0.35)",
        }}
      >
        {/* Decorative background dots */}
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -30, left: -10, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}
              >
                <Zap className="w-3 h-3" style={{ fill: "#FFD700", color: "#FFD700" }} />
                DAILY CHALLENGE
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
              <Clock className="w-3 h-3" />
              <span>{countdown}</span>
            </div>
          </div>

          {/* Question */}
          <p
            className="font-bold leading-snug mb-3"
            style={{
              color: "#fff",
              fontSize: 17,
              fontFamily: "var(--font-serif)",
              lineHeight: 1.4,
            }}
          >
            "{question}"
          </p>

          {/* Footer row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              <Users className="w-3.5 h-3.5" />
              {answerCount !== null ? (
                <span>{answerCount > 0 ? `${answerCount} answered` : "Be first to answer!"}</span>
              ) : (
                <span>Loading...</span>
              )}
            </div>

            <button
              onClick={handleAnswer}
              className="px-4 py-1.5 rounded-full font-bold text-sm transition-all"
              style={{
                backgroundColor: "#FFD700",
                color: "#1a4a36",
                fontSize: 13,
                boxShadow: "0 2px 8px rgba(255,215,0,0.4)",
              }}
            >
              Answer Now ✍️
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}