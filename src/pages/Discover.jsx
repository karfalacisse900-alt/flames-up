import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Compass, Lightbulb } from "lucide-react";
import DiscoverAppsTabNew from "@/components/discover/DiscoverAppsTabNew";
import DYKTab from "@/components/discover/DYKTab";
import DiscoverItemModal from "@/components/discover/DiscoverItemModal";

const TABS = [
  { id: "apps", label: "Apps & Tools", icon: Compass },
  { id: "dyk",  label: "Did You Know", icon: Lightbulb },
];

export default function Discover() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("apps");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.DiscoverItem.filter({ is_approved: true }, "-avg_rating", 100)
      .then(setItems)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 pt-4 pb-2 px-4" style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)" }}>
        <h1 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          Discover
        </h1>

        {/* Search bar — only show for apps tab */}
        {activeTab === "apps" && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search apps & tools..."
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

        {/* Tab switcher */}
        <div className="flex gap-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
                  boxShadow: isActive ? "0 2px 8px rgba(46,107,79,0.3)" : "none",
                }}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="pt-3">
        {activeTab === "apps" ? (
          <DiscoverAppsTabNew
            items={items}
            isLoading={isLoading}
            search={search}
            user={user}
            onItemClick={setSelectedItem}
          />
        ) : (
          <DYKTab user={user} />
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