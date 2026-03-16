import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, ArrowUp, MapPin, Loader2, Globe, ChevronDown, X, Menu } from "lucide-react";
import FeedMenuDrawer from "./FeedMenuDrawer";
import { createPageUrl } from "@/utils";
import PlaceHub from "./PlaceHub";
import DebateCard from "./DebateCard";
import CommunityPostCard from "./CommunityPostCard";
import { requireVerified } from "../auth/EmailVerificationGate";
import { rankFeedForUser, trackPostView } from "./feedRanking";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { motion, AnimatePresence } from "framer-motion";

const POPULAR_CITIES = ["New York", "London", "Paris", "Tokyo", "Los Angeles", "Sydney", "Toronto", "Dubai", "Berlin", "Mumbai", "São Paulo", "Seoul", "Amsterdam", "Barcelona", "Singapore"];



export default function CommunityFeed({ user }) {
  const [showFeedMenu, setShowFeedMenu] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const [activeFilter, setActiveFilter] = useState("global");
  const [showPicker, setShowPicker] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerRef = useRef(null);
  const pickerRef = useRef(null);
  const qc = useQueryClient();

  const SUPABASE_URL = "https://ljyxfbymvbtflvdwipxg.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeXhmYnltdmJ0Zmx2ZHdpcHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MzQ0NDQsImV4cCI6MjA1MDExMDQ0NH0.M8qyqYoVwgZxnr-rWdZdSgTRj88SX8uKQf1NuM0eC7U";
  const BATCH_SIZE = 20;

  const fetchPosts = useCallback(async (pageNum) => {
    try {
      const allPosts = await base44.entities.CommunityPost.list("-created_date", 500);
      const filtered = allPosts.filter(p => !p.tags?.includes("listen_dont_judge"));
      const offset = pageNum * BATCH_SIZE;
      return filtered.slice(offset, offset + BATCH_SIZE);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      return [];
    }
  }, []);

  const loadInitialPosts = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchPosts(0);
    setPosts(data);
    setHasMore(data.length === BATCH_SIZE);
    setPage(0);
    setIsLoading(false);
  }, [fetchPosts]);

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || isFetchingMore) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    const data = await fetchPosts(nextPage);
    setPosts(prev => [...prev, ...data]);
    setHasMore(data.length === BATCH_SIZE);
    setPage(nextPage);
    setIsFetchingMore(false);
  }, [hasMore, isFetchingMore, page, fetchPosts]);

  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  const refetch = useCallback(async () => {
    await loadInitialPosts();
    setNewPostsAvailable(0);
  }, [loadInitialPosts]);

  // Reverse geocode coords to get neighborhood/area name
  const [detectedArea, setDetectedArea] = useState(null);
  
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      const area = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.address?.city || data.address?.town || null;
      return area;
    } catch {
      return null;
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        const area = await reverseGeocode(coords.lat, coords.lng);
        setDetectedArea(area);
        setLocationLoading(false);
      },
      () => setLocationLoading(false)
    );
  };

  // Auto-detect location on mount for nearby feed
  useEffect(() => {
    if (activeFilter === "nearby" && !userCoords && !locationLoading) detectLocation();
  }, [activeFilter]);

  // Continuously track location updates
  useEffect(() => {
    if (activeFilter !== "nearby") return;
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          const area = await reverseGeocode(coords.lat, coords.lng);
          setDetectedArea(area);
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 30000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [activeFilter]);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const unsub = base44.entities.CommunityPost.subscribe((event) => {
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
      if (event.type === "create") {
        setNewPostsAvailable(n => n + 1);
      }
    });
    return unsub;
  }, [qc]);

  useEffect(() => {
    const unsub = base44.entities.CommunityComment.subscribe((event) => {
      if (event.type === "create" && expandedPost === event.data?.post_id)
        qc.invalidateQueries({ queryKey: ["communityComments", event.data.post_id] });
    });
    return unsub;
  }, [expandedPost, qc]);

  useEffect(() => {
    const unsub = base44.entities.CommunityDebate.subscribe(() => qc.invalidateQueries({ queryKey: ["communityDebates"] }));
    return unsub;
  }, [qc]);

  const { data: debates = [] } = useQuery({
    queryKey: ["communityDebates"],
    queryFn: () => base44.entities.CommunityDebate.list("-created_date", 50),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["myFollows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user?.email,
  });

  const loadNewPosts = () => { refetch(); };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, loadMorePosts]);

  const { containerRef, PullIndicator, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(async () => {
    await refetch();
    setNewPostsAvailable(0);
  });

  const upvoteMut = useMutation({
    mutationFn: ({ post }) => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      const hasUpvoted = post.upvoted_by?.includes(user.email);
      if (hasUpvoted) {
        const newUpvotes = Math.max(0, (post.upvotes || 0) - 1);
        return base44.entities.CommunityPost.update(post.id, {
          upvotes: newUpvotes,
          upvoted_by: (post.upvoted_by || []).filter(e => e !== user.email),
          engagement_score: newUpvotes + ((post.comment_count || 0) * 2) - (post.downvotes || 0),
        });
      } else {
        const newUpvotes = (post.upvotes || 0) + 1;
        return base44.entities.CommunityPost.update(post.id, {
          upvotes: newUpvotes,
          upvoted_by: [...(post.upvoted_by || []), user.email],
          engagement_score: newUpvotes + ((post.comment_count || 0) * 2) - (post.downvotes || 0),
        });
      }
    },
    onMutate: ({ post }) => {
      const hasUpvoted = post.upvoted_by?.includes(user?.email);
      qc.setQueryData(["communityPosts"], (old) => {
        if (!old) return old;
        return old.map(p => p.id !== post.id ? p : {
          ...p,
          upvotes: hasUpvoted ? Math.max(0, (p.upvotes || 0) - 1) : (p.upvotes || 0) + 1,
          upvoted_by: hasUpvoted
            ? (p.upvoted_by || []).filter(e => e !== user.email)
            : [...(p.upvoted_by || []), user.email],
        });
      });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const followedEmails = useMemo(() => follows.map(f => f.following_email), [follows]);

  // Stable post order — sorted once on load, never re-sorted on likes
  const stablePostIds = useMemo(() => {
    if (posts.length === 0) return [];
    const list = posts.filter(p => p.type !== "review");
    const ranked = user?.email
      ? rankFeedForUser(list, user.email, debates, followedEmails)
      : [...list].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return ranked.map(p => p.id);
  }, [posts.map(p => p.id).sort().join(","), user?.email, debates.length, followedEmails.join(",")]);

  const uniqueCities = useMemo(() => {
    return [...new Set(posts.map(p => p.location_city).filter(Boolean))].sort();
  }, [posts]);

  const citySuggestions = useMemo(() => {
    const q = cityInput.trim().toLowerCase();
    if (!q) return POPULAR_CITIES.slice(0, 8);
    const fromPosts = uniqueCities.filter(c => c.toLowerCase().includes(q));
    const fromPopular = POPULAR_CITIES.filter(c => c.toLowerCase().includes(q) && !fromPosts.includes(c));
    return [...fromPosts, ...fromPopular].slice(0, 8);
  }, [cityInput, uniqueCities]);

  const filteredPosts = useMemo(() => {
    const postMap = new Map(posts.filter(p => p.type !== "review").map(p => [p.id, p]));
    let base = stablePostIds.map(id => postMap.get(id)).filter(Boolean);

    if (activeFilter === "nearby") {
      if (!userCoords) return [];
      // Dynamic radius: 25km in dense cities, up to 100km in rural areas
      const postsWithDistance = base
        .filter(p => p.location_lat && p.location_lng)
        .map(p => {
          const dLat = (p.location_lat - userCoords.lat) * (Math.PI / 180);
          const dLng = (p.location_lng - userCoords.lng) * (Math.PI / 180);
          const a = Math.sin(dLat/2)**2 + Math.cos(userCoords.lat * Math.PI/180) * Math.cos(p.location_lat * Math.PI/180) * Math.sin(dLng/2)**2;
          const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return { ...p, distance: km };
        })
        .sort((a, b) => a.distance - b.distance);
      
      // Adaptive radius: if we have posts within 10km, limit to 25km; else expand to 100km
      const hasNearby = postsWithDistance.some(p => p.distance <= 10);
      const maxRadius = hasNearby ? 25 : 100;
      base = postsWithDistance.filter(p => p.distance <= maxRadius);
    } else if (activeFilter !== "global") {
      base = base.filter(p => p.location_city?.toLowerCase() === activeFilter.toLowerCase());
    }

    // Return in stable order (DO NOT re-sort after likes)
    return base;
  }, [stablePostIds, posts, activeFilter, userCoords]);

  const getDebateForPost = (postId) => debates.find(d => d.post_id === postId);

  const renderPostCard = (post, index) => {
    const debate = getDebateForPost(post.id);
    if (user?.email) trackPostView(post.id);
    return post.type === "debate" || post.type === "question" ? (
      <DebateCard 
        key={post.id}
        post={post} 
        debate={debate} 
        user={user}
        onUpvote={() => user && upvoteMut.mutate({ post })}
        isExpanded={expandedPost === post.id}
        onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
      />
    ) : (
      <CommunityPostCard 
        key={post.id}
        post={post} 
        user={user}
        onUpvote={() => user && upvoteMut.mutate({ post })}
        isExpanded={expandedPost === post.id}
        onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
        onLocationClick={() => {}}
        onTap={() => {}}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full skeleton" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded skeleton" />
                <div className="h-2.5 w-16 rounded skeleton" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 rounded skeleton" />
              <div className="h-3 w-4/5 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ backgroundColor: "var(--bg-app)", maxWidth: 680, margin: "0 auto" }}
    >
      <FeedMenuDrawer isOpen={showFeedMenu} onClose={() => setShowFeedMenu(false)} />

      {/* Sticky feed header */}
      <div className="sticky top-0 z-20" style={{ 
        background: "linear-gradient(180deg, rgba(242,237,228,0.98), rgba(242,237,228,0.8))", 
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(207,198,188,0.4)"
      }}>
        <div className="px-4 pt-2.5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFeedMenu(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
            >
              <Menu className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Single location toggle */}
            <div className="relative" ref={pickerRef}>
              <div className="flex items-center rounded-full overflow-hidden" style={{ border: "1px solid var(--border-light)", backgroundColor: activeFilter !== "global" ? "var(--accent-primary)" : "var(--bg-subtle)" }}>
                <button
                  onClick={() => setShowPicker(p => !p)}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs font-semibold transition-all"
                  style={{ color: activeFilter !== "global" ? "#fff" : "var(--text-secondary)" }}>
                  {activeFilter === "global" && <><Globe className="w-3 h-3" /> Global</>}
                  {activeFilter === "nearby" && <><MapPin className="w-3 h-3" /> {detectedArea || "Nearby"}</>}
                  {activeFilter !== "global" && activeFilter !== "nearby" && <><MapPin className="w-3 h-3" /> {activeFilter}</>}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {/* X to reset to Global */}
                {activeFilter !== "global" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveFilter("global"); setShowPicker(false); }}
                    className="pr-2 pl-1 py-1.5 flex items-center"
                    style={{ color: "#fff" }}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {showPicker && (
                <div className="absolute right-0 top-9 w-64 rounded-2xl shadow-lg z-50 overflow-hidden"
                  style={{ backgroundColor: "var(--bg-modal)", border: "1px solid var(--border-light)", backdropFilter: "blur(12px)" }}>
                  {/* Global & Nearby */}
                  <div className="p-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <button onClick={() => { setActiveFilter("global"); setShowPicker(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all"
                      style={{ backgroundColor: activeFilter === "global" ? "var(--accent-primary-light)" : "transparent", color: activeFilter === "global" ? "var(--accent-primary)" : "var(--text-primary)" }}>
                      <Globe className="w-4 h-4" /> Global
                    </button>
                    <button onClick={() => { setActiveFilter("nearby"); setShowPicker(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all"
                      style={{ backgroundColor: activeFilter === "nearby" ? "var(--accent-primary-light)" : "transparent", color: activeFilter === "nearby" ? "var(--accent-primary)" : "var(--text-primary)" }}>
                      <MapPin className="w-4 h-4" /> Nearby {detectedArea && `(${detectedArea})`}
                    </button>
                  </div>

                  {/* City search */}
                  <div className="p-2">
                    <input
                      autoFocus
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="Search city…"
                      className="w-full px-3 py-1.5 rounded-xl text-sm outline-none mb-2"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                    />
                    <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                      {citySuggestions.map(c => (
                        <button key={c} onClick={() => { setActiveFilter(c); setCityInput(""); setShowPicker(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-sm transition-all"
                          style={{ backgroundColor: activeFilter === c ? "var(--accent-primary-light)" : "transparent", color: activeFilter === c ? "var(--accent-primary)" : "var(--text-primary)" }}>
                          🏙 {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              to={createPageUrl("CreatePostFlow")}
              onClick={(e) => { if (!requireVerified(user)) e.preventDefault(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", color: "#fff", boxShadow: "0 2px 8px rgba(46,107,79,0.35)" }}>
              <Plus className="w-3 h-3" /> Post
            </Link>
          </div>
        </div>
      </div>

      {/* New posts floating pill */}
      <AnimatePresence>
        {newPostsAvailable > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={loadNewPosts}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold"
            whileHover={{ scale: 1.05, y: -25 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)",
              color: "#fff",
              boxShadow: "0 8px 32px rgba(46,107,79,0.4)",
            }}>
            <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <ArrowUp className="w-3.5 h-3.5" />
            </motion.div>
            {newPostsAvailable} new post{newPostsAvailable !== 1 ? "s" : ""}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div className="pb-28 flex flex-col gap-4 px-4 py-4">
        {activeFilter === "nearby" && locationLoading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--accent-primary)" }} />
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Finding your location…</p>
          </div>
        ) : activeFilter === "nearby" && !userCoords ? (
          <div className="py-16 text-center px-8">
            <MapPin className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
            <p className="text-base font-bold mb-1.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Location access needed</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-hint)" }}>Allow location to see posts from people near you</p>
            <button onClick={detectLocation}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
              Enable Location
            </button>
          </div>
        ) : filteredPosts.length === 0 && !isLoading ? (
          <div className="py-16 text-center px-8" style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="text-5xl mb-4">{activeFilter === "nearby" ? "📍" : activeFilter === "global" ? "💬" : "🏙"}</div>
            <p className="text-base font-bold mb-1.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {activeFilter === "nearby" ? "No posts near you yet" : activeFilter === "global" ? "Start the conversation" : `No posts from ${activeFilter} yet`}
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--text-hint)" }}>Be the first to share something here!</p>
            <Link
               to={createPageUrl("CreatePostFlow")}
               onClick={(e) => { if (!requireVerified(user)) e.preventDefault(); }}
               className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
               style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 16px rgba(46,107,79,0.35)" }}>
               ✦ {activeFilter === "nearby" ? "Post from here" : "Create First Post"}
             </Link>
          </div>
        ) : (
          <>
            {filteredPosts.map(renderPostCard)}
            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerRef} className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
              </div>
            )}
            {!hasMore && filteredPosts.length > 0 && (
              <p className="text-center text-sm py-6" style={{ color: "var(--text-hint)" }}>
                You've reached the end 🎉
              </p>
            )}
          </>
        )}
      </div>


    </div>
  );
}