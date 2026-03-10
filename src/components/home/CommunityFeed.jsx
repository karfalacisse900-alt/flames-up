import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CommunityPostCard from "../community/CommunityPostCard";
import TipButton from "../community/TipButton";

export default function CommunityFeed({ user }) {
  const [posts, setPosts] = useState([]);
  const qc = useQueryClient();

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 100),
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = base44.entities.CommunityPost.subscribe((event) => {
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
    });
    return unsubscribe;
  }, [qc]);

  // Update posts when data changes
  useEffect(() => {
    setPosts(allPosts);
  }, [allPosts]);

  const handleUpvote = async (post) => {
    if (!user) return;
    const hasLiked = post.upvoted_by?.includes(user.email);
    const newUpvotedBy = hasLiked
      ? post.upvoted_by.filter((e) => e !== user.email)
      : [...(post.upvoted_by || []), user.email];

    await base44.entities.CommunityPost.update(post.id, {
      upvoted_by: newUpvotedBy,
      upvotes: newUpvotedBy.length,
    });
    qc.invalidateQueries({ queryKey: ["communityPosts"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-3xl mb-2">📝</p>
        <p style={{ color: "var(--text-hint)" }}>No posts yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {posts.map((post) => (
        <div key={post.id} className="relative">
          <CommunityPostCard
            post={post}
            user={user}
            onUpvote={() => handleUpvote(post)}
          />
          {/* Tip button overlay on posts */}
          {user && post.author_email !== user.email && (
            <div className="absolute top-4 right-4 z-10">
              <TipButton postAuthorEmail={post.author_email} postId={post.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}