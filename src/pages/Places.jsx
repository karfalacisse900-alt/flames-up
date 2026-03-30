import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/components/hooks/usePullToRefresh";
import { AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { MapPin, Bookmark, Map, List, Route } from "lucide-react";
import MapViewWrapper from "@/components/places/MapViewWrapper";
import ExploreAreaPanel from "@/components/discover/ExploreAreaPanel";
import PlaceHub from "@/components/community/PlaceHub";
import RealTrendingPlaces from "@/components/places/RealTrendingPlaces";
import CommunityEvents from "@/components/places/CommunityEvents";
import { createPageUrl } from "@/utils";

export default function PlacesPage() {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("feed"); // "feed" | "map" | "saved"
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [openNearbyOnLoad, setOpenNearbyOnLoad] = useState(false);
  const routeLocation = useLocation();
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // If navigated back from a nearby profile, switch to map and open nearby
  useEffect(() => {
    if (routeLocation.state?.openNearby) {
      setViewMode("map");
      setOpenNearbyOnLoad(true);
      // Clear state so refresh doesn't re-trigger
      window.history.replaceState({}, "");
    }
  }, [routeLocation.state]);

  const { data: savedPlaces = [] } = useQuery({
    queryKey: ["savedPlaces", user?.email],
    queryFn: () => base44.entities.SavedPlace.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const openPlace = (place) => setSelectedPlace(place);
  const closePlace = () => setSelectedPlace(null);

  const { containerProps, PullIndicator } = usePullToRefresh(async () => {
    await qc.invalidateQueries({ queryKey: ["realPlaces"] });
  });

  return (
    <div {...containerProps} className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <PullIndicator />
      {/* Header */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: "var(--bg-nav)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="relative overflow-hidden px-4 pt-4 pb-3">
          {/* Organic blobs */}
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #2E6B4F, #4CAF7D)" }} />
          <div className="absolute top-2 right-16 w-8 h-8 rounded-full opacity-15 pointer-events-none" style={{ background: "#D98B62" }} />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                <MapPin className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)", letterSpacing: "-0.3px" }}>Places</h1>
                <p className="text-[11px] font-semibold" style={{ color: "var(--text-hint)" }}>Explore your world ✦</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Trip Planner Button */}
              <Link
                to={createPageUrl("TripPlanner")}
                aria-label="Trip Planner"
                className="rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ minWidth: 44, minHeight: 44, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
                <Route className="w-4 h-4 text-white" />
              </Link>

              {/* View toggle */}
              <div className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                {[
                  { key: "feed", icon: List },
                  { key: "map", icon: Map },
                  { key: "saved", icon: Bookmark },
                ].map(({ key, icon: Icon }) => (
                  <button key={key} onClick={() => setViewMode(key)}
                    aria-label={key}
                    className="rounded-xl flex items-center justify-center transition-all"
                    style={{
                      minWidth: 40, minHeight: 40,
                      backgroundColor: viewMode === key ? "#1E1E1E" : "transparent",
                      color: viewMode === key ? "#fff" : "var(--text-hint)",
                      boxShadow: viewMode === key ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                    }}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MAP VIEW — full screen with its own place detail handling */}
      <AnimatePresence mode="wait">
      {viewMode === "map" && (
        <MapViewWrapper onOpenPlace={() => {}} user={user} onBack={() => setViewMode("feed")} openNearby={openNearbyOnLoad} />
      )}
      </AnimatePresence>

      {/* SAVED PLACES VIEW */}
      {viewMode === "saved" && (
        <div className="px-4 py-4">
          {!user ? (
            <div className="py-16 text-center">
              <Bookmark className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>Sign in to see saved places</p>
            </div>
          ) : savedPlaces.length === 0 ? (
            <div className="py-16 text-center">
              <Bookmark className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
              <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No saved places yet</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Tap "Want to go" on posts to save places</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
                {savedPlaces.length} saved place{savedPlaces.length !== 1 ? "s" : ""}
              </p>
              {savedPlaces.map(place => (
                <button key={place.id}
                  onClick={() => openPlace({ name: place.location_name, city: place.location_city, region: place.location_region, country: place.location_country, lat: place.location_lat, lng: place.location_lng })}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.99]"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--accent-primary-light)" }}>
                    <MapPin className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                      {place.location_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>
                      {[place.location_city, place.location_region, place.location_country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0 ml-auto"
                    style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                    {place.save_type === "want_to_go" ? "Want to go" : "Saved"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FEED VIEW */}
      {viewMode === "feed" && (
        <div className="pb-28">
          <RealTrendingPlaces onSelectPlace={place => openPlace(place)} />
          <CommunityEvents />
          <ExploreAreaPanel inline />
        </div>
      )}

      {selectedPlace && (
        <PlaceHub
          locationName={selectedPlace.name || selectedPlace.city}
          locationData={selectedPlace}
          user={user}
          onClose={closePlace}
          onUpvote={() => {}}
        />
      )}
    </div>
  );
}