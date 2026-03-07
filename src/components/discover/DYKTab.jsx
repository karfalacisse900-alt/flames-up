import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Clock, Search, X, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import DYKCard from "../dyk/DYKCard";
import DYKSubmitModal from "../dyk/DYKSubmitModal";

const CATEGORIES = [
  { value: null,           label: "✨ All" },
  { value: "save_money",   label: "💰 Finance" },
  { value: "apps_tech",    label: "📱 Tech" },
  { value: "travel",       label: "🌎 World" },
  { value: "city_services",label: "🏙 City" },
  { value: "entertainment",label: "🎬 Entertainment" },
  { value: "jobs",         label: "🔬 Science" },
];

let factsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export default function DYKTab({ user }) {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState("trending");
  const [search, setSearch] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (factsCache && Date.now() - lastFetchTime < CACHE_DURATION) {
      setFacts(factsCache);
      setLoading(false);
      return;
    }
    load().finally(() => setLoading(false));
  }, []);

  async function load() {
    try {
      const all = await base44.entities.DidYouKnow.filter({ status: "approved" }, "-useful_count", 50);
      factsCache = all;
      lastFetchTime = Date.now();
      setFacts(all);
    } catch {
      if (factsCache) setFacts(factsCache);
    }
  }

  const filtered = facts
    .filter(f => category === null || f.category === category)
    .filter(f => !search || f.content?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "trending") {
        const sA = (a.useful_count || 0) + (a.didnt_know_count || 0) * 2 + (a.comment_count || 0);
        const sB = (b.useful_count || 0) + (b.didnt_know_count || 0) * 2 + (b.comment_count || 0);
        return sB - sA;
      }
      return new Date(b.created_date) - new Date(a.created_date);
    });

  // Infinite scroll
  const observerRef = useCallback(node => {
    if (!node) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(v => v + 8);
    }, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const visibleFacts = filtered.slice(0, visibleCount);

  return (
    <div className="pb-20">
      {/* ── Category pills ── */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(c => {
          const isActive = category === c.value;
          return (
            <button
              key={String(c.value)}
              onClick={() => { setCategory(c.value); setVisibleCount(10); }}
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

      <div className="px-4">
        {/* ── Search ── */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setVisibleCount(10); }}
            placeholder="Search facts..."
            className="w-full pl-9 pr-9 py-2.5 rounded-2xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
            </button>
          )}
        </div>

        {/* ── Sort + Submit row ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {search ? `"${search}"` : category ? CATEGORIES.find(c => c.value === category)?.label : "All Facts"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>· {filtered.length}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sort pills */}
            <button
              onClick={() => setSort("trending")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                backgroundColor: sort === "trending" ? "var(--accent-primary)" : "var(--bg-card)",
                color: sort === "trending" ? "#fff" : "var(--text-secondary)",
                borderColor: sort === "trending" ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              <TrendingUp className="w-3 h-3" /> Trending
            </button>
            <button
              onClick={() => setSort("recent")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                backgroundColor: sort === "recent" ? "var(--accent-primary)" : "var(--bg-card)",
                color: sort === "recent" ? "#fff" : "var(--text-secondary)",
                borderColor: sort === "recent" ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              <Clock className="w-3 h-3" /> New
            </button>
            {user && (
              <button
                onClick={() => setShowSubmit(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                <Plus className="w-3 h-3" /> Submit
              </button>
            )}
          </div>
        </div>

        {/* ── Feed ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💡</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No facts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleFacts.map(fact => (
              <DYKCard key={fact.id} fact={fact} user={user} onVoted={load} />
            ))}
            {visibleCount < filtered.length && (
              <div ref={observerRef} className="h-8 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: "var(--border-medium)", borderTopColor: "var(--accent-primary)" }} />
              </div>
            )}
          </div>
        )}
      </div>

      {showSubmit && (
        <DYKSubmitModal user={user} onClose={() => setShowSubmit(false)} onSubmitted={load} />
      )}
    </div>
  );
}