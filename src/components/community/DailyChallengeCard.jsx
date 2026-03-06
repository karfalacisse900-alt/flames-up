import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Zap, Users, Clock, Trophy } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

// Rotating questions pool — used as fallback when no DB challenge exists
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

export default function DailyChallengeCard({ user, onAnswerChallenge }) {
  const [challenge, setChallenge] = useState(null);
  const [countdown, setCountdown] = useState(getCountdown());
  const [answerCount, setAnswerCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    base44.entities.DailyChallenge.filter({ date: today, is_active: true }, "-created_date", 1)
      .then(results => {
        if (results[0]) {
          setChallenge(results[0]);
          setAnswerCount(results[0].answer_count || 0);
        } else {
          // Use fallback rotating question
          setChallenge({ question: getDayQuestion(), date: today, answer_count: 0 });
        }
      })
      .catch(() => {
        setChallenge({ question: getDayQuestion(), date: new Date().toISOString().slice(0, 10), answer_count: 0 });
      });

    // Also count challenge posts for today
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    base44.entities.CommunityPost.filter({ tags: ["daily_challenge"] }, "-created_date", 200)
      .then(posts => {
        const todayPosts = posts.filter(p => new Date(p.created_date) >= todayStart);
        setAnswerCount(todayPosts.length);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!challenge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-3 mb-1 mt-2 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1A4231 0%, #2E6B4F 60%, #3A8060 100%)",
        boxShadow: "0 4px 20px rgba(46,107,79,0.35)",
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
          </div>
          <span className="text-[11px] font-bold tracking-widest text-yellow-300 uppercase">Daily Challenge</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>
          <Clock className="w-3 h-3" />
          <span>Next in {countdown}</span>
        </div>
      </div>

      {/* Question */}
      <div className="px-4 py-2.5">
        <p className="text-white font-bold leading-snug" style={{ fontFamily: "var(--font-serif)", fontSize: 17 }}>
          "{challenge.question}"
        </p>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between px-4 pb-3.5 pt-1 gap-3">
        <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">
            {answerCount > 0 ? `${answerCount} answered` : "Be first to answer"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={createPageUrl("DailyChallenge")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}
          >
            View all
          </Link>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => onAnswerChallenge(challenge)}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ backgroundColor: "#F97316", boxShadow: "0 2px 10px rgba(249,115,22,0.45)" }}
          >
            ✦ Answer Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}