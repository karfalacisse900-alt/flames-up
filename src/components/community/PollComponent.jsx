import React from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function PollComponent({ poll, onVote, currentUserEmail, isReadOnly }) {
  const qc = useQueryClient();
  const userVote = poll.voters?.[currentUserEmail];
  const totalVotes = poll.total_votes || 0;

  const mutation = useMutation({
    mutationFn: async (optionId) => {
      const updatedVoters = { ...poll.voters, [currentUserEmail]: optionId };
      const updatedOptions = poll.options.map(opt => ({
        ...opt,
        vote_count: opt.id === optionId ? (opt.vote_count || 0) + 1 : opt.vote_count || 0,
      }));
      await base44.entities.Poll.update(poll.id, {
        voters: updatedVoters,
        options: updatedOptions,
        total_votes: totalVotes + 1,
      });
      return { updatedVoters, updatedOptions };
    },
    onMutate: async (optionId) => {
      await qc.cancelQueries({ queryKey: ["poll", poll.id] });
      const snapshot = qc.getQueryData(["poll", poll.id]);

      // Optimistic local state
      const optimistic = {
        ...poll,
        voters: { ...poll.voters, [currentUserEmail]: optionId },
        options: poll.options.map(opt => ({
          ...opt,
          vote_count: opt.id === optionId ? (opt.vote_count || 0) + 1 : opt.vote_count || 0,
        })),
        total_votes: totalVotes + 1,
      };
      qc.setQueryData(["poll", poll.id], optimistic);
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) qc.setQueryData(["poll", poll.id], ctx.snapshot);
    },
    onSettled: (data, _err, optionId) => {
      qc.invalidateQueries({ queryKey: ["poll", poll.id] });
      onVote?.(optionId);
    },
  });

  // Use optimistic data from cache if available, fall back to prop
  const displayPoll = qc.getQueryData(["poll", poll.id]) ?? poll;
  const displayUserVote = displayPoll.voters?.[currentUserEmail];
  const displayTotal = displayPoll.total_votes || 0;

  return (
    <div
      className="w-full rounded-2xl p-4"
      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
      role="group"
      aria-label={`Poll: ${poll.question}`}
    >
      <p className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
        {poll.question}
      </p>

      <div className="space-y-2.5">
        {displayPoll.options.map((option) => {
          const percentage = displayTotal > 0 ? Math.round(((option.vote_count || 0) / displayTotal) * 100) : 0;
          const isSelected = displayUserVote === option.id;

          return (
            <button
              key={option.id}
              onClick={() => !mutation.isPending && !displayUserVote && !isReadOnly && mutation.mutate(option.id)}
              disabled={mutation.isPending || !!displayUserVote || isReadOnly}
              aria-label={`Vote for ${option.text}${isSelected ? " (your vote)" : ""}, ${percentage}%`}
              aria-pressed={isSelected}
              className="w-full text-left relative overflow-hidden rounded-lg transition-all duration-200"
              style={{
                backgroundColor: isSelected ? "var(--accent-primary)" : "var(--bg-card)",
                border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-light)",
                opacity: mutation.isPending ? 0.7 : 1,
                cursor: mutation.isPending || displayUserVote || isReadOnly ? "default" : "pointer",
              }}
            >
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                  backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "var(--accent-primary-light)",
                  width: `${percentage}%`,
                }}
              />
              <div className="relative px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="w-4 h-4" style={{ color: "#fff" }} />}
                  <span className="text-sm font-medium" style={{ color: isSelected ? "#fff" : "var(--text-primary)" }}>
                    {option.text}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: isSelected ? "#fff" : "var(--text-secondary)" }}>
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs mt-3 text-center" style={{ color: "var(--text-hint)" }}>
        {displayTotal} vote{displayTotal !== 1 ? "s" : ""}
      </p>
    </div>
  );
}