import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin, Loader2, SlidersHorizontal, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LiveActivityCard from "@/components/community/LiveActivityCard";
import CreateLiveActivityModal from "@/components/community/CreateLiveActivityModal";

const CATEGORIES = [
  { value: "all",    label: "All",    emoji: "✨" },
  { value: "food",   label: "Food",   emoji: "🍕" },
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "music",  label: "Music",  emoji: "🎵" },
  { value: "market", label: "Market", emoji: "🛍️" },
  { value: "study",  label: "Study",  emoji: "📚" },
  { value: "social", label: "Social", emoji: "🎉" },
  { value: "other",  label: "Other",  emoji: "📍" },
];

const RADIUS_OPTIONS = [
  { label: "5 km",  value: 5 },
  { label: "15 km", value: 15 },
  { label: "50 km", value: 50 },
  { label: "Any",   value: 9999 },
];

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LiveNearby() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [coords, setCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [radius, setRadius] = useState(15);
  const [showComposer, setShowComposer] = useState(false);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => setLocationLoading(false)
    );
  };

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["liveActivities"],
    queryFn: async () => {
      const all = await base44.entities.LiveActivity.list("-created_date", 200);
      const now = new Date();
      return all.filter(a => new Date(a.expires_at) > now);
    },
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    let list = activities;

    // Category filter
    if (activeCategory !== "all") {
      list = list.filter(a => a.category === activeCategory);
    }

    // Geo filter
    if (coords) {
      list = list
        .map(a => {
          if (!a.location_lat || !a.location_lng) return { ...a, distance: 9999 };
          return { ...a, distance: distanceKm(coords.lat, coords.lng, a.location_lat, a.location_lng) };
        })
        .filter(a => a.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
    }

    return list;
  }, [activities, activeCategory, coords, radius]);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-30 border-b"
        style={{ backgroundColor: "var(--bg-app)", borderColor: "var(--border-light)" }}
      >
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#f43f5e" }} />
                <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  Live Nearby
                </h1>
              </div>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Real-time activities around you</p>
            </div>

            {/* Radius picker */}
            <div className="relative">
              <button
                onClick={() => setShowRadiusPicker(p => !p)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}
              >
                <MapPin className="w-3.5 h-3.5" style={{ color: "#f43f5e" }} />
                {radius === 9999 ? "Any" : `${radius} km`}
              </button>
              {showRadiusPicker && (
                <div
                  className="absolute right-0 top-10 rounded-2xl overflow-hidden z-20 w-32"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                >
                  {RADIUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setRadius(opt.value); setShowRadiusPicker(false); }}
                      className="w-full px-4 py-2.5 text-sm text-left font-semibold"
                      style={{
                        backgroundColor: radius === opt.value ? "rgba(244,63,94,0.1)" : "transparent",
                        color: radius === opt.value ? "#f43f5e" : "var(--text-primary)",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user && (
              <button
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)", boxShadow: "0 4px 12px rgba(244,63,94,0.3)" }}
              >
                <Plus className="w-4 h-4" /> Post
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: isActive ? "#f43f5e" : "var(--bg-card)",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    border: `1.5px solid ${isActive ? "#f43f5e" : "var(--border-light)"}`,
                    boxShadow: isActive ? "0 2px 8px rgba(244,63,94,0.3)" : "none",
                  }}
                >
                  {cat.emoji} {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Location banner */}
      {!coords && !locationLoading && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ backgroundColor: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}
          >
            <MapPin className="w-5 h-5 shrink-0" style={{ color: "#f43f5e" }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Enable location for better results</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>See activities closest to you first</p>
            </div>
            <button
              onClick={detectLocation}
              className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
              style={{ backgroundColor: "#f43f5e" }}
            >
              Enable
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {isLoading || locationLoading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl p-4 h-32 skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              Nothing happening yet
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-hint)" }}>
              Be the first to share a local activity!
            </p>
            {user && (
              <button
                onClick={() => setShowComposer(true)}
                className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}
              >
                Post an Activity
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>
              {filtered.length} active {filtered.length === 1 ? "activity" : "activities"} nearby
            </p>
            {filtered.map(activity => (
              <LiveActivityCard
                key={activity.id}
                activity={activity}
                user={user}
                onUpdate={() => qc.invalidateQueries({ queryKey: ["liveActivities"] })}
              />
            ))}
          </div>
        )}
      </div>

      {showComposer && user && (
        <CreateLiveActivityModal user={user} onClose={() => setShowComposer(false)} />
      )}
    </div>
  );
}