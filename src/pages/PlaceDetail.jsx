import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, ArrowLeft, Users, Image, Heart, Plus } from "lucide-react";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import { createPageUrl } from "@/utils";

export default function PlaceDetail() {
  const [searchParams] = useSearchParams();
  const placeId = searchParams.get("placeId");
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: place, isLoading: placeLoading } = useQuery({
    queryKey: ["place", placeId],
    queryFn: async () => {
      const places = await base44.entities.Place.filter({ id: placeId });
      return places[0] || null;
    },
    enabled: !!placeId,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["placePosts", placeId],
    queryFn: async () => {
      if (!place) return [];
      // Find posts that match this place's coordinates (within ~100m radius)
      const allPosts = await base44.entities.CommunityPost.list("-created_date", 200);
      return allPosts.filter(p => {
        if (!p.location_lat || !p.location_lng) return false;
        const dLat = (p.location_lat - place.lat) * (Math.PI / 180);
        const dLng = (p.location_lng - place.lng) * (Math.PI / 180);
        const a = Math.sin(dLat/2)**2 + Math.cos(place.lat * Math.PI/180) * Math.cos(p.location_lat * Math.PI/180) * Math.sin(dLng/2)**2;
        const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return km <= 0.1; // 100m radius
      });
    },
    enabled: !!place,
  });

  const { data: isFollowing, refetch: refetchFollow } = useQuery({
    queryKey: ["placeFollow", placeId, user?.email],
    queryFn: async () => {
      if (!user) return false;
      const follows = await base44.entities.LocationFollow.filter({ user_email: user.email, place_id: placeId });
      return follows.length > 0;
    },
    enabled: !!user && !!placeId,
  });

  const handleFollow = async () => {
    if (!user) return;
    if (isFollowing) {
      const follows = await base44.entities.LocationFollow.filter({ user_email: user.email, place_id: placeId });
      if (follows[0]) await base44.entities.LocationFollow.delete(follows[0].id);
      await base44.entities.Place.update(placeId, { follower_count: Math.max(0, (place.follower_count || 0) - 1) });
    } else {
      await base44.entities.LocationFollow.create({ user_email: user.email, place_id: placeId, place_name: place.name });
      await base44.entities.Place.update(placeId, { follower_count: (place.follower_count || 0) + 1 });
    }
    refetchFollow();
    qc.invalidateQueries({ queryKey: ["place", placeId] });
  };

  if (placeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: "var(--bg-app)" }}>
        <p className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Place not found</p>
        <Link to={createPageUrl("Places")} className="text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
          ← Back to Places
        </Link>
      </div>
    );
  }

  const categoryEmoji = {
    park: "🌳",
    library: "📚",
    cafe: "☕",
    campus: "🏫",
    landmark: "🏛️",
    museum: "🖼️",
    restaurant: "🍽️",
    gym: "💪",
    mall: "🛍️",
    other: "📍",
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <Link to={createPageUrl("Places")} className="p-2 rounded-full" style={{ color: "var(--text-primary)" }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {place.name}
          </h1>
        </div>
      </div>

      {/* Cover Image */}
      {place.cover_image_url && (
        <div className="w-full" style={{ aspectRatio: "16/9", position: "relative" }}>
          <img src={place.cover_image_url} alt={place.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Place Info */}
      <div className="px-4 py-4" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{categoryEmoji[place.category] || "📍"}</span>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {place.name}
              </h2>
              {place.is_verified && (
                <span className="text-blue-500 text-lg">✓</span>
              )}
            </div>
            {place.description && (
              <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>{place.description}</p>
            )}
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-hint)" }}>
              <MapPin className="w-3.5 h-3.5" />
              <span>{[place.city, place.region].filter(Boolean).join(", ")}</span>
            </div>
          </div>
          {user && (
            <button onClick={handleFollow}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                backgroundColor: isFollowing ? "transparent" : "var(--accent-primary)",
                color: isFollowing ? "var(--text-secondary)" : "#fff",
                border: `1.5px solid ${isFollowing ? "var(--border-medium)" : "var(--accent-primary)"}`,
              }}>
              {isFollowing ? "Following" : "+ Follow"}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-1.5">
            <Image className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{posts.length}</span>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>posts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{place.follower_count || 0}</span>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>followers</span>
          </div>
        </div>
      </div>

      {/* Map Preview */}
      <div className="px-4 py-3">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border-light)" }}>
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+2E6B4F(${place.lng},${place.lat})/${place.lng},${place.lat},14,0/600x200@2x?access_token=pk.eyJ1IjoiYmFzZTQ0IiwiYSI6ImNtNGRsMjRuYTA1ODQya3Nka3N6NGlmNTEifQ.HaTS2lHGmert81nrvmN-wQ`}
            alt="Map"
            className="w-full"
            style={{ aspectRatio: "3/1" }}
          />
        </a>
      </div>

      {/* Posts Feed */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            Posts from {place.name}
          </h3>
          <Link
            to={createPageUrl("CreatePostFlow")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", color: "#fff" }}>
            <Plus className="w-3 h-3" /> Post Here
          </Link>
        </div>

        {postsLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              No posts yet
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>
              Be the first to share from {place.name}
            </p>
            <Link
              to={createPageUrl("CreatePostFlow")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", color: "#fff" }}>
              <Plus className="w-3 h-3" /> Create Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <CommunityPostCard
                key={post.id}
                post={post}
                user={user}
                onUpvote={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}