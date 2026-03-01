import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Star, TrendingUp, Bookmark, ExternalLink, Heart, Send, Navigation, Clock, Footprints, Car, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

// ── Seeded data helpers ──────────────────────────────────
function seededRandom(seed) {
  let x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
function seededInt(seed, min, max) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}
function getPlaceSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
  return Math.abs(hash);
}

const PHOTO_POOL = [
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  "https://images.unsplash.com/photo-1519864658586-33c96e9d7e2e?w=400&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
  "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&q=80",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
  "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&q=80",
  "https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=400&q=80",
];
const SAMPLE_REVIEWS = [
  "Absolutely love this spot! Great vibes and super friendly staff.",
  "Hidden gem — perfect for a date night or solo afternoon.",
  "Gets busy on weekends, but totally worth it. One of the best.",
  "The atmosphere is unmatched. Real local charm here.",
  "Been coming for years. Never disappoints.",
  "Cozy and welcoming. Great for people-watching.",
];
const SAMPLE_NAMES = ["Alex M.", "Jordan K.", "Taylor R.", "Sam W.", "Riley B.", "Casey L.", "Morgan T.", "Drew P."];
const COMMUNITY_POSTS = [
  "Anyone else obsessed with this spot? 😍",
  "Perfect for a lazy afternoon ☕",
  "Took my friends here last Saturday — 10/10 recommend",
  "The energy here is amazing, love it!",
  "Seriously underrated. More people need to know this place.",
  "First time here and already planning my next visit 🙌",
];

const TABS = ["overview", "photos", "reviews", "discuss", "navigate"];

// ── Route info via Mapbox Directions ────────────────────
async function fetchRoute(token, from, to, profile) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=false&access_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;
  const km = (route.distance / 1000).toFixed(1);
  const mins = Math.ceil(route.duration / 60);
  return { km, mins };
}

// ── Stars helper ─────────────────────────────────────────
function Stars({ rating, size = "sm" }) {
  const sz = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={sz} style={{ color: s <= Math.round(rating) ? "#F59E0B" : "#D1D5DB", fill: s <= Math.round(rating) ? "#F59E0B" : "none" }} />
      ))}
    </div>
  );
}

// ── Main Sheet ───────────────────────────────────────────
export default function PlaceSocialSheet({ place, category, onClose, mapToken, userLocation }) {
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [travelMode, setTravelMode] = useState("driving");
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [localCheckIns, setLocalCheckIns] = useState(0);

  // Fetch real community posts tagged to this place (by place name keyword)
  const placeName = place.text || "";
  const { data: realPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["placePosts", placeName],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 50).then(posts =>
      posts.filter(p => {
        const txt = (p.content || p.text || p.title || "").toLowerCase();
        const kw = placeName.toLowerCase().split(" ").filter(w => w.length > 3);
        return kw.some(k => txt.includes(k));
      }).slice(0, 6)
    ),
    enabled: !!placeName && activeTab === "discuss",
  });

  const seed = getPlaceSeed(place.id || place.place_name || "x");
  const rating = (3.8 + seededRandom(seed) * 1.2).toFixed(1);
  const visitCount = seededInt(seed, 80, 450);
  const saveCount = seededInt(seed + 1, 20, 180);
  const checkInBase = seededInt(seed + 7, 10, 95);
  const photos = PHOTO_POOL.slice(seededInt(seed + 2, 0, 3), seededInt(seed + 2, 0, 3) + seededInt(seed + 2, 2, 5));
  const reviews = Array.from({ length: seededInt(seed + 3, 2, 4) }, (_, i) => ({
    id: i,
    name: SAMPLE_NAMES[(seed + i) % SAMPLE_NAMES.length],
    text: SAMPLE_REVIEWS[(seed + i) % SAMPLE_REVIEWS.length],
    rating: seededInt(seed + i * 7, 3, 5),
    time: `${seededInt(seed + i, 1, 6)}d ago`,
    likes: seededInt(seed + i * 3, 0, 24),
  }));
  const communityPosts = Array.from({ length: seededInt(seed + 9, 2, 4) }, (_, i) => ({
    id: i,
    name: SAMPLE_NAMES[(seed + i + 2) % SAMPLE_NAMES.length],
    text: COMMUNITY_POSTS[(seed + i) % COMMUNITY_POSTS.length],
    time: `${seededInt(seed + i * 5, 1, 14)}d ago`,
    likes: seededInt(seed + i * 4, 1, 45),
  }));

  const catEmoji = category?.emoji || "📍";
  const catColor = category?.color || "#2E6B4F";
  const placeLngLat = place.center;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch route when navigate tab active and user location known
  useEffect(() => {
    if (activeTab !== "navigate" || !mapToken || !userLocation || !placeLngLat) return;
    setRouteLoading(true);
    const profile = travelMode === "walking" ? "walking" : "driving";
    fetchRoute(mapToken, userLocation, placeLngLat, profile)
      .then(info => { setRouteInfo(info); setRouteLoading(false); })
      .catch(() => setRouteLoading(false));
  }, [activeTab, travelMode, userLocation, placeLngLat, mapToken]);

  const handleComment = () => {
    if (!newComment.trim()) return;
    setLocalComments(prev => [{ id: Date.now(), name: user?.full_name || "You", text: newComment.trim(), time: "Just now", likes: 0 }, ...prev]);
    setNewComment("");
  };

  const handleCheckIn = () => {
    if (checkedIn) return;
    setCheckedIn(true);
    setLocalCheckIns(n => n + 1);
  };

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl flex flex-col"
      style={{ backgroundColor: "#FAFAF8", boxShadow: "0 -12px 48px rgba(0,0,0,0.24)", maxHeight: "82vh" }}
    >
      {/* ── Handle + Header ── */}
      <div className="pt-3 pb-1 px-4 flex-shrink-0">
        <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ backgroundColor: "var(--border-medium)" }} />

        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${catColor}25, ${catColor}10)`, border: `1.5px solid ${catColor}35` }}>
              {catEmoji}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {place.text}
              </h3>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                {place.place_name?.split(",").slice(1, 3).join(",")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <button onClick={handleCheckIn}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={{
                backgroundColor: checkedIn ? catColor : "var(--bg-subtle)",
                color: checkedIn ? "#fff" : "var(--text-hint)",
                border: `1px solid ${checkedIn ? catColor : "var(--border-light)"}`,
              }}>
              <CheckCircle className="w-3 h-3" />
              {checkedIn ? "Checked in!" : "Check-in"}
            </button>
            <button onClick={() => setSaved(!saved)} className="p-2 rounded-full"
              style={{ backgroundColor: saved ? catColor + "20" : "var(--bg-subtle)" }}>
              <Bookmark className="w-4 h-4" style={{ color: saved ? catColor : "var(--text-hint)", fill: saved ? catColor : "none" }} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Stars rating={rating} size="md" />
          <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{rating}</span>
          <span style={{ color: "var(--border-medium)" }}>•</span>
          <span className="text-xs font-semibold" style={{ color: "#E05C7A" }}>🔥 {visitCount} visits</span>
          <span style={{ color: "var(--border-medium)" }}>•</span>
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>{saveCount} saved</span>
          <span style={{ color: "var(--border-medium)" }}>•</span>
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>{checkInBase + localCheckIns} check-ins</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all"
              style={{
                backgroundColor: activeTab === tab ? "#FAFAF8" : "transparent",
                color: activeTab === tab ? "var(--text-primary)" : "var(--text-hint)",
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.09)" : "none",
              }}>
              {tab === "navigate" ? "🧭" : ""}{tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="overflow-y-auto flex-1 px-4 pb-6">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-3 pt-3">
            <div className="p-3 rounded-2xl flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${catColor}15, ${catColor}07)`, border: `1px solid ${catColor}22` }}>
              <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: catColor }} />
              <div>
                <p className="text-xs font-bold" style={{ color: catColor }}>Trending in your community</p>
                <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
                  {seededInt(seed + 5, 30, 120)} people from the app saved or discussed this place
                </p>
              </div>
            </div>

            {photos.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Photos</p>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt="place" className="h-24 w-32 object-cover rounded-xl flex-shrink-0" />
                  ))}
                </div>
              </div>
            )}

            {reviews[0] && (
              <div className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: catColor }}>
                    {reviews[0].name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{reviews[0].name}</p>
                    <Stars rating={reviews[0].rating} />
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{reviews[0].text}</p>
              </div>
            )}

            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.place_name)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
              <ExternalLink className="w-4 h-4" /> Open in Google Maps
            </a>
          </div>
        )}

        {/* PHOTOS */}
        {activeTab === "photos" && (
          <div className="pt-3 grid grid-cols-2 gap-2">
            {photos.map((url, i) => (
              <img key={i} src={url} alt="place" className="w-full h-32 object-cover rounded-2xl" />
            ))}
            {photos.length === 0 && <p className="col-span-2 text-center text-xs py-8" style={{ color: "var(--text-hint)" }}>No photos yet</p>}
          </div>
        )}

        {/* REVIEWS */}
        {activeTab === "reviews" && (
          <div className="space-y-3 pt-3">
            {reviews.map(r => (
              <div key={r.id} className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: catColor }}>{r.name[0]}</div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{r.name}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{r.time}</p>
                    </div>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* DISCUSS */}
        {activeTab === "discuss" && (
          <div className="pt-3 space-y-3">
            {user && (
              <div className="flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleComment()}
                  placeholder="Share thoughts about this place..."
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                <button onClick={handleComment} className="p-2.5 rounded-xl text-white" style={{ backgroundColor: catColor }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* Real community posts matching this location */}
            {postsLoading && (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent-primary)" }} />
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>Loading community posts...</p>
              </div>
            )}
            {realPosts.length > 0 && (
              <div className="mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: catColor }}>
                  💬 Community posts mentioning this place
                </p>
                {realPosts.map(p => (
                  <div key={p.id} className="p-3 mb-2 rounded-2xl" style={{ background: `linear-gradient(135deg, ${catColor}12, ${catColor}06)`, border: `1px solid ${catColor}20` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: catColor }}>
                        {(p.author_name || p.user_name || "U")[0]}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        {p.author_name || p.user_name || "Community Member"}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
                        {p.created_date ? `${Math.floor((Date.now() - new Date(p.created_date)) / 86400000)}d ago` : ""}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {(p.content || p.text || "").slice(0, 140)}{(p.content || p.text || "").length > 140 ? "…" : ""}
                    </p>
                    {(p.like_count > 0) && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Heart className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
                        <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{p.like_count}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {localComments.map(c => (
              <div key={c.id} className="p-3 rounded-2xl" style={{ backgroundColor: "var(--accent-primary-light)", border: `1px solid ${catColor}22` }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: catColor }}>{c.name[0]}</div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{c.time}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{c.text}</p>
              </div>
            ))}
            {communityPosts.map(post => (
              <div key={post.id} className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: catColor }}>{post.name[0]}</div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{post.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{post.time}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>"{post.text}"</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Heart className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
                  <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{post.likes}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NAVIGATE */}
        {activeTab === "navigate" && (
          <div className="pt-3 space-y-3">
            {/* Mode selector */}
            <div className="flex gap-2">
              {[
                { mode: "driving", icon: Car, label: "Drive" },
                { mode: "walking", icon: Footprints, label: "Walk" },
              ].map(({ mode, icon: Icon, label }) => (
                <button key={mode} onClick={() => setTravelMode(mode)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border transition-all"
                  style={{
                    backgroundColor: travelMode === mode ? catColor : "var(--bg-subtle)",
                    color: travelMode === mode ? "#fff" : "var(--text-secondary)",
                    borderColor: travelMode === mode ? catColor : "var(--border-light)",
                  }}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {/* Route result */}
            {!userLocation && (
              <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "var(--text-hint)" }} />
                <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Enable location to get directions</p>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-hint)" }}>Tap "My Location" on the map first</p>
              </div>
            )}

            {userLocation && routeLoading && (
              <div className="p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <div className="w-5 h-5 border-2 rounded-full animate-spin flex-shrink-0" style={{ borderColor: catColor, borderTopColor: "transparent" }} />
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>Calculating route...</p>
              </div>
            )}

            {userLocation && !routeLoading && routeInfo && (
              <div className="space-y-2">
                <div className="p-4 rounded-2xl" style={{ background: `linear-gradient(135deg, ${catColor}15, ${catColor}07)`, border: `1px solid ${catColor}25` }}>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-black" style={{ color: catColor }}>{routeInfo.mins}</p>
                      <p className="text-[10px] font-semibold" style={{ color: "var(--text-hint)" }}>mins</p>
                    </div>
                    <div className="w-px h-10" style={{ backgroundColor: "var(--border-light)" }} />
                    <div className="text-center">
                      <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{routeInfo.km}</p>
                      <p className="text-[10px] font-semibold" style={{ color: "var(--text-hint)" }}>km away</p>
                    </div>
                    <div className="w-px h-10" style={{ backgroundColor: "var(--border-light)" }} />
                    <div className="flex items-center gap-1">
                      {travelMode === "driving" ? <Car className="w-5 h-5" style={{ color: catColor }} /> : <Footprints className="w-5 h-5" style={{ color: catColor }} />}
                      <span className="text-xs font-semibold capitalize" style={{ color: catColor }}>{travelMode}</span>
                    </div>
                  </div>
                </div>

                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.place_name)}&travelmode=${travelMode}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
                  <Navigation className="w-4 h-4" /> Start Navigation
                </a>
              </div>
            )}

            {userLocation && !routeLoading && !routeInfo && (
              <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>Could not calculate route. Try opening in Google Maps below.</p>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.place_name)}&travelmode=${travelMode}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: catColor }}>
                  Open in Google Maps
                </a>
              </div>
            )}

            {/* Privacy note */}
            <p className="text-[10px] text-center px-2" style={{ color: "var(--text-hint)" }}>
              🔒 Your exact location is never shared with other users. Check-ins are approximate and anonymous.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}