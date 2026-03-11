import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Globe, MapPin, PenSquare } from "lucide-react";
import CommunityPostCard from "../community/CommunityPostCard";

const LOCATION_TABS = [
  { id: "global", label: "Global", icon: Globe },
  { id: "nearby", label: "Nearby", icon: MapPin },
];

export default function CommunityFeed({ user }) {
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("global");
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

  // Filter posts based on active tab
  useEffect(() => {
    if (activeTab === "nearby" && user?.location_city) {
      setPosts(allPosts.filter(p => p.location_city === user.location_city));
    } else {
      setPosts(allPosts);
    }
  }, [allPosts, activeTab, user]);

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

  return (
    <div className="pb-8">
      {/* Sticky bar */}
      <div className="sticky top-0 z-20 px-4 pt-3 pb-0" style={{ backgroundColor: "var(--bg-app)" }}>
        {/* Toggle + Post button */}
        <div className="flex items-center gap-3">
          {/* Segmented Global / Nearby toggle */}
          <div
            className="flex flex-1 rounded-full p-0.5"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
          >
            {LOCATION_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: isActive ? "var(--accent-primary)" : "transparent",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Create Post */}
          <Link
            to={createPageUrl("CreatePostFlow")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white transition-all active:scale-95 flex-shrink-0"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <PenSquare className="w-3.5 h-3.5" />
            Post
          </Link>
        </div>

        {/* Underline divider */}
        <div style={{ height: 1, backgroundColor: "var(--border-light)", marginTop: 12 }} />
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-3xl mb-2">📝</p>
          <p style={{ color: "var(--text-hint)" }}>
            No posts found. Be the first to share!
          </p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <div key={post.id} className="relative">
              <CommunityPostCard
                post={post}
                user={user}
                onUpvote={() => handleUpvote(post)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}