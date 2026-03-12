import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2 } from "lucide-react";

export default function PollComponent({ poll, onVote, currentUserEmail, isReadOnly }) {
  const [localPoll, setLocalPoll] = useState(poll);
  const [voting, setVoting] = useState(false);
  const userVote = localPoll.voters?.[currentUserEmail];

  useEffect(() => {
    setLocalPoll(poll);
  }, [poll]);

  const handleVote = async (optionId) => {
    if (voting || userVote || isReadOnly) return;
    setVoting(true);

    try {
      const updatedVoters = { ...localPoll.voters, [currentUserEmail]: optionId };
      const updatedOptions = localPoll.options.map((opt) => ({
        ...opt,
        vote_count: opt.id === optionId ? (opt.vote_count || 0) + 1 : opt.vote_count || 0,
      }));

      await base44.entities.Poll.update(localPoll.id, {
        voters: updatedVoters,
        options: updatedOptions,
        total_votes: (localPoll.total_votes || 0) + 1,
      });

      setLocalPoll({
        ...localPoll,
        voters: updatedVoters,
        options: updatedOptions,
        total_votes: (localPoll.total_votes || 0) + 1,
      });

      if (onVote) onVote(optionId);
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setVoting(false);
    }
  };

  const totalVotes = localPoll.total_votes || 0;

  return (
    <div className="w-full rounded-2xl p-4" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
      <p className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
        {localPoll.question}
      </p>

      <div className="space-y-2.5">
        {localPoll.options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round(((option.vote_count || 0) / totalVotes) * 100) : 0;
          const isSelected = userVote === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={voting || userVote || isReadOnly}
              className="w-full text-left relative overflow-hidden rounded-lg transition-all duration-200"
              style={{
                backgroundColor: isSelected ? "var(--accent-primary)" : "var(--bg-card)",
                border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-light)",
                opacity: voting ? 0.7 : 1,
                cursor: voting || userVote || isReadOnly ? "default" : "pointer",
              }}
            >
              {/* Background bar showing percentage */}
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                  backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "var(--accent-primary-light)",
                  width: `${percentage}%`,
                }}
              />

              {/* Content */}
              <div className="relative px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="w-4 h-4" style={{ color: isSelected ? "#fff" : "var(--text-primary)" }} />}
                  <span
                    className="text-sm font-medium"
                    style={{ color: isSelected ? "#fff" : "var(--text-primary)" }}
                  >
                    {option.text}
                  </span>
                </div>
                <span
                  className="text-xs font-bold"
                  style={{ color: isSelected ? "#fff" : "var(--text-secondary)" }}
                >
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p
        className="text-xs mt-3"
        style={{ color: "var(--text-hint)", textAlign: "center" }}
      >
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
      </p>
    </div>
  );
}