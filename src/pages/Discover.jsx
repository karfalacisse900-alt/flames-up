import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, PenSquare, MapPin, Navigation, Map, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ArticleFeed from "@/components/discover/ArticleFeed";
import ArticleDetail from "@/components/discover/ArticleDetail";
import DiscoverPostComposer from "@/components/discover/DiscoverPostComposer";

const TABS = [
  { id: "foryou", label: "For you" },
  { id: "culture", label: "Culture" },
  { id: "science", label: "Science" },
  { id: "featured", label: "Featured", badge: "New" },
  { id: "daily", label: "Daily" },
];

const PLACE_SHORTCUTS = [
  { id: "around", label: "Around Me", emoji: "📍", desc: "What's nearby" },
  { id: "nearby", label: "Nearby", emoji: "🧭", desc: "Close by" },
  { id: "places", label: "Places", emoji: "🗺️", desc: "Explore" },
  { id: "events", label: "Events", emoji: "🎉", desc: "Happening now" },
];

export default function Discover() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("foryou");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (showComposer && user) {
    return (
      <DiscoverPostComposer
        user={user}
        onClose={() => setShowComposer(false)}
        onPosted={() => { setShowComposer(false); setFeedKey(k => k + 1); }}
      />
    );
  }

  if (selectedArticle) {
    return <ArticleDetail article={selectedArticle} user={user} onBack={() => setSelectedArticle(null)} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-30"
        style={{
          backgroundColor: "var(--bg-app)",
          paddingTop: "max(env(safe-area-inset-top, 16px), 16px)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            Discover
          </h1>
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={() => setShowComposer(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--accent-primary)", minHeight: "unset", minWidth: "unset" }}>
                <PenSquare className="w-4 h-4 text-white" />
              </button>
            )}
            <button className="w-10 h-10 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
              <Bell className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide px-3">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap shrink-0 relative"
              style={{
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-hint)",
                fontWeight: activeTab === tab.id ? 700 : 500,
                borderBottom: activeTab === tab.id ? "2px solid var(--text-primary)" : "2px solid transparent",
                minHeight: "unset",
                minWidth: "unset",
                background: "transparent",
              }}
            >
              {tab.label}
              {tab.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#16A34A", color: "#fff" }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Location shortcuts */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>Explore Your Area</p>
        <div className="grid grid-cols-4 gap-2">
          {PLACE_SHORTCUTS.map(s => (
            <button key={s.id} onClick={() => navigate("/NearbyPlaces")}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", minHeight: "unset", minWidth: "unset" }}>
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <ArticleFeed key={feedKey} tab={activeTab} user={user} onArticleClick={setSelectedArticle} />
    </div>
  );
}