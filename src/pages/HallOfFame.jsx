import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Star, Heart, Swords, Bookmark, Loader2 } from "lucide-react";

const CATEGORIES = [
  { id: "photographer", label: "Photographer of the Month", icon: "📸", desc: "Most challenge wins" },
  { id: "viral_photo",  label: "Most Viral Photo",          icon: "🔥", desc: "Highest likes this month" },
  { id: "did_you_know", label: "Best Did You Know",         icon: "💡", desc: "Most likes on a fact" },
  { id: "vote_arena",   label: "Vote Arena Champion",       icon: "⚔️", desc: "Most wins in 1v1 battles" },
  { id: "most_saves",   label: "Most Saves",                icon: "🔖", desc: "Most bookmarked creator" },
];

function StatBadge({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl" style={{ backgroundColor: color + "18" }}>
      <p className="text-base font-black" style={{ color }}>{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: color + "CC" }}>{label}</p>
    </div>
  );
}

function HallCard({ rank, entry, color, icon }) {
  const isGold = rank === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.07 }}
      className="relative p-5 rounded-3xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: isGold ? "2px solid #D4A017" : "1px solid var(--border-light)",
        boxShadow: isGold ? "0 4px 24px rgba(212,160,23,0.15)" : "0 1px 8px rgba(0,0,0,0.06)",
      }}>
      {/* Gold shimmer strip for #1 */}
      {isGold && <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: "linear-gradient(90deg, #D4A017, #F5D060, #D4A017)" }} />}

      {/* Rank badge */}
      <div className="absolute top-3 right-3 text-xl">
        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : <span className="text-sm font-black" style={{ color: "var(--text-hint)" }}>#{rank}</span>}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
            style={{ background: isGold ? "linear-gradient(135deg, #D4A017, #F5D060)" : `linear-gradient(135deg, ${color}, ${color}99)` }}>
            {entry.user_name?.[0]?.toUpperCase() || "?"}
          </div>
          {isGold && (
            <div className="absolute -top-2 -right-2 text-sm">👑</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold truncate" style={{ color: isGold ? "#B8860B" : "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {entry.user_name}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-hint)" }}>
            {icon} {entry.category_label}
          </p>
          {entry.badge_label && (
            <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: isGold ? "#FEF9E7" : "var(--accent-primary-light)", color: isGold ? "#B8860B" : "var(--accent-primary)", border: `1px solid ${isGold ? "#D4A017" : "var(--border-light)"}` }}>
              {entry.badge_label}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        {entry.stats?.map((s, i) => (
          <StatBadge key={i} label={s.label} value={s.value} color={isGold ? "#B8860B" : color} />
        ))}
      </div>

      {/* Preview image */}
      {entry.preview_url && (
        <div className="mt-4 rounded-xl overflow-hidden">
          <img src={entry.preview_url} alt="top work" className="w-full max-h-40 object-cover" />
        </div>
      )}
    </motion.div>
  );
}

export default function HallOfFame() {
  const [activeCategory, setActiveCategory] = useState("photographer");

  const { data: artworks = [] } = useQuery({
    queryKey: ["artworksFame"],
    queryFn: () => base44.entities.Artwork.filter({ status: "published" }, "-like_count", 100),
  });
  const { data: artFightEntries = [] } = useQuery({
    queryKey: ["fightEntriesFame"],
    queryFn: () => base44.entities.ArtFightEntry.list("-wins", 20),
  });
  const { data: dykPosts = [] } = useQuery({
    queryKey: ["dykFame"],
    queryFn: () => base44.entities.DidYouKnow.filter({ status: "approved" }, "-like_count", 20),
  });
  const { data: challenges = [] } = useQuery({
    queryKey: ["challengesFame"],
    queryFn: () => base44.entities.PhotoChallenge.list("-created_date", 20),
  });
  const { data: challengeEntries = [] } = useQuery({
    queryKey: ["challengeEntriesFame"],
    queryFn: () => base44.entities.ChallengeEntry.filter({ is_winner: true }, "-created_date", 50),
  });

  const winners = useMemo(() => {
    if (activeCategory === "photographer") {
      const map = {};
      challengeEntries.forEach(e => {
        if (!map[e.user_email]) map[e.user_email] = { user_name: e.user_name, user_email: e.user_email, wins: 0, preview_url: e.image_url };
        map[e.user_email].wins++;
      });
      return Object.values(map).sort((a, b) => b.wins - a.wins).slice(0, 5).map(u => ({
        ...u,
        category_label: "Challenge Wins",
        stats: [{ label: "Wins", value: u.wins }],
        badge_label: "🥇 Challenge Champion",
      }));
    }
    if (activeCategory === "viral_photo") {
      return artworks.slice(0, 5).map(a => ({
        user_name: a.user_name,
        category_label: "Viral Photo",
        preview_url: a.image_url,
        stats: [{ label: "Likes", value: a.like_count || 0 }],
        badge_label: "🔥 Most Viral",
      }));
    }
    if (activeCategory === "did_you_know") {
      return dykPosts.slice(0, 5).map(d => ({
        user_name: d.submitter_name || "Anonymous",
        category_label: "Best Did You Know",
        stats: [{ label: "Likes", value: d.like_count || 0 }],
        badge_label: "💡 Knowledge Leader",
      }));
    }
    if (activeCategory === "vote_arena") {
      return artFightEntries.slice(0, 5).map(e => ({
        user_name: e.owner_name,
        category_label: "Vote Arena",
        preview_url: e.image_url,
        stats: [{ label: "Wins", value: e.wins || 0 }, { label: "Score", value: e.fight_score || 0 }],
        badge_label: "⚔️ Arena Champion",
      }));
    }
    if (activeCategory === "most_saves") {
      const map = {};
      artworks.forEach(a => {
        if (!map[a.user_email]) map[a.user_email] = { user_name: a.user_name, saves: 0, preview_url: a.image_url };
        map[a.user_email].saves += (a.save_count || 0);
      });
      return Object.values(map).sort((a, b) => b.saves - a.saves).slice(0, 5).map(u => ({
        ...u,
        category_label: "Most Saves",
        stats: [{ label: "Saves", value: u.saves }],
        badge_label: "🔖 Top Curator",
      }));
    }
    return [];
  }, [activeCategory, artworks, artFightEntries, dykPosts, challengeEntries]);

  const catInfo = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen pb-24" style={{ background: "linear-gradient(180deg, #0d1117 0%, #1a1a2e 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-8 pb-5" style={{ background: "linear-gradient(180deg, #0d1117, #1a1a2e)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>🏆</div>
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-serif)" }}>Hall of Fame</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Monthly prestige. Earned, not bought.</p>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border"
              style={{
                backgroundColor: activeCategory === c.id ? "#FFD700" : "rgba(255,255,255,0.06)",
                color: activeCategory === c.id ? "#1a1a1a" : "rgba(255,255,255,0.5)",
                borderColor: activeCategory === c.id ? "#FFD700" : "rgba(255,255,255,0.1)",
              }}>
              {c.icon} {c.label.split(" ").slice(0, 2).join(" ")}
            </button>
          ))}
        </div>
      </div>

      {/* Category heading */}
      <div className="px-5 pb-4">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#FFD700" }}>{catInfo?.icon} {catInfo?.label}</p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{catInfo?.desc}</p>
      </div>

      {/* Winners list */}
      <div className="px-4 space-y-4 pb-8">
        {winners.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-sm font-semibold text-white/50">No data yet — be the first to earn your spot</p>
          </div>
        )}
        {winners.map((entry, i) => (
          <HallCard key={i} rank={i + 1} entry={entry} color="#2E6B4F" icon={catInfo?.icon} />
        ))}
      </div>
    </div>
  );
}