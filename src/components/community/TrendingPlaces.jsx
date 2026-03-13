import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, TrendingUp, Flame } from "lucide-react";

export default function TrendingPlaces({ onSelectPlace }) {
  // Fetch real places from database
  const { data: realPlaces = [] } = useQuery({
    queryKey: ["realPlaces"],
    queryFn: () => base44.entities.Place.list("-follower_count", 50),
    staleTime: 10 * 60 * 1000,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["communityPostsForTrending"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 200),
    staleTime: 5 * 60 * 1000,
  });

  // Aggregate by location_name or location_city from posts
  const placeMap = {};
  for (const p of posts) {
    const name = p.location_name || p.location_city;
    if (!name) continue;
    if (!placeMap[name]) {
      placeMap[name] = {
        name,
        city: p.location_city || "",
        region: p.location_region || "",
        country: p.location_country || "",
        lat: p.location_lat,
        lng: p.location_lng,
        postCount: 0,
        likeCount: 0,
        hasMedia: false,
        coverImage: null,
      };
    }
    placeMap[name].postCount++;
    placeMap[name].likeCount += (p.upvotes || 0);
    if (!placeMap[name].coverImage && (p.image_url || p.image_urls?.[0])) {
      placeMap[name].coverImage = p.image_urls?.[0] || p.image_url;
      placeMap[name].hasMedia = true;
    }
  }

  // Convert real places to trending format
  const realPlacesFormatted = realPlaces.map(p => ({
    name: p.name,
    city: p.city || "",
    region: p.region || "",
    country: p.country || "",
    lat: p.lat,
    lng: p.lng,
    postCount: p.post_count || 0,
    likeCount: p.follower_count || 0,
    coverImage: p.cover_image_url,
    hasMedia: !!p.cover_image_url,
    description: p.description,
    isRealPlace: true,
  }));

  // Merge real places with trending posts, prioritize real places
  const allPlaces = [...realPlacesFormatted, ...Object.values(placeMap)];
  const uniquePlaces = [];
  const seen = new Set();
  
  for (const place of allPlaces) {
    if (!seen.has(place.name)) {
      seen.add(place.name);
      uniquePlaces.push(place);
    }
  }

  const trending = uniquePlaces
    .sort((a, b) => {
      // Prioritize real verified places
      if (a.isRealPlace && !b.isRealPlace) return -1;
      if (!a.isRealPlace && b.isRealPlace) return 1;
      return (b.postCount * 3 + b.likeCount) - (a.postCount * 3 + a.likeCount);
    })
    .slice(0, 12);

  if (trending.length === 0) return null;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4" style={{ color: "#E05C2A" }} />
        <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          Trending Places
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {trending.map(place => (
          <button key={place.name} onClick={() => onSelectPlace(place)}
            className="shrink-0 rounded-2xl overflow-hidden text-left transition-all active:scale-95"
            style={{ width: 120, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <div className="relative" style={{ height: 80 }}>
              {place.coverImage ? (
                <img src={place.coverImage} alt={place.name}
                  className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, var(--accent-primary-light), var(--bg-subtle))" }}>
                  <MapPin className="w-6 h-6" style={{ color: "var(--accent-primary)" }} />
                </div>
              )}
              <div className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
                {place.postCount} posts
              </div>
            </div>
            <div className="px-2.5 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <p className="text-xs font-bold truncate flex-1" style={{ color: "var(--text-primary)" }}>{place.name}</p>
                {place.isRealPlace && (
                  <span className="text-blue-500 text-[10px]">✓</span>
                )}
              </div>
              {place.city && place.city !== place.name && (
                <p className="text-[10px] truncate" style={{ color: "var(--text-hint)" }}>{place.city}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}