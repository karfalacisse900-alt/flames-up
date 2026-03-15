import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { usePullToRefresh } from "@/components/hooks/usePullToRefresh";
import { Search, X, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import DiscoverSection from "@/components/discover/DiscoverSection";
import AppPreviewDrawer from "@/components/discover/AppPreviewDrawer";
import CreatorsTab from "@/components/discover/CreatorsTab";
import DYKTab from "@/components/discover/DYKTab";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Discover() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("apps");
  const [selectedItem, setSelectedItem] = useState(null);
  const [view, setView] = useState("explore");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    return () => {
      setSelectedItem(null);
      document.body.style.overflow = "";
    };
  }, []);

  // Fetch all items
  const { data: allItems = [], isLoading, refetch } = useQuery({
    queryKey: ["discoverItems"],
    queryFn: () => base44.entities.DiscoverItem.filter({ is_approved: true }, "-avg_rating", 200),
  });

  // Filter by search
  const filteredItems = search.trim()
    ? allItems.filter(item =>
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase())
      )
    : allItems;

  // Categorize items
  const featured = allItems.filter(i => i.is_featured);
  const newItems = allItems.filter(i => i.is_new);
  const productivity = allItems.filter(i => i.category === "productivity");
  const aiTools = allItems.filter(i => i.tags?.includes("AI-powered") || i.category === "developer_tools");
  const studentTools = allItems.filter(i => i.category === "learning");
  const entertainment = allItems.filter(i => i.category === "entertainment");
  const finance = allItems.filter(i => i.category === "finance");
  const trending = allItems.slice(0, 15);

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

  const doRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { containerRef, PullIndicator, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(doRefresh);

  // Search results view
  if (view === "browse" && activeTab === "apps") {
    return (
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="min-h-screen pb-20"
        style={{ backgroundColor: "var(--bg-app)" }}>
        <PullIndicator />

        <div className="sticky top-0 z-30 px-4 pt-4 pb-3 safe-top" 
          style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)", backdropFilter: "blur(16px)" }}>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => { setView("explore"); setSearch(""); }}
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: "var(--text-secondary)" }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

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
        </div>

        <div className="px-4 py-4">
          <p className="text-sm mb-4" style={{ color: "var(--text-hint)" }}>
            {filteredItems.length} results for "{search}"
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="rounded-2xl overflow-hidden transition-all active:scale-95"
                style={{
                  aspectRatio: "1/1",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}>
                {item.logo_url ? (
                  <img src={item.logo_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                    <span className="text-3xl">{item.title?.[0] || "?"}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedItem && (
          <AppPreviewDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen pb-20"
      style={{ backgroundColor: "var(--bg-app)" }}>
      <PullIndicator />

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3 safe-top"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)", backdropFilter: "blur(16px)" }}>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: "var(--text-hint)" }}>
              {getGreeting()}{firstName ? `, ${firstName}` : ""} ✦
            </p>
            <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              Discover
            </h1>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-3">
          {[
            { id: "apps", label: "🧰 Apps & Tools" },
            { id: "creators", label: "⭐ Creators" },
            { id: "dyk", label: "💡 Did You Know" },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold transition-all"
                style={{
                  backgroundColor: isActive ? "#1E1E1E" : "var(--bg-card)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  border: `1.5px solid ${isActive ? "#1E1E1E" : "var(--border-light)"}`,
                  boxShadow: isActive ? "0 4px 14px rgba(0,0,0,0.2)" : "none",
                  letterSpacing: "-0.2px",
                }}>
                {tab.label}
              </button>
            );
          })}
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

      {/* Content */}
      <div className="pt-2">
        {activeTab === "creators" ? (
          <CreatorsTab />
        ) : activeTab === "dyk" ? (
          <DYKTab user={user} />
        ) : (
          <div className="pb-6">
            <DiscoverSection
              title="⭐ Featured"
              subtitle="Hand-picked apps and tools"
              items={featured}
              cardType="wide"
              onItemClick={setSelectedItem}
            />

            <DiscoverSection
              title="✨ New & Noteworthy"
              subtitle="Fresh releases this week"
              items={newItems}
              cardType="tall"
              onItemClick={setSelectedItem}
            />

            <DiscoverSection
              title="💼 Productivity"
              subtitle="Get more done"
              items={productivity}
              cardType="square"
              onItemClick={setSelectedItem}
            />

            <DiscoverSection
              title="🤖 AI-Powered Tools"
              subtitle="Smart apps & automation"
              items={aiTools}
              cardType="wide"
              onItemClick={setSelectedItem}
            />

            <DiscoverSection
              title="🎓 Student Tools"
              subtitle="Learning & education"
              items={studentTools}
              cardType="tall"
              onItemClick={setSelectedItem}
            />

            <DiscoverSection
              title="💰 Finance & Money"
              subtitle="Manage your finances"
              items={finance}
              cardType="square"
              onItemClick={setSelectedItem}
            />

            <DiscoverSection
              title="🎮 Entertainment"
              subtitle="Fun & games"
              items={entertainment}
              cardType="wide"
              onItemClick={setSelectedItem}
            />

            <DiscoverSection
              title="🔥 Trending Now"
              subtitle="Most popular this month"
              items={trending}
              cardType="tall"
              onItemClick={setSelectedItem}
            />
          </div>
        )}
      </div>

      {/* Preview Drawer */}
      {selectedItem && (
        <AppPreviewDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}