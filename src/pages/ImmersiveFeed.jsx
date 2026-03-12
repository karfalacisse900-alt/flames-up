import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import PostViewer from "@/components/community/PostViewer";
import { rankFeedForUser } from "@/components/community/feedRanking";

const POPULAR_CITIES = ["New York", "London", "Paris", "Tokyo", "Los Angeles", "Sydney", "Toronto", "Dubai", "Berlin", "Mumbai", "São Paulo", "Seoul", "Amsterdam", "Barcelona", "Singapore"];

export default function ImmersiveFeed() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const initialFilter = urlParams.get("filter") || "global";

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [userCoords, setUserCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setAuthChecked(true));
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["immersiveCommunityPosts"],
    queryFn: async () => {
      const all = await base44.entities.CommunityPost.list("-created_date", 100);
      return all.filter((p) => !p.group_id);
    },
  });

  const { data: debates = [] } = useQuery({
    queryKey: ["communityDebates"],
    queryFn: () => base44.entities.CommunityDebate.list("-created_date", 50),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["myFollows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user?.email,
  });

  const followedEmails = useMemo(() => follows.map((f) => f.following_email), [follows]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => setLocationLoading(false)
    );
  };

  useEffect(() => {
    if (activeFilter === "nearby" && !userCoords && !locationLoading) detectLocation();
  }, [activeFilter, userCoords, locationLoading]);

  const uniqueCities = useMemo(() => {
    return [...new Set(posts.map((p) => p.location_city).filter(Boolean))].sort();
  }, [posts]);

  const orderedPosts = useMemo(() => {
    const list = posts.filter((p) => p.type !== "review");
    return user?.email
      ? rankFeedForUser(list, user.email, debates, followedEmails)
      : [...list].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [posts, user?.email, debates, followedEmails]);

  const filteredPosts = useMemo(() => {
    let base = [...orderedPosts];

    if (activeFilter === "nearby") {
      if (!userCoords) return [];
      base = base.filter((p) => {
        if (!p.location_lat || !p.location_lng) return false;
        const dLat = (p.location_lat - userCoords.lat) * (Math.PI / 180);
        const dLng = (p.location_lng - userCoords.lng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(userCoords.lat * Math.PI / 180) * Math.cos(p.location_lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return km <= 50;
      });
    } else if (activeFilter !== "global") {
      base = base.filter((p) => p.location_city?.toLowerCase() === activeFilter.toLowerCase());
    }

    return base;
  }, [orderedPosts, activeFilter, userCoords]);

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#000" }}>
        <Loader2 className="w-7 h-7 animate-spin text-white" />
      </div>
    );
  }

  if (activeFilter === "nearby" && locationLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ backgroundColor: "#000", color: "white" }}>
        <Loader2 className="w-7 h-7 animate-spin" />
        <p className="text-sm text-white/70">Finding your location…</p>
      </div>
    );
  }

  if (activeFilter === "nearby" && !userCoords) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: "#000", color: "white" }}>
        <MapPin className="w-10 h-10 text-white/80" />
        <div>
          <p className="text-lg font-bold">Location access needed</p>
          <p className="text-sm text-white/70 mt-1">Allow location to view nearby posts in immersive mode</p>
        </div>
        <button
          onClick={detectLocation}
          className="px-5 py-3 rounded-2xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}
        >
          Enable Location
        </button>
        <button
          onClick={() => navigate(createPageUrl("Home"))}
          className="text-sm text-white/70 underline"
        >
          Back to feed
        </button>
      </div>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: "#000", color: "white" }}>
        <p className="text-lg font-bold">No posts found here yet</p>
        <p className="text-sm text-white/70">Try another filter or go back to the community feed.</p>
        <button
          onClick={() => navigate(createPageUrl("Home"))}
          className="px-5 py-3 rounded-2xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}
        >
          Back to feed
        </button>
      </div>
    );
  }

  return (
    <PostViewer
      posts={filteredPosts}
      initialIndex={0}
      user={user}
      onClose={() => navigate(createPageUrl("Home"))}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      allCities={[...new Set([...uniqueCities, ...POPULAR_CITIES])].sort()}
    />
  );
}