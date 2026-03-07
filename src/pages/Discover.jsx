import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Compass, Lightbulb, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DiscoverExplorer from "@/components/discover/DiscoverExplorer";
import DiscoverAppsTabNew from "@/components/discover/DiscoverAppsTabNew";
import DYKTab from "@/components/discover/DYKTab";
import DiscoverItemModal from "@/components/discover/DiscoverItemModal";

const QUICK_CHIPS = [
  { label: "🤖 AI Tools",       search: "ai" },
  { label: "📚 Study Tools",    search: "study" },
  { label: "✈️ Travel Apps",    search: "travel" },
  { label: "⚡ Productivity",   search: "productivity" },
  { label: "🎬 Free Movies",    search: "movie" },
  { label: "🛠️ Dev Tools",      search: "developer" },
  { label: "💰 Finance",        search: "finance" },
  { label: "💪 Health",         search: "health" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Discover() {
  const [user, setUser]           = useState(null);
  const [items, setItems]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState("apps");
  const [selectedItem, setSelectedItem] = useState(null);

  // "explore" = Spotify home view; "browse" = filtered list/search
  const [view, setView] = useState("explore");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.DiscoverItem.filter({ is_approved: true }, "-avg_rating", 100)
      .then(setItems)
      .finally(() => setIsLoading(false));
  }, []);

  const handleChipSearch = (term) => {
    setSearch(term);
    setView("browse");
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    if (val) setView("browse");
    else setView("explore");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setView("explore");
  };

  const firstName = user?.full_name?.split(" ")[0] || "";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>

      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-30 px-4 pt-5 pb-3"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        {/* Greeting + tab row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            {view === "browse" ? (
              <button
                onClick={() => { setView("explore"); setSearch(""); }}
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-hint)" }}>{getGreeting()}{firstName ? `, ${firstName}` : ""} 👋</p>
                <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Discover</h1>
              </div>
            )}
          </div>

          {/* Tab pills */}
          <div className="flex gap-1.5">
            {[
              { id: "apps", icon: Compass,   label: "Apps" },
              { id: "dyk",  icon: Lightbulb, label: "Facts" },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
                  }}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search bar — apps tab only */}
        {activeTab === "apps" && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search apps, tools, and websites..."
              className="w-full pl-9 pr-9 py-2.5 rounded-2xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            {search && (
              <button onClick={() => { setSearch(""); setView("explore"); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
              </button>
            )}
          </div>
        )}


      </div>

      {/* ── Content ── */}
      <div className="pt-3">
        {activeTab === "dyk" ? (
          <DYKTab user={user} />
        ) : view === "explore" ? (
          <DiscoverExplorer
            items={items}
            isLoading={isLoading}
            user={user}
            onItemClick={setSelectedItem}
            onChipSearch={handleChipSearch}
            greeting={getGreeting()}
          />
        ) : (
          <DiscoverAppsTabNew
            items={items}
            isLoading={isLoading}
            search={search}
            user={user}
            onItemClick={setSelectedItem}
            hideCategoryPills={false}
          />
        )}
      </div>

      {/* ── Item detail modal ── */}
      {selectedItem && (
        <DiscoverItemModal
          item={selectedItem}
          user={user}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}