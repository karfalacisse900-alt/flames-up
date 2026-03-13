import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Globe, MapPin, Flame, Clock, Plus, Sparkles } from "lucide-react";
import CreateNowStatusModal from "@/components/nowboard/CreateNowStatusModal";
import NowStatusCard from "@/components/nowboard/NowStatusCard";
import NowStatusViewer from "@/components/nowboard/NowStatusViewer";

const FILTERS = [
  { key: "global", label: "Global", icon: Globe },
  { key: "trending", label: "Trending", icon: Flame },
  { key: "newest", label: "Newest", icon: Clock },
];

const CATEGORIES = ["food", "travel", "music", "question", "events", "local_tips", "general"];

export default function NowBoard() {
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("global");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingStatus, setViewingStatus] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Get user's geolocation
  useEffect(() => {
    if (navigator.geolocation && activeFilter !== "global") {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [activeFilter]);

  // Fetch statuses
  const { data: statuses = [], isLoading, refetch } = useQuery({
    queryKey: ["nowStatuses", activeFilter, selectedCategory],
    queryFn: async () => {
      let query = { is_active: true };
      
      // Filter by expiration
      const now = new Date().toISOString();
      
      let all = await base44.entities.NowStatus.list("-created_date", 100);
      all = all.filter(s => s.expires_at > now && s.is_active);

      // Filter by category
      if (selectedCategory) {
        all = all.filter(s => s.category === selectedCategory);
      }

      // Sort by filter type
      if (activeFilter === "trending") {
        all = all.sort((a, b) => {
          const aReactions = Object.values(a.reactions || {}).reduce((sum, c) => sum + c, 0);
          const bReactions = Object.values(b.reactions || {}).reduce((sum, c) => sum + c, 0);
          return bReactions - aReactions;
        });
      }

      return all;
    },
    staleTime: 30000,
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => refetch(), 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-sm border-b"
        style={{ backgroundColor: "rgba(242,237,228,0.9)", borderColor: "var(--border-light)" }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" style={{ color: "var(--accent-primary)" }} />
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                Now Board
              </h1>
            </div>
            {user && (
              <button onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-white transition-all active:scale-95"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                <Plus className="w-4 h-4" /> Post
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {FILTERS.map(f => {
              const Icon = f.icon;
              return (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: activeFilter === f.key ? "var(--accent-primary)" : "var(--bg-card)",
                    color: activeFilter === f.key ? "white" : "var(--text-secondary)",
                    border: `1px solid ${activeFilter === f.key ? "var(--accent-primary)" : "var(--border-light)"}`
                  }}>
                  <Icon className="w-3.5 h-3.5" /> {f.label}
                </button>
              );
            })}
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto mt-3">
            <button onClick={() => setSelectedCategory(null)}
              className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: selectedCategory === null ? "var(--accent-primary)" : "var(--bg-card)",
                color: selectedCategory === null ? "white" : "var(--text-secondary)"
              }}>
              All
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all capitalize"
                style={{
                  backgroundColor: selectedCategory === cat ? "var(--accent-primary)" : "var(--bg-card)",
                  color: selectedCategory === cat ? "white" : "var(--text-secondary)"
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-accent-primary rounded-full animate-spin"
              style={{ borderTopColor: "var(--accent-primary)" }} />
          </div>
        ) : statuses.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ color: "var(--text-hint)" }}>No statuses yet. Be the first to post! 🚀</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {statuses.map(status => (
              <div key={status.id} className="break-inside-avoid mb-4">
                <NowStatusCard
                  status={status}
                  currentUser={user}
                  onView={() => setViewingStatus(status)}
                  onRefresh={() => refetch()}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateNowStatusModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {viewingStatus && (
        <NowStatusViewer
          status={viewingStatus}
          currentUser={user}
          onClose={() => setViewingStatus(null)}
          onRefresh={() => refetch()}
        />
      )}
    </div>
  );
}