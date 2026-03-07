import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Compass, Lightbulb, Plus, Star, ExternalLink, Flame } from "lucide-react";
import DiscoverAppsTabNew from "@/components/discover/DiscoverAppsTabNew";
import DYKTab from "@/components/discover/DYKTab";
import DiscoverItemModal from "@/components/discover/DiscoverItemModal";
import DiscoverLogo from "@/components/discover/DiscoverLogo";

const TABS = [
  { id: "apps", label: "Apps & Tools", icon: Compass },
  { id: "dyk",  label: "Did You Know", icon: Lightbulb },
];

const CATEGORIES = [
  { id: null,              label: "✨ All",             emoji: "✨" },
  { id: "productivity",    label: "⚡ Productivity",    emoji: "⚡" },
  { id: "finance",         label: "💰 Finance",         emoji: "💰" },
  { id: "learning",        label: "📚 Learning",        emoji: "📚" },
  { id: "lifestyle",       label: "🌿 Lifestyle",       emoji: "🌿" },
  { id: "entertainment",   label: "🎬 Entertainment",   emoji: "🎬" },
  { id: "health",          label: "💪 Health",          emoji: "💪" },
  { id: "social",          label: "👥 Social",          emoji: "👥" },
  { id: "developer_tools", label: "🛠️ Dev Tools",       emoji: "🛠️" },
];

const CATEGORY_GRADIENTS = {
  productivity:    ["#6366f1", "#8b5cf6"],
  finance:         ["#10b981", "#059669"],
  learning:        ["#f59e0b", "#d97706"],
  lifestyle:       ["#34d399", "#10b981"],
  entertainment:   ["#f43f5e", "#e11d48"],
  health:          ["#06b6d4", "#0891b2"],
  social:          ["#8b5cf6", "#7c3aed"],
  developer_tools: ["#374151", "#1f2937"],
  general:         ["#2E6B4F", "#1a4230"],
};

function getGradient(category) {
  const g = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

// ── Desktop Category Sidebar ─────────────────────────────────────────────────
function DesktopCategorySidebar({ activeCategory, onCategoryChange, activeTab, onTabChange }) {
  return (
    <aside
      className="hidden lg:flex flex-col gap-1 sticky top-0 h-screen overflow-y-auto pt-6 pb-20 px-3"
      style={{ width: 220, backgroundColor: "var(--bg-card)", borderRight: "1px solid var(--border-light)", flexShrink: 0 }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2" style={{ color: "var(--text-hint)" }}>Section</p>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
            style={{
              backgroundColor: isActive ? "var(--accent-primary)" : "transparent",
              color: isActive ? "#fff" : "var(--text-secondary)",
            }}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            {tab.label}
          </button>
        );
      })}

      {activeTab === "apps" && (
        <>
          <div className="my-3 h-px" style={{ backgroundColor: "var(--border-light)" }} />
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2" style={{ color: "var(--text-hint)" }}>Category</p>
          {CATEGORIES.map(c => {
            const isActive = activeCategory === c.id;
            return (
              <button
                key={String(c.id)}
                onClick={() => onCategoryChange(c.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left w-full"
                style={{
                  backgroundColor: isActive ? "var(--accent-primary-light)" : "transparent",
                  color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <span className="text-sm w-5 text-center">{c.emoji}</span>
                <span className="truncate">{c.label.replace(/^[\S]+ /, "")}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent-primary)" }} />}
              </button>
            );
          })}
        </>
      )}
    </aside>
  );
}

// ── Desktop Spotlight Panel (right) ─────────────────────────────────────────
function DesktopSpotlightPanel({ items }) {
  const featured = items.filter(i => i.is_featured || (i.avg_rating || 0) >= 4).slice(0, 5);
  const newest   = items.filter(i => i.is_new).slice(0, 4);

  if (!featured.length && !newest.length) return null;

  return (
    <aside
      className="hidden xl:flex flex-col gap-4 sticky top-0 h-screen overflow-y-auto pt-6 pb-20 px-4"
      style={{ width: 260, flexShrink: 0 }}
    >
      {featured.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Hot Right Now
          </p>
          <div className="space-y-2">
            {featured.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: getGradient(item.category) }}>
                  <DiscoverLogo item={item} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--text-hint)" }}>{item.pricing || item.brand_name || ""}</p>
                  {(item.avg_rating || 0) > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>{item.avg_rating?.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {newest.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
            ⭐ New This Week
          </p>
          <div className="space-y-2">
            {newest.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: getGradient(item.category) }}>
                  <DiscoverLogo item={item} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "var(--accent-primary)" }}>NEW</span>
                </div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Discover() {
  const [user, setUser]           = useState(null);
  const [items, setItems]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState("apps");
  const [selectedItem, setSelectedItem] = useState(null);
  const [category, setCategory]   = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.DiscoverItem.filter({ is_approved: true }, "-avg_rating", 100)
      .then(setItems)
      .finally(() => setIsLoading(false));
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCategory(null);
    setSearch("");
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-app)" }}>

      {/* ── Desktop left sidebar ── */}
      <DesktopCategorySidebar
        activeCategory={category}
        onCategoryChange={(c) => { setCategory(c); }}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Sticky top bar */}
        <div
          className="sticky top-0 z-30 pt-4 pb-2 px-4"
          style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          {/* Mobile tab switcher (hidden on desktop) */}
          <div className="flex items-center justify-between mb-3 lg:hidden">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Discover</h1>
            <div className="flex gap-2">
              {TABS.map(tab => {
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

          {/* Desktop title */}
          <div className="hidden lg:flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {activeTab === "apps"
                  ? (category ? CATEGORIES.find(c => c.id === category)?.label : "Apps & Tools")
                  : "Did You Know"}
              </h1>
              {activeTab === "apps" && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>
                  {items.length} apps & tools curated for you
                </p>
              )}
            </div>
          </div>

          {/* Search bar */}
          {activeTab === "apps" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); }}
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

          {/* Mobile category pills */}
          {activeTab === "apps" && (
            <div className="flex gap-2 pt-3 overflow-x-auto scrollbar-hide lg:hidden">
              {CATEGORIES.map(c => {
                const isActive = category === c.id;
                return (
                  <button
                    key={String(c.id)}
                    onClick={() => setCategory(c.id)}
                    className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all chip"
                    style={{
                      backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                      color: isActive ? "#fff" : "var(--text-secondary)",
                      border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
                      boxShadow: isActive ? "0 2px 8px rgba(46,107,79,0.3)" : "none",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tab content */}
        <div className="pt-3 flex-1">
          {activeTab === "apps" ? (
            <DiscoverAppsTabNew
              items={items}
              isLoading={isLoading}
              search={search}
              user={user}
              onItemClick={setSelectedItem}
              category={category}
              onCategoryChange={setCategory}
              hideCategoryPills // pills now handled above
            />
          ) : (
            <DYKTab user={user} />
          )}
        </div>
      </div>

      {/* ── Desktop right spotlight panel ── */}
      {activeTab === "apps" && <DesktopSpotlightPanel items={items} />}

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