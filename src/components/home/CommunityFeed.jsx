import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Globe, MapPin, PenSquare, Radio } from "lucide-react";
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
      {/* Filter + Action bar */}
      <div className="sticky top-16 z-20 px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-app)" }}>
        {/* Location Filter Dropdown */}
        <LocationFilter 
          onFilterChange={setFilterData}
          userCity={user?.location_city}
          userCountry={user?.location_country}
        />

        {/* Create Post button */}
        <Link
          to={createPageUrl("CreatePostFlow")}
          className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          <PenTool className="w-4 h-4" />
          Post
        </Link>

        {/* Go Live button */}
        <Link
          to={createPageUrl("GoLive")}
          className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all text-white"
          style={{ backgroundColor: "#E05C7A" }}>
          <Zap className="w-4 h-4" />
          Live
        </Link>
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