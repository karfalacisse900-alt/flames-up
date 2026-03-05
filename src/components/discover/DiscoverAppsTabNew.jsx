import React, { useState, useMemo } from "react";
import { Search, X, ChevronDown, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DiscoverLogo from "./DiscoverLogo";
import StarRating from "./StarRating";
import BookmarkButton from "./BookmarkButton";
import SubmitAppModal from "./SubmitAppModal.jsx";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { id: "productivity",    label: "⚡ Productivity", examples: "Task managers, Note-taking, Project tools" },
  { id: "finance",         label: "💰 Finance", examples: "Budgeting, Investment, Banking" },
  { id: "learning",        label: "📚 Learning", examples: "Courses, Languages, Tutorials" },
  { id: "lifestyle",       label: "🌿 Lifestyle", examples: "Fitness, Wellness, Travel" },
  { id: "entertainment",   label: "🎬 Entertainment", examples: "Streaming, Gaming, Music" },
  { id: "health",          label: "💪 Health", examples: "Fitness, Mental health, Nutrition" },
  { id: "social",          label: "👥 Social", examples: "Messaging, Communities, Networking" },
  { id: "developer_tools", label: "🛠️ Dev Tools", examples: "Code editors, Testing, APIs" },
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
          <div className="flex flex-col gap-0.5">
            <h3 className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
              {item.title}
            </h3>
            {item.brand_name && (
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                {item.brand_name}
              </p>
            )}
          </div>
        </div>
        {user && (
          <div onClick={e => e.stopPropagation()}>
            <BookmarkButton user={user} itemType="app" itemId={item.id} itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} />
          </div>
        )}
      </div>

      {/* Full description (longer) */}
      <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {item.long_description || item.description}
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
        {item.tags?.slice(0, 2).map((tag, i) => (
          <span key={i} className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            {tag}
          </span>
        ))}
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
  const [category, setCategory] = useState(null);
  const [localSearch, setLocalSearch] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  const filtered = useMemo(() => {
    let result = items.filter(item => {
      const catMatch = !category || item.category === category;
      const searchTerm = (search || localSearch).toLowerCase();
      const searchMatch = !searchTerm ||
        item.title?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.long_description?.toLowerCase().includes(searchTerm) ||
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
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
        <input
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          placeholder="Search by name, keyword..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        />
        {localSearch && (
          <button onClick={() => setLocalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {/* Categories dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border"
            style={{
              backgroundColor: category ? "var(--accent-primary)" : "var(--bg-card)",
              color: category ? "#fff" : "var(--text-secondary)",
              borderColor: category ? "var(--accent-primary)" : "var(--border-light)",
            }}
          >
            {category ? CATEGORIES.find(c => c.id === category)?.label : "📂 Categories"}
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showCategories && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 rounded-xl z-40 shadow-lg p-2"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
              >
                <button
                  onClick={() => { setCategory(null); setShowCategories(false); }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
                  style={{ color: "var(--text-primary)", backgroundColor: !category ? "var(--accent-primary-light)" : "transparent" }}
                >
                  All Categories
                </button>
                {CATEGORIES.map(c => (
                   <button
                     key={c.id}
                     onClick={() => { setCategory(c.id); setShowCategories(false); }}
                     className="block w-full text-left px-3 py-2 rounded-lg transition-all"
                     style={{ color: "var(--text-primary)", backgroundColor: category === c.id ? "var(--accent-primary-light)" : "transparent" }}
                   >
                     <div className="text-xs font-medium">{c.label}</div>
                     <div className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>{c.examples || ""}</div>
                   </button>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit app button */}
        {user && (
          <button
            onClick={() => setShowSubmit(true)}
            className="ml-auto flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold text-white whitespace-nowrap transition-all shrink-0"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <Plus className="w-3 h-3" /> Submit
          </button>
        )}
      </div>

      {/* Grid of app cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No apps found</p>
        </div>
      ) : (
         <div className="space-y-3">
           {filtered.map((item, i) => (
             <div key={item.id} onClick={() => onItemClick(item)} className="rounded-2xl p-4 cursor-pointer transition-all active:scale-95 relative overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
               {item.is_featured && (
                 <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "#FFD700", color: "#1a1a1a" }}>
                   ⭐ Featured
                 </div>
               )}
               {item.is_sponsored && (
                 <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "var(--accent-secondary)", color: "#fff" }}>
                   💎 Premium
                 </div>
               )}
               <div className="flex items-start gap-3 mb-2">
                 <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
                   <DiscoverLogo item={item} size="md" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                     {item.title}
                   </h3>
                   {item.brand_name && (
                     <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                       {item.brand_name}
                     </p>
                   )}
                 </div>
                 {user && (
                   <div onClick={e => e.stopPropagation()}>
                     <BookmarkButton user={user} itemType="app" itemId={item.id} itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} />
                   </div>
                 )}
               </div>
               <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                 {item.description}
               </p>
               <div className="flex items-center justify-between">
                 {item.pricing && (
                   <span className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                     {item.pricing}
                   </span>
                 )}
                 {(item.avg_rating || 0) > 0 && (
                   <StarRating value={item.avg_rating || 0} showCount count={item.review_count || 0} />
                 )}
               </div>
             </div>
           ))}
         </div>
       )}

      {showSubmit && (
        <SubmitAppModal
          user={user}
          onClose={() => setShowSubmit(false)}
          onSubmitted={() => { setShowSubmit(false); }}
        />
      )}
    </div>
  );
}