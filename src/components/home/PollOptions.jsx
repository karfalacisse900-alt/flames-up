import React from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function PollOptions({ post, user, compact = false }) {
  if (!post || post.type !== "question" || !post.answer_type || post.answer_type === "open") return null;
  if (!post.options || post.options.length === 0) return null;

  const votes = post.votes || {};
  const votedBy = post.voted_by || {};
  const totalVotes = post.total_votes || 0;
  const myVote = user?.email ? votedBy[user.email] : undefined;
  const hasVoted = myVote !== undefined && myVote !== null;
  const queryClient = useQueryClient();

  const handleVote = async (e, idx) => {
    e.stopPropagation();
    if (!user?.email) return;

    const newVotedBy = { ...votedBy };
    const newVotes = { ...votes };

    // Remove previous vote if any
    if (hasVoted) {
      const prev = myVote;
      newVotes[prev] = Math.max(0, (newVotes[prev] || 0) - 1);
    }

    // Add new vote
    newVotes[idx] = (newVotes[idx] || 0) + 1;
    newVotedBy[user.email] = idx;

    const newTotal = Object.values(newVotes).reduce((a, b) => a + b, 0);

    await base44.entities.Post.update(post.id, {
      votes: newVotes,
      voted_by: newVotedBy,
      total_votes: newTotal,
    });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["post", post.id] });
  };

  if (compact) {
    // Compact version for swipe card
    return (
      <div className="flex flex-col gap-2 w-full mt-4" onClick={(e) => e.stopPropagation()}>
        {post.options.map((opt, idx) => {
          const count = votes[idx] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = myVote === idx;
          return (
            <button
              key={idx}
              onClick={(e) => handleVote(e, idx)}
              className="relative rounded-xl text-left overflow-hidden transition-all"
              style={{
                border: `1.5px solid ${isSelected ? "var(--accent-primary)" : "rgba(0,0,0,0.1)"}`,
                backgroundColor: isSelected ? "rgba(60,110,90,0.08)" : "rgba(255,255,255,0.6)",
              }}
            >
              {hasVoted && (
                <div
                  className="absolute inset-0 rounded-xl transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isSelected ? "rgba(60,110,90,0.15)" : "rgba(0,0,0,0.04)",
                  }}
                />
              )}
              <div className="relative flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium" style={{ color: isSelected ? "var(--accent-primary)" : "#333" }}>
                  {opt}
                </span>
                {hasVoted && (
                  <span className="text-xs font-semibold ml-2 shrink-0" style={{ color: isSelected ? "var(--accent-primary)" : "#999" }}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {totalVotes > 0 && (
          <p className="text-center text-[10px] mt-0.5" style={{ color: "#AAA" }}>
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    );
  }

  // Full version for detail view
  return (
    <div className="flex flex-col gap-2.5 w-full mt-5">
      {post.options.map((opt, idx) => {
        const count = votes[idx] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isSelected = myVote === idx;
        return (
          <button
            key={idx}
            onClick={(e) => handleVote(e, idx)}
            className="relative rounded-xl text-left overflow-hidden transition-all"
            style={{
              border: `1.5px solid ${isSelected ? "var(--accent-primary)" : "var(--border-light)"}`,
              backgroundColor: isSelected ? "rgba(60,110,90,0.06)" : "var(--bg-app)",
            }}
          >
            {/* Progress bar */}
            <div
              className="absolute inset-0 rounded-xl transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: isSelected ? "rgba(60,110,90,0.12)" : "rgba(0,0,0,0.03)",
              }}
            />
            <div className="relative flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium" style={{ color: isSelected ? "var(--accent-primary)" : "var(--text-primary)" }}>
                {opt}
              </span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs" style={{ color: "var(--text-hint)" }}>{count} vote{count !== 1 ? "s" : ""}</span>
                <span className="text-xs font-bold w-9 text-right" style={{ color: isSelected ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                  {pct}%
                </span>
              </div>
            </div>
          </button>
        );
      })}
      <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
        {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
        {hasVoted ? " · tap to change" : " · tap to vote"}
      </p>
    </div>
  );
}