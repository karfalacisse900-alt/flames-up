import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Trash2, ExternalLink, Grid3X3, Music, Film, MapPin, Zap, FolderOpen, ChevronRight, X, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TAB_CONFIG = [
  { id: "all",   label: "All",    icon: Grid3X3 },
  { id: "app",   label: "Apps",   icon: Zap },
  { id: "media", label: "Media",  icon: Film },
  { id: "place", label: "Places", icon: MapPin },
  { id: "music", label: "Music",  icon: Music },
];

const TYPE_COLORS = {
  app:   { from: "#667EEA", to: "#764BA2", bg: "#667EEA18", label: "App" },
  media: { from: "#E5A00D", to: "#F9730D", bg: "#E5A00D18", label: "Media" },
  place: { from: "#4285F4", to: "#0066CC", bg: "#4285F418", label: "Place" },
  music: { from: "#1DB954", to: "#17a34a", bg: "#1DB95418", label: "Music" },
  book:  { from: "#0078D4", to: "#005a9e", bg: "#0078D418", label: "Book" },
  game:  { from: "#1B2838", to: "#2a475e", bg: "#1B283820", label: "Game" },
};

function LibraryItemCard({ item, onRemove }) {
  const cc = TYPE_COLORS[item.item_type] || TYPE_COLORS.app;

  const handleClick = () => {
    if (item.item_type === "place" && item.item_subtitle) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.item_title)}`, "_blank");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
    >
      {/* Image / icon */}
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${cc.from}20, ${cc.to}30)` }}>
        {item.item_image_url ? (
          <img src={item.item_image_url} alt={item.item_title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">
            {item.item_type === "app" ? "⚡" : item.item_type === "place" ? "📍" : item.item_type === "music" ? "🎵" : item.item_type === "book" ? "📖" : item.item_type === "game" ? "🎮" : "🎬"}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={handleClick} style={{ cursor: item.item_type === "place" ? "pointer" : "default" }}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: `linear-gradient(135deg, ${cc.from}, ${cc.to})`, color: "#fff" }}>
            {cc.label}
          </span>
        </div>
        <p className="font-bold text-sm mt-0.5 truncate" style={{ color: "var(--text-primary)" }}>{item.item_title}</p>
        {item.item_subtitle && (
          <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{item.item_subtitle}</p>
        )}
        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>
          Saved {item.created_date ? new Date(item.created_date).toLocaleDateString() : ""}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {item.item_type === "place" && (
          <button
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.item_title)}`, "_blank")}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#4285F418", color: "#4285F4" }}>
            <MapPin className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onRemove(item.id)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function CollectionSection({ collection, items, onRemove }) {
  const [expanded, setExpanded] = useState(true);
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 w-full px-1 mb-2"
      >
        <span className="text-lg">{collection.emoji || "📁"}</span>
        <span className="font-bold text-sm flex-1 text-left" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{collection.name}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>{items.length}</span>
        <ChevronRight className="w-4 h-4 transition-transform" style={{ color: "var(--text-hint)", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
            {items.map(item => <LibraryItemCard key={item.id} item={item} onRemove={onRemove} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MyLibrary() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [groupByCollection, setGroupByCollection] = useState(false);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: collections = [] } = useQuery({
    queryKey: ["myCollections", user?.email],
    queryFn: () => base44.entities.UserCollection.filter({ owner_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["collectionAll", user?.email],
    queryFn: () => base44.entities.CollectionItem.filter({ owner_email: user.email }, "-created_date", 200),
    enabled: !!user?.email,
  });

  const removeMut = useMutation({
    mutationFn: (id) => base44.entities.CollectionItem.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collectionAll", user?.email] });
      qc.invalidateQueries({ queryKey: ["collectionItems", user?.email] });
    },
  });

  const filtered = allItems.filter(item => {
    const typeMatch = activeTab === "all" || item.item_type === activeTab;
    const searchMatch = !search || item.item_title?.toLowerCase().includes(search.toLowerCase()) || item.item_subtitle?.toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  const tabs = TAB_CONFIG.filter(t => t.id === "all" || allItems.some(i => i.item_type === t.id));

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: "var(--bg-subtle)" }}>📚</div>
        <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>My Library</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Sign in to view your saved items</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-5 pb-3" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>My Library</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{allItems.length} saved items</p>
          </div>
          <button
            onClick={() => setGroupByCollection(g => !g)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{ backgroundColor: groupByCollection ? "var(--accent-primary)" : "var(--bg-card)", color: groupByCollection ? "#fff" : "var(--text-secondary)", borderColor: groupByCollection ? "var(--accent-primary)" : "var(--border-light)" }}>
            <FolderOpen className="w-3.5 h-3.5" />
            Collections
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl mb-3"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saved items…"
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: "var(--text-primary)" }} />
          {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} /></button>}
        </div>

        {/* Type tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-all"
                style={{ backgroundColor: active ? "var(--text-primary)" : "var(--bg-card)", color: active ? "var(--bg-app)" : "var(--text-secondary)", borderColor: active ? "var(--text-primary)" : "var(--border-light)" }}>
                <Icon className="w-3 h-3" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔖</div>
            <p className="font-bold text-lg mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Nothing saved yet</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {search ? "No items match your search" : "Bookmark apps, media, and places from Discover"}
            </p>
            <Link to={createPageUrl("Discover")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--accent-primary), #4CAF7D)" }}>
              <Bookmark className="w-4 h-4" /> Browse Discover
            </Link>
          </div>
        ) : groupByCollection ? (
          // Grouped by collection
          <>
            {collections.map(coll => {
              const collItems = filtered.filter(i => i.collection_id === coll.id);
              return <CollectionSection key={coll.id} collection={coll} items={collItems} onRemove={id => removeMut.mutate(id)} />;
            })}
            {/* Uncategorized */}
            {(() => {
              const collIds = new Set(collections.map(c => c.id));
              const uncategorized = filtered.filter(i => !collIds.has(i.collection_id));
              return uncategorized.length > 0 ? (
                <CollectionSection collection={{ emoji: "📌", name: "Saved" }} items={uncategorized} onRemove={id => removeMut.mutate(id)} />
              ) : null;
            })()}
          </>
        ) : (
          // Flat list
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map(item => (
                <LibraryItemCard key={item.id} item={item} onRemove={id => removeMut.mutate(id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}