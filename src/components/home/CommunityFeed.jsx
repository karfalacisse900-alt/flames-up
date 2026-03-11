import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Globe, MapPin, PenSquare, Search, X } from "lucide-react";
import CommunityPostCard from "../community/CommunityPostCard";
import { useLocationDetection, haversineKm } from "../hooks/useLocationDetection";

const RADIUS_OPTIONS = [5, 20, 50];

const FILTER_TABS = [
  { id: "global",  label: "Global",  icon: "🌍" },
  { id: "nearby",  label: "Nearby",  icon: "📍" },
  { id: "country", label: "Country", icon: "🌎" },
  { id: "city",    label: "City",    icon: "🏙" },
];

export default function CommunityFeed({ user }) {
  const [activeFilter, setActiveFilter] = useState("global");
  const [nearbyRadius, setNearbyRadius] = useState(20);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const qc = useQueryClient();

  const { coords, locationInfo, detect } = useLocationDetection({ autoDetect: false });

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 200),
  });

  useEffect(() => {
    const unsubscribe = base44.entities.CommunityPost.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
    });
    return unsubscribe;
  }, [qc]);

  useEffect(() => {
    if (activeFilter === "nearby" && !coords) detect();
  }, [activeFilter]);

  const filteredPosts = useCallback(() => {
    let posts = [...allPosts];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return posts.filter((p) =>
        [p.location_country, p.location_city, p.location_region, p.location_name]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      );
    }

    if (activeFilter === "global") return posts;

    if (activeFilter === "nearby") {
      if (!coords) return [];
      return posts.filter((p) => {
        if (!p.location_lat || !p.location_lng) return false;
        return haversineKm(coords.lat, coords.lng, p.location_lat, p.location_lng) <= nearbyRadius;
      });
    }

    if (activeFilter === "country") {
      if (!selectedCountry) return posts;
      return posts.filter((p) => p.location_country?.toLowerCase() === selectedCountry.toLowerCase());
    }

    if (activeFilter === "city") {
      if (!selectedCity) return posts;
      return posts.filter((p) => p.location_city?.toLowerCase().includes(selectedCity.toLowerCase()));
    }

    return posts;
  }, [allPosts, activeFilter, coords, nearbyRadius, selectedCountry, selectedCity, searchQuery]);

  const uniqueCountries = [...new Set(allPosts.map((p) => p.location_country).filter(Boolean))].sort();
  const uniqueCities = [...new Set(allPosts.map((p) => p.location_city).filter(Boolean))].sort();
  const posts = filteredPosts();

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

  return (
    <div className="pb-8">
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-20 px-3 pt-3 pb-0" style={{ backgroundColor: "var(--bg-app)" }}>
        {/* Row 1: Filter tabs + Post + Search */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveFilter(tab.id); setSearchQuery(""); setShowSearch(false); }}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    border: isActive ? "none" : "1px solid var(--border-light)",
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.id === "nearby" && isActive && coords && (
                    <span className="ml-0.5 opacity-80">· {nearbyRadius}km</span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowSearch((s) => !s)}
            className="p-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: showSearch ? "var(--accent-primary)" : "var(--bg-card)", border: "1px solid var(--border-light)" }}
          >
            {showSearch
              ? <X className="w-3.5 h-3.5 text-white" />
              : <Search className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
            }
          </button>

          <Link
            to={createPageUrl("CreatePostFlow")}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <PenSquare className="w-3.5 h-3.5" />
            Post
          </Link>
        </div>

        {/* Row 2: Sub-controls */}
        {activeFilter === "nearby" && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {coords ? (
              <>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  📍 {locationInfo?.city || "Your location"} — radius:
                </span>
                <div className="flex gap-1">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setNearbyRadius(r)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: nearbyRadius === r ? "var(--accent-primary)" : "var(--bg-card)",
                        color: nearbyRadius === r ? "#fff" : "var(--text-secondary)",
                        border: nearbyRadius === r ? "none" : "1px solid var(--border-light)",
                      }}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                onClick={detect}
                className="text-xs font-semibold px-3 py-1.5 rounded-full text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                Enable Location
              </button>
            )}
          </div>
        )}

        {activeFilter === "country" && (
          <div className="mt-2">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            >
              <option value="">🌎 All Countries</option>
              {uniqueCountries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {activeFilter === "city" && (
          <div className="mt-2">
            <input
              type="text"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              placeholder="🏙 Type a city..."
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            {selectedCity && (
              <div className="mt-1 flex flex-wrap gap-1">
                {uniqueCities.filter((c) => c.toLowerCase().includes(selectedCity.toLowerCase())).slice(0, 6).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCity(c)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showSearch && (
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by country, city, place…"
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--accent-primary)", color: "var(--text-primary)" }}
            />
          </div>
        )}

        <div style={{ height: 1, backgroundColor: "var(--border-light)", marginTop: 10 }} />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
        </div>
      )}

      {/* Nearby: no GPS */}
      {!isLoading && activeFilter === "nearby" && !coords && (
        <div className="px-4 py-12 text-center">
          <p className="text-3xl mb-2">📍</p>
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Enable location to see nearby posts</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-hint)" }}>We only use your location to filter the feed</p>
          <button onClick={detect} className="px-5 py-2.5 rounded-full text-white font-semibold text-sm" style={{ backgroundColor: "var(--accent-primary)" }}>
            Allow Location
          </button>
        </div>
      )}

      {/* Posts */}
      {!isLoading && (activeFilter !== "nearby" || coords) && (
        <>
          {posts.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-3xl mb-2">🔍</p>
              <p style={{ color: "var(--text-hint)" }}>
                {searchQuery ? `No posts found for "${searchQuery}"` : activeFilter === "nearby" ? "No posts within this radius yet" : "No posts here yet. Be the first to share!"}
              </p>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <CommunityPostCard key={post.id} post={post} user={user} onUpvote={() => handleUpvote(post)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}