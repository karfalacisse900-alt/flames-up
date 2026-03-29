import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, PenSquare } from "lucide-react";
import ArticleFeed from "@/components/discover/ArticleFeed";
import ExploreAreaPanel from "@/components/discover/ExploreAreaPanel";
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
  const [showExplore, setShowExplore] = useState(false);
  const [selectedUserPost, setSelectedUserPost] = useState(null);
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

  if (showExplore) {
    return <ExploreAreaPanel onClose={() => setShowExplore(false)} />;
  }

  if (selectedUserPost) {
    return <DiscoverUserPostDetail post={selectedUserPost} user={user} onClose={() => setSelectedUserPost(null)} onUpdate={() => setFeedKey(k => k + 1)} />;
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


      {/* Explore Your Area toggle */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <button
          onClick={() => setShowExplore(v => !v)}
          className="flex items-center justify-between w-full px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: showExplore ? "var(--accent-primary)" : "var(--bg-card)",
            border: "1px solid var(--border-light)",
            minHeight: "unset", minWidth: "unset",
          }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <span className="text-sm font-bold" style={{ color: showExplore ? "#fff" : "var(--text-primary)" }}>Explore Your Area</span>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: showExplore ? "rgba(255,255,255,0.2)" : "var(--bg-subtle)", color: showExplore ? "#fff" : "var(--text-hint)" }}>
            {showExplore ? "Hide" : "Show"}
          </span>
        </button>
      </div>



      {/* Feed */}
      <ArticleFeed key={feedKey} tab={activeTab} user={user} onArticleClick={setSelectedArticle} onUserPostClick={setSelectedUserPost} />
    </div>
  );
}