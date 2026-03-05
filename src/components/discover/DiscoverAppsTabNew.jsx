import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";
import StarRating from "./StarRating";
import BookmarkButton from "./BookmarkButton";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { id: "all",             label: "✨ All" },
  { id: "productivity",    label: "⚡ Productivity" },
  { id: "finance",         label: "💰 Finance" },
  { id: "learning",        label: "📚 Learning" },
  { id: "lifestyle",       label: "🌿 Lifestyle" },
  { id: "entertainment",   label: "🎬 Entertainment" },
  { id: "health",          label: "💪 Health" },
  { id: "social",          label: "👥 Social" },
  { id: "developer_tools", label: "🛠️ Dev Tools" },
];

function AppCard({ item, user, onOpen, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl p-4 transition-all active:scale-95"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Logo and header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <DiscoverLogo item={item} size="md" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-tight truncate" style={{ color: "var(--text-primary)" }}>
            {item.title}
          </h3>
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-hint)" }}>
            {item.brand_name || item.category?.replace(/_/g, " ")}
          </p>
        </div>
        {user && (
          <div onClick={e => e.stopPropagation()}>
            <BookmarkButton user={user} itemType="app" itemId={item.id} itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} />
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs line-clamp-2 mb-3" style={{ color: "var(--text-secondary)" }}>
        {item.description}
      </p>

      {/* Tags and pricing */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {item.pricing && (
          <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            {item.pricing}
          </span>
        )}
        {item.is_new && (
          <span className="text-[10px] px-2 py-1 rounded-full font-bold text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
            NEW
          </span>
        )}
        {item.tags?.[0] && (
          <span className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            {item.tags[0]}
          </span>
        )}
      </div>

      {/* Rating and CTA */}
      <div className="flex items-center justify-between">
        {(item.avg_rating || 0) > 0 && (
          <StarRating value={item.avg_rating || 0} showCount count={item.review_count || 0} />
        )}
        <div className="flex-1" />
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-transform hover:scale-105"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            Open
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function DiscoverAppsTabNew({ items, isLoading, search, user, onItemClick }) {
  const [category, setCategory] = useState("all");
  const [localSearch, setLocalSearch] = useState("");

  const filtered = useMemo(() => {
    let result = items.filter(item => {
      const catMatch = category === "all" || item.category === category;
      const searchTerm = (search || localSearch).toLowerCase();
      const searchMatch = !searchTerm ||
        item.title?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.brand_name?.toLowerCase().includes(searchTerm) ||
        item.tags?.some(t => t.toLowerCase().includes(searchTerm));
      return catMatch && searchMatch;
    });

    // Sort: featured first, then by rating
    return result.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
      return (b.avg_rating || 0) - (a.avg_rating || 0);
    });
  }, [items, category, search, localSearch]);

  if (isLoading) {
    return (
      <div className="px-4 pt-4 pb-20">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-20">
      {/* Search in this tab */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
        <input
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          placeholder="Search apps..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        />
        {localSearch && (
          <button onClick={() => setLocalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 overflow-x-auto mb-5 pb-2 scrollbar-hide">
        {CATEGORIES.map(c => {
          const isActive = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border"
              style={{
                backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                borderColor: isActive ? "var(--accent-primary)" : "var(--border-light)",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Grid of app cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No apps found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item, i) => (
            <AppCard
              key={item.id}
              item={item}
              user={user}
              index={i}
              onOpen={() => onItemClick(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}