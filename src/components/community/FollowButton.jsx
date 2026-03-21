import React from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function FollowButton({ targetUserId, targetUserName, currentUser, onFollowChange }) {
  const qc = useQueryClient();

  const { data: followRecord } = useQuery({
    queryKey: ["follow", currentUser?.email, targetUserId],
    queryFn: async () => {
      const follows = await base44.entities.Follow.filter({
        follower_email: currentUser.email,
        following_email: targetUserId,
      });
      return follows[0] ?? null;
    },
    enabled: !!currentUser?.email && !!targetUserId && currentUser.email !== targetUserId,
    staleTime: 30000,
  });

  const isFollowing = !!followRecord;

  const mutation = useMutation({
    mutationFn: async () => {
      if (isFollowing && followRecord) {
        await base44.entities.Follow.delete(followRecord.id);
        return null;
      } else {
        const rec = await base44.entities.Follow.create({
          follower_email: currentUser.email,
          follower_name: currentUser.display_name || currentUser.full_name || "User",
          following_email: targetUserId,
          following_name: targetUserName || "User",
        });
        return rec;
      }
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["follow", currentUser?.email, targetUserId] });
      const snapshot = qc.getQueryData(["follow", currentUser?.email, targetUserId]);
      // Optimistically toggle
      qc.setQueryData(["follow", currentUser?.email, targetUserId], isFollowing ? null : { id: "optimistic" });
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot !== undefined) {
        qc.setQueryData(["follow", currentUser?.email, targetUserId], ctx.snapshot);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["follow", currentUser?.email, targetUserId] });
      onFollowChange?.();
    },
  });

  if (!currentUser || currentUser.email === targetUserId) return null;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!mutation.isPending) mutation.mutate(); }}
      disabled={mutation.isPending}
      aria-label={isFollowing ? `Unfollow ${targetUserName || "user"}` : `Follow ${targetUserName || "user"}`}
      aria-pressed={isFollowing}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
      style={{
        backgroundColor: isFollowing ? "var(--bg-subtle)" : "var(--accent-primary)",
        color: isFollowing ? "var(--text-secondary)" : "#fff",
        border: isFollowing ? "1px solid var(--border-light)" : "none",
      }}
    >
      {isFollowing ? <><UserCheck className="w-4 h-4" />Following</> : <><UserPlus className="w-4 h-4" />Follow</>}
    </button>
  );
}