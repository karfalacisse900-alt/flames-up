import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, Zap, Lightbulb, X } from "lucide-react";

import DiscoverAppsTabNew from "../components/discover/DiscoverAppsTabNew.jsx";
import DiscoverItemModal from "../components/discover/DiscoverItemModal";
import DYKTab from "../components/discover/DYKTab.jsx";

const MAIN_TABS = [
  { id: "apps", label: "Apps & Tools", icon: Zap, emoji: null },
  { id: "dyk",  label: "Did You Know",  icon: Lightbulb, emoji: null },
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
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-app)" }}
    >
      {/* ── Mobile layout ── */}
      <div className="lg:hidden overflow-y-auto overflow-x-hidden pb-24">
        {/* Mobile header */}
        <div className="px-4 pt-5 pb-3" style={{ backgroundColor: "var(--bg-app)" }}>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            Discover
          </h1>
          <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>Explore amazing apps and learn facts</p>

          {activeTab === "apps" && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search apps and tools…"
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

          <div className="flex gap-2">
            {MAIN_TABS.map(t => {
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
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {activeTab === "apps" && (
            <DiscoverAppsTabNew items={items} isLoading={isLoading} search={search} user={user} onItemClick={setSelectedItem} />
          )}
          {activeTab === "dyk" && <DYKTab user={user} />}
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left sidebar — tab navigation */}
        <aside
          className="w-56 flex-shrink-0 sticky top-0 h-screen py-8 px-4 flex flex-col gap-2"
          style={{ borderRight: "1px solid var(--border-light)", backgroundColor: "var(--bg-nav)" }}
        >
          <h1
            className="text-xl font-bold mb-6 px-2"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}
          >
            Discover
          </h1>

          {MAIN_TABS.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setSearch(""); }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-left transition-all"
                style={{
                  backgroundColor: isActive ? "var(--accent-primary-light)" : "transparent",
                  color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-subtle)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <t.icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
                {t.label}
              </button>
            );
          })}
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Desktop search bar (apps tab only) */}
          {activeTab === "apps" && (
            <div
              className="sticky top-0 z-10 px-8 py-4"
              style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)" }}
            >
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search apps and tools…"
                  className="w-full pl-11 pr-10 py-3 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="px-8 py-6 pb-16">
            {activeTab === "apps" && (
              <DiscoverAppsTabNew items={items} isLoading={isLoading} search={search} user={user} onItemClick={setSelectedItem} />
            )}
            {activeTab === "dyk" && <DYKTab user={user} />}
          </div>
        </main>
      </div>

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