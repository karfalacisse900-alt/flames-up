import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, Zap, Film, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Sub-tabs
import DiscoverAppsTab from "../components/discover/DiscoverAppsTab.jsx";
import DiscoverMediaTab from "../components/discover/DiscoverMediaTab.jsx";
import MapboxLocal from "../components/discover/MapboxLocal";
import DiscoverItemModal from "../components/discover/DiscoverItemModal";
import DYKTab from "../components/discover/DYKTab";

const MAIN_TABS = [
  { id: "apps",  label: "Apps & Tools", icon: Zap },
  { id: "media", label: "Media",        icon: Film },
  { id: "local", label: "Local",        icon: MapPin },
  { id: "dyk",   label: "Did You Know", icon: "💡" },
];

export default function Discover() {
  const [activeTab, setActiveTab] = useState("apps");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["discover"],
    queryFn: () => base44.entities.DiscoverItem.list("-created_date", 500),
  });

  return (
    <div
      className="overflow-y-auto overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-app)", minHeight: "100%", maxWidth: "100%" }}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-3" style={{ backgroundColor: "var(--bg-app)" }}>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
          Discover
        </h1>
        <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>
          Apps, media, and places around you
        </p>

        {/* Search bar (only for apps and media tabs) */}
        {activeTab !== "local" && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === "apps" ? "Search apps and tools…" : "Search music, movies, books, games…"}
              className="w-full pl-9 pr-9 py-2.5 rounded-2xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
              </button>
            )}
          </div>
        )}

        {/* Main tab switcher */}
        <div className="flex gap-2">
          {MAIN_TABS.map(t => {
            const Icon = typeof t.icon === "string" ? null : t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setSearch(""); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all"
                style={{
                  backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
                  boxShadow: isActive ? "0 2px 12px rgba(46,107,79,0.25)" : "none",
                }}
              >
                {Icon ? <Icon className="w-3.5 h-3.5" /> : <span>{t.icon}</span>}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="pb-24">
        {activeTab === "apps" && (
          <DiscoverAppsTab
            items={items}
            isLoading={isLoading}
            search={search}
            user={user}
            onItemClick={setSelectedItem}
          />
        )}
        {activeTab === "media" && (
          <DiscoverMediaTab search={search} user={user} />
        )}
        {activeTab === "local" && (
          <MapboxLocal />
        )}
        {activeTab === "dyk" && (
          <DYKTab user={user} />
        )}
      </div>

      {/* App detail modal */}
      {selectedItem && (
        <DiscoverItemModal
          item={selectedItem}
          user={user}
          allItems={items}
          onClose={() => setSelectedItem(null)}
          onOpenRelated={rel => setSelectedItem(rel)}
        />
      )}
    </div>
  );
}