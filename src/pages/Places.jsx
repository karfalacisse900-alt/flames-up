import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, Bookmark, Map, List, TrendingUp, Search, X, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import PlaceHub from "@/components/community/PlaceHub";
import TrendingPlaces from "@/components/community/TrendingPlaces";
import PlaceCategoryFilter from "@/components/community/PlaceCategoryFilter";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import { requireVerified } from "@/components/auth/EmailVerificationGate";

export default function PlacesPage() {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("feed"); // "feed" | "map" | "saved"
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlace, setSelectedPlace] = useState(null); // { name, city, ... }
  const [searchQuery, setSearchQuery] = useState("");
  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["placeFeedPosts"],
    queryFn: async () => {
      const all = await base44.entities.CommunityPost.list("-created_date", 200);
      // Only show posts with a location
      return all.filter(p => !p.group_id && (p.location_name || p.location_city));
    },
    staleTime: 30000,
  });

  const { data: savedPlaces = [] } = useQuery({
    queryKey: ["savedPlaces", user?.email],
    queryFn: () => base44.entities.SavedPlace.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const upvoteMut = useMutation({
    mutationFn: ({ post }) => {
      if (!user) return;
      const hasLiked = post.upvoted_by?.includes(user.email);
      return base44.entities.CommunityPost.update(post.id, {
        upvotes: hasLiked ? Math.max(0, (post.upvotes || 0) - 1) : (post.upvotes || 0) + 1,
        upvoted_by: hasLiked
          ? (post.upvoted_by || []).filter(e => e !== user.email)
          : [...(post.upvoted_by || []), user.email],
      });
    },
    onMutate: ({ post }) => {
      const hasLiked = post.upvoted_by?.includes(user?.email);
      qc.setQueryData(["placeFeedPosts"], old =>
        (old || []).map(p => p.id !== post.id ? p : {
          ...p,
          upvotes: hasLiked ? Math.max(0, (p.upvotes || 0) - 1) : (p.upvotes || 0) + 1,
          upvoted_by: hasLiked
            ? (p.upvoted_by || []).filter(e => e !== user.email)
            : [...(p.upvoted_by || []), user.email],
        })
      );
    },
  });

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (selectedCategory !== "all") {
      list = list.filter(p => p.place_tags?.includes(selectedCategory));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.location_name || "").toLowerCase().includes(q) ||
        (p.location_city || "").toLowerCase().includes(q) ||
        (p.body || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, selectedCategory, searchQuery]);

  // Map markers — aggregate by location
  const mapMarkers = useMemo(() => {
    const seen = new Set();
    return filteredPosts.filter(p => p.location_lat && p.location_lng).filter(p => {
      const key = `${p.location_lat?.toFixed(3)},${p.location_lng?.toFixed(3)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredPosts]);

  const openPlace = (place) => setSelectedPlace(place);
  const closePlace = () => setSelectedPlace(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: "rgba(242,237,228,0.96)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
              <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                Places
              </h1>
            </div>
            {/* View toggle */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
              {[
                { key: "feed", icon: List },
                { key: "map", icon: Map },
                { key: "saved", icon: Bookmark },
              ].map(({ key, icon: Icon }) => (
                <button key={key} onClick={() => setViewMode(key)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: viewMode === key ? "var(--bg-card)" : "transparent",
                    color: viewMode === key ? "var(--accent-primary)" : "var(--text-hint)",
                    boxShadow: viewMode === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search places, cities…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--text-primary)" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        {viewMode === "feed" && (
          <PlaceCategoryFilter active={selectedCategory} onChange={setSelectedCategory} />
        )}
      </div>

      {/* MAP VIEW */}
      {viewMode === "map" && (
        <div style={{ height: "calc(100vh - 140px)" }}>
          {mapMarkers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Map className="w-10 h-10" style={{ color: "var(--text-hint)" }} />
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>No location posts yet</p>
            </div>
          ) : (
            <MapContainer
              center={[mapMarkers[0].location_lat, mapMarkers[0].location_lng]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mapMarkers.map(p => (
                <Marker key={p.id} position={[p.location_lat, p.location_lng]}>
                  <Popup>
                    <div className="text-sm">
                      <strong>{p.location_name || p.location_city}</strong>
                      <br />
                      <span style={{ color: "#666" }}>{(p.body || "").replace(/<[^>]*>/g, "").slice(0, 80)}…</span>
                      <br />
                      <button
                        onClick={() => openPlace({ name: p.location_name || p.location_city, city: p.location_city, region: p.location_region, lat: p.location_lat, lng: p.location_lng })}
                        style={{ color: "#2E6B4F", fontWeight: 600, marginTop: 4 }}>
                        View place →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      )}

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
        <div>
          {/* Trending places strip */}
          <TrendingPlaces onSelectPlace={place => openPlace({ name: place.name, city: place.city, region: place.region, lat: place.lat, lng: place.lng })} />

          {/* Divider */}
          <div className="mx-4 mb-2" style={{ height: 1, backgroundColor: "var(--border-subtle)" }} />

          {isLoading ? (
            <div className="flex flex-col gap-4 px-4 py-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                  <div className="skeleton h-48" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-3/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-16 text-center px-8">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {selectedCategory !== "all" ? `No ${selectedCategory} posts yet` : "No location posts yet"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                Posts tagged with a location will appear here
              </p>
            </div>
          ) : (
            <div className="pb-28">
              {filteredPosts.map(post => (
                <CommunityPostCard key={post.id} post={post} user={user}
                  onUpvote={() => user && upvoteMut.mutate({ post })}
                  onLocationClick={(locationData) => openPlace(locationData)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Place Hub Modal */}
      {selectedPlace && (
        <PlaceHub
          locationName={selectedPlace.name || selectedPlace.city}
          locationData={selectedPlace}
          user={user}
          onClose={closePlace}
          onUpvote={(post) => upvoteMut.mutate({ post })}
        />
      )}
    </div>
  );
}