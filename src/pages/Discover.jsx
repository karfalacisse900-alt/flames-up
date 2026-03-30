import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, PenSquare, ChevronDown, MessageCircle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ArticleFeed from "@/components/discover/ArticleFeed";
import ArticleDetail from "@/components/discover/ArticleDetail";
import DiscoverPostComposer from "@/components/discover/DiscoverPostComposer";
import DiscoverUserPostDetail from "@/components/discover/DiscoverUserPostDetail";

const TABS = [
  { id: "foryou", label: "For you" },
  { id: "culture", label: "Culture" },
  { id: "science", label: "Science" },
  { id: "featured", label: "Featured", badge: "New" },
  { id: "daily", label: "Daily" },
];



export default function Discover() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("foryou");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedUserPost, setSelectedUserPost] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const [neighborhood, setNeighborhood] = useState("Your Area");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const name = data.address?.neighbourhood || data.address?.suburb || data.address?.city || data.address?.town;
          if (name) setNeighborhood(name);
        } catch {}
      }, () => {}, { enableHighAccuracy: false, timeout: 6000 });
    }
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

  if (selectedUserPost) {
    return <DiscoverUserPostDetail post={selectedUserPost} user={user} onClose={() => setSelectedUserPost(null)} onUpdate={() => setFeedKey(k => k + 1)} />;
  }

  if (selectedArticle) {
    return <ArticleDetail article={selectedArticle} user={user} onBack={() => setSelectedArticle(null)} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Nextdoor-style Header */}
      <div
        className="sticky top-0 z-30"
        style={{
          backgroundColor: "var(--bg-card)",
          paddingTop: "max(env(safe-area-inset-top, 16px), 16px)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        {/* Top row: location + actions */}
        <div className="flex items-center justify-between px-4 pb-3">
          <button
            className="flex items-center gap-1.5"
            style={{ minHeight: "unset", minWidth: "unset", background: "transparent" }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--accent-primary-light)" }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
            </div>
            <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{neighborhood}</span>
            <ChevronDown className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
              <Bell className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
              <MessageCircle className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            </button>
            {user && (
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
                style={{ backgroundColor: "var(--accent-primary)", flexShrink: 0 }}>
                {(user.full_name || user.email || "U")[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide px-3">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap shrink-0"
              style={{
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-hint)",
                fontWeight: activeTab === tab.id ? 700 : 500,
                borderBottom: activeTab === tab.id ? "2px solid var(--text-primary)" : "2px solid transparent",
                minHeight: "unset", minWidth: "unset", background: "transparent",
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

      {/* Local news section header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Today's local news</h2>
        <Link to={createPageUrl("ExploreArea")}
          className="text-sm font-semibold px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", textDecoration: "none" }}>
          Explore area
        </Link>
      </div>

      {/* Write a post CTA */}
      {user && (
        <div className="mx-4 mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", cursor: "pointer" }}
          onClick={() => setShowComposer(true)}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            {(user.full_name || user.email || "U")[0].toUpperCase()}
          </div>
          <span className="text-sm" style={{ color: "var(--text-hint)" }}>Share something with your neighbors…</span>
        </div>
      )}

      {/* Feed */}
      <ArticleFeed key={feedKey} tab={activeTab} user={user} onArticleClick={setSelectedArticle} onUserPostClick={setSelectedUserPost} />
    </div>
  );
}