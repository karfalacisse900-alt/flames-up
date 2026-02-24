import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const VOTE_OPTIONS = [
  { key: "useful", emoji: "👍", label: "Useful" },
  { key: "not_for_me", emoji: "🤔", label: "Not for me" },
  { key: "worth_trying", emoji: "🔥", label: "Worth trying" },
];

const VOTE_KEY = "quick_votes_v1";

function loadVotes() {
  try { return JSON.parse(localStorage.getItem(VOTE_KEY) || "{}"); } catch { return {}; }
}
function saveVote(itemId, vote) {
  const votes = loadVotes();
  votes[itemId] = vote;
  localStorage.setItem(VOTE_KEY, JSON.stringify(votes));
}

export default function QuickVote({ item }) {
  const [myVote, setMyVote] = useState(() => loadVotes()[item.id] || null);
  // Simulated community counts from avg_rating and review_count as a proxy
  const seed = item.id ? item.id.charCodeAt(0) + (item.id.charCodeAt(1) || 0) : 10;
  const counts = {
    useful: 12 + (seed % 30),
    not_for_me: 3 + (seed % 12),
    worth_trying: 20 + (seed % 50),
  };
  if (myVote) counts[myVote] += 1;

  const handleVote = (key) => {
    const next = myVote === key ? null : key;
    setMyVote(next);
    saveVote(item.id, next);
  };

  const topVote = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="mt-2.5">
      <div className="flex gap-2">
        {VOTE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={e => { e.stopPropagation(); handleVote(opt.key); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-95"
            style={{
              backgroundColor: myVote === opt.key ? "var(--accent-primary-light)" : "var(--bg-subtle)",
              borderColor: myVote === opt.key ? "var(--accent-primary)" : "var(--border-light)",
              color: myVote === opt.key ? "var(--accent-primary)" : "var(--text-secondary)",
            }}
          >
            <span>{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      {topVote && (
        <p className="text-[10px] mt-1.5" style={{ color: "var(--text-hint)" }}>
          {counts[topVote[0]]} people think it's{" "}
          {topVote[0] === "useful" ? "useful" : topVote[0] === "worth_trying" ? "worth trying" : "not for them"}
        </p>
      )}
    </div>
  );
}