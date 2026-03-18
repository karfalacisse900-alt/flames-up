import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, ArrowLeft } from "lucide-react";
import DiscoverMenuDrawer from "@/components/discover/DiscoverMenuDrawer";
import { motion, AnimatePresence } from "framer-motion";
import DiscoverExplorer from "@/components/discover/DiscoverExplorer";
import DiscoverAppsTabNew from "@/components/discover/DiscoverAppsTabNew";
import DYKTab from "@/components/discover/DYKTab";
import DiscoverItemModal from "@/components/discover/DiscoverItemModal";


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
    // Ensure modal & scroll lock are cleared when leaving this page
    return () => {
      setSelectedItem(null);
      document.body.style.overflow = "";
    };
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-app)" }}
    >

      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)", isolation: "isolate" }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          {view === "browse" && activeTab === "apps" ? (
            <button
              onClick={() => { setView("explore"); setSearch(""); }}
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Discover</h1>
          )}
        </div>

        {/* Tab bar — hamburger menu */}
        <div className="mb-3">
          <DiscoverMenuDrawer activeTab={activeTab} onChange={handleTabChange} />
        </div>

        {/* Search bar — apps tab only */}
        {activeTab === "apps" && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search apps, tools, websites…"
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1.5px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            {search && (
              <button onClick={() => { setSearch(""); setView("explore"); }} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="pt-2">
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