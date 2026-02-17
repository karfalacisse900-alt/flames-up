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
    <div className="flex flex-col gap-3 w-full mt-5 p-4 rounded-2xl" style={{ backgroundColor: "rgba(60,110,90,0.04)", border: "1px solid var(--border-light)" }}>
      <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {post.answer_type === "yes_no" ? "Yes or No?" : "Choose one:"}
      </h4>
      {post.options.map((opt, idx) => {
        const count = votes[idx] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isSelected = myVote === idx;
        return (
          <button
            key={idx}
            onClick={(e) => handleVote(e, idx)}
            className="relative rounded-xl text-left overflow-hidden transition-all hover:shadow-sm active:scale-98"
            style={{
              border: `2px solid ${isSelected ? "var(--accent-primary)" : "var(--border-light)"}`,
              backgroundColor: isSelected ? "rgba(60,110,90,0.1)" : "var(--bg-nav)",
            }}
          >
            {/* Progress bar background */}
            <div
              className="absolute inset-0 rounded-xl transition-all duration-300"
              style={{
                width: `${pct}%`,
                backgroundColor: isSelected ? "rgba(60,110,90,0.15)" : "rgba(60,110,90,0.06)",
              }}
            />
            
            {/* Content */}
            <div className="relative flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Checkmark indicator */}
                {isSelected && (
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" 
                    style={{ backgroundColor: "var(--accent-primary)" }}>
                    ✓
                  </span>
                )}
                <span className="text-sm font-medium truncate" style={{ color: isSelected ? "var(--accent-primary)" : "var(--text-primary)" }}>
                  {opt}
                </span>
              </div>
              
              {/* Vote stats */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold" style={{ color: isSelected ? "var(--accent-primary)" : "var(--text-primary)" }}>
                    {pct}%
                  </div>
                  <div className="text-[10px] leading-tight" style={{ color: "var(--text-hint)" }}>
                    {count} vote{count !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
      
      {/* Footer info */}
      <div className="flex items-center justify-between px-1 mt-1 pt-2 border-t" style={{ borderColor: "var(--border-light)", color: "var(--text-hint)" }}>
        <p className="text-xs">
          <strong>{totalVotes}</strong> total vote{totalVotes !== 1 ? "s" : ""}
        </p>
        <p className="text-xs">
          {hasVoted ? "✓ voted" : "no vote yet"}
        </p>
      </div>
      {hasVoted && (
        <p className="text-xs text-center font-medium" style={{ color: "var(--accent-primary)" }}>
          Tap another option to change your vote
        </p>
      )}
    </div>
  );
}