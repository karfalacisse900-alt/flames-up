import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin, Loader2, ArrowLeft, Navigation, Clock } from "lucide-react";
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
  { label: "1 km",   value: 1 },
  { label: "5 km",   value: 5 },
  { label: "15 km",  value: 15 },
  { label: "50 km",  value: 50 },
];

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeUntil(expiresAt) {
  const now = new Date();
  const exp = new Date(expiresAt);
  const minLeft = Math.floor((exp - now) / 1000 / 60);
  if (minLeft < 1) return "Ending soon";
  if (minLeft < 60) return `${minLeft}m left`;
  const hrsLeft = Math.floor(minLeft / 60);
  return `${hrsLeft}h left`;
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
  const [sortBy, setSortBy] = useState("distance"); // "distance" or "newest"

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    requestLocation();
  }, []);

  const requestLocation = () => {
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
    refetchInterval: 20000,
  });

  const filtered = useMemo(() => {
    let list = activities;

    if (activeCategory !== "all") {
      list = list.filter(a => a.category === activeCategory);
    }

    if (coords) {
      list = list
        .map(a => {
          if (!a.location_lat || !a.location_lng) return { ...a, distance: 9999 };
          return { ...a, distance: distanceKm(coords.lat, coords.lng, a.location_lat, a.location_lng) };
        })
        .filter(a => a.distance <= radius)
        .sort((a, b) => sortBy === "distance" ? a.distance - b.distance : new Date(b.created_date) - new Date(a.created_date));
    }

    return list;
  }, [activities, activeCategory, coords, radius, sortBy]);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Advanced Header */}
      <div className="sticky top-0 z-30 border-b" style={{ backgroundColor: "var(--bg-app)", borderColor: "var(--border-light)" }}>
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-3">
          {/* Top Bar */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: "#f43f5e" }} />
                <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Live Nearby</h1>
              </div>
              {coords && <p className="text-xs" style={{ color: "var(--text-hint)" }}>Real-time activities around you</p>}
            </div>
            {user && (
              <button onClick={() => setShowComposer(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}>
                <Plus className="w-4 h-4" /> Post
              </button>
            )}
          </div>

          {/* Location & Filter Row */}
          <div className="flex gap-2 mb-3">
            <button onClick={requestLocation} disabled={locationLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: coords ? "rgba(20, 184, 166, 0.1)" : "rgba(244, 63, 94, 0.1)", color: coords ? "var(--accent-secondary)" : "#f43f5e", border: "1px solid" + (coords ? "rgba(20, 184, 166, 0.3)" : "rgba(244, 63, 94, 0.3)") }}>
              <Navigation className="w-3.5 h-3.5" /> {coords ? "Located" : "Enable Location"}
            </button>

            {coords && (
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="px-3 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}>
                {RADIUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            )}

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}>
              <option value="distance">Closest</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Category Filter Scrollable */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.value;
              return (
                <button key={cat.value} onClick={() => setActiveCategory(cat.value)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: isActive ? "#f43f5e" : "var(--bg-card)", color: isActive ? "#fff" : "var(--text-secondary)", border: `1.5px solid ${isActive ? "#f43f5e" : "var(--border-light)"}` }}>
                  {cat.emoji} {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Location Request Banner */}
      {!coords && !locationLoading && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <MapPin className="w-5 h-5 shrink-0" style={{ color: "#f43f5e" }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Enable location to discover nearby activities</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Find events, food spots, meetups & more around you</p>
            </div>
            <button onClick={requestLocation} className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: "#f43f5e" }}>
              Enable
            </button>
          </div>
        </div>
      )}

      {/* Activities Feed */}
      <div className="max-w-4xl mx-auto px-4 py-5">
        {isLoading || locationLoading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl p-4 h-32 skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              No activities nearby
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-hint)" }}>
              {!coords ? "Enable location to discover nearby activities" : "Be the first to post something!"}
            </p>
            {user && (
              <button onClick={() => setShowComposer(true)} className="px-6 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}>
                Post an Activity
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>
                {filtered.length} active {filtered.length === 1 ? "activity" : "activities"}
              </p>
              {coords && (
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  within {radius} km
                </p>
              )}
            </div>
            {filtered.map(activity => (
              <div key={activity.id} className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <LiveActivityCard activity={activity} user={user} onUpdate={() => qc.invalidateQueries({ queryKey: ["liveActivities"] })} />
                
                {/* Distance + Time Overlay */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                  {activity.distance !== undefined && activity.distance < 9999 && (
                    <div className="px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                      {activity.distance < 1 ? `${Math.round(activity.distance * 1000)}m` : `${activity.distance.toFixed(1)} km`}
                    </div>
                  )}
                  <div className="px-2.5 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1" style={{ backgroundColor: "rgba(244, 63, 94, 0.8)" }}>
                    <Clock className="w-3 h-3" /> {timeUntil(activity.expires_at)}
                  </div>
                </div>
              </div>
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