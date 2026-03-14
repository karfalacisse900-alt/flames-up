import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LikeButton({ post, user, onLikeChange }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (post && user?.email) {
      setLiked(post.upvoted_by?.includes(user.email) || false);
    }
    setLikeCount(post?.upvotes || 0);
  }, [post, user]);

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (!user?.email || processing) return;
    
    setProcessing(true);
    const wasLiked = liked;
    const newLiked = !wasLiked;
    
    // Optimistic update
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const updatedUpvotedBy = wasLiked
        ? (post.upvoted_by || []).filter(email => email !== user.email)
        : [...(post.upvoted_by || []), user.email];

      await base44.entities.CommunityPost.update(post.id, {
        upvoted_by: updatedUpvotedBy,
        upvotes: newLiked ? (post.upvotes || 0) + 1 : Math.max(0, (post.upvotes || 0) - 1),
      });

      // Sync to Supabase likes table
      const SUPABASE_URL = "https://ljyxfbymvbtflvdwipxg.supabase.co";
      const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeXhmYnltdmJ0Zmx2ZHdpcHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDUzNDQ0NCwiZXhwIjoyMDUwMTEwNDQ0fQ.fIYLuEuPMGUvj_U5N0bj8fMHFWTqHK-wbMQXDxdwZ20";

      if (newLiked) {
        // Create like record
        await fetch(`${SUPABASE_URL}/rest/v1/likes`, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            id: `${post.id}_${user.email}`,
            post_id: post.id,
            user_id: user.email,
          }),
        });
      } else {
        // Delete like record
        await fetch(`${SUPABASE_URL}/rest/v1/likes?id=eq.${post.id}_${user.email}`, {
          method: "DELETE",
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        });
      }

      onLikeChange?.();
    } catch (err) {
      console.error("Like toggle failed:", err);
      // Revert on error
      setLiked(wasLiked);
      setLikeCount(post?.upvotes || 0);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={processing}
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