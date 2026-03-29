import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import ArticleFeed from "@/components/discover/ArticleFeed";
import ArticleDetail from "@/components/discover/ArticleDetail";

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

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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
          <button className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
            <Bell className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          </button>
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

      {/* Feed */}
      <ArticleFeed tab={activeTab} user={user} onArticleClick={setSelectedArticle} />
    </div>
  );
}