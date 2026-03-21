import React from "react";
import { Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function LikeButton({ post, user, onLikeChange }) {
  const qc = useQueryClient();
  const liked = user?.email ? (post.upvoted_by?.includes(user.email) ?? false) : false;
  const likeCount = post?.upvotes ?? 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const newLiked = !liked;
      const newUpvotedBy = newLiked
        ? [...(post.upvoted_by || []), user.email]
        : (post.upvoted_by || []).filter(e => e !== user.email);
      await base44.entities.CommunityPost.update(post.id, {
        upvoted_by: newUpvotedBy,
        upvotes: newLiked ? likeCount + 1 : Math.max(0, likeCount - 1),
      });
      return newLiked;
    },
    onMutate: async () => {
      // Optimistic update — cancel any in-flight refetches first
      await qc.cancelQueries({ queryKey: ["communityPosts"] });
      const snapshot = qc.getQueryData(["communityPosts"]);

      qc.setQueryData(["communityPosts"], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map(p => {
          if (p.id !== post.id) return p;
          const newLiked = !liked;
          const newUpvotedBy = newLiked
            ? [...(p.upvoted_by || []), user.email]
            : (p.upvoted_by || []).filter(e => e !== user.email);
          return { ...p, upvoted_by: newUpvotedBy, upvotes: newLiked ? likeCount + 1 : Math.max(0, likeCount - 1) };
        });
      });

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(["communityPosts"], ctx.snapshot);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
      onLikeChange?.();
    },
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (!user?.email || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending}
      aria-label={liked ? "Unlike post" : "Like post"}
      aria-pressed={liked}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
      style={{
        backgroundColor: liked ? "rgba(224, 92, 122, 0.1)" : "var(--bg-subtle)",
        color: liked ? "#E05C7A" : "var(--text-secondary)",
      }}
    >
      <Heart
        className={`w-4 h-4 transition-all ${liked ? "heart-bounce" : ""}`}
        fill={liked ? "#E05C7A" : "none"}
      />
      <span className="text-sm font-semibold">{likeCount}</span>
    </button>
  );
}