import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Clock, Search, X, ChevronDown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import DYKCard from "../dyk/DYKCard";
import DYKSubmitModal from "../dyk/DYKSubmitModal";

const CATEGORIES = [
  { value: "save_money",    label: "💰 Save Money" },
  { value: "apps_tech",     label: "📱 Apps & Tech" },
  { value: "travel",        label: "🌎 Travel" },
  { value: "city_services", label: "🏙 City Services" },
  { value: "entertainment", label: "🎬 Entertainment" },
  { value: "jobs",          label: "💼 Jobs & Opportunities" },
];

export default function DYKTab({ user }) {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState("trending");
  const [search, setSearch] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    load().then(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  async function load() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const all = await base44.entities.DidYouKnow.filter({ status: "approved" }, "-useful_count", 50);
      setFacts(all);
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = facts
    .filter(f => !category || f.category === category)
    .filter(f => !search || f.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "trending") {
        const scoreA = (a.useful_count || 0) + (a.didnt_know_count || 0) * 2 + (a.comment_count || 0);
        const scoreB = (b.useful_count || 0) + (b.didnt_know_count || 0) * 2 + (b.comment_count || 0);
        return scoreB - scoreA;
      }
      return new Date(b.created_date) - new Date(a.created_date);
    });

  return (
    <div className="px-4 py-3 pb-20">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search facts..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
        {/* Categories dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
            style={{
              backgroundColor: category ? "var(--accent-primary)" : "var(--bg-card)",
              color: category ? "#fff" : "var(--text-secondary)",
              borderColor: category ? "var(--accent-primary)" : "var(--border-light)",
            }}>
            {category ? CATEGORIES.find(c => c.value === category)?.label : "📂 Topics"}
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
                  All Topics
                </button>
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => { setCategory(c.value); setShowCategories(false); }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
                    style={{ color: "var(--text-primary)", backgroundColor: category === c.value ? "var(--accent-primary-light)" : "transparent" }}
                  >
                    {c.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort buttons */}
        <button
          onClick={() => setSort("trending")}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-all border shrink-0"
          style={{
            backgroundColor: sort === "trending" ? "var(--accent-primary)" : "var(--bg-card)",
            color: sort === "trending" ? "#fff" : "var(--text-secondary)",
            borderColor: sort === "trending" ? "var(--accent-primary)" : "var(--border-light)",
          }}>
          <TrendingUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => setSort("recent")}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-all border shrink-0"
          style={{
            backgroundColor: sort === "recent" ? "var(--accent-primary)" : "var(--bg-card)",
            color: sort === "recent" ? "#fff" : "var(--text-secondary)",
            borderColor: sort === "recent" ? "var(--accent-primary)" : "var(--border-light)",
          }}>
          <Clock className="w-3 h-3" />
        </button>

        {/* Submit button */}
        {user && (
          <button
            onClick={() => setShowSubmit(true)}
            className="ml-auto flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-all text-white shrink-0"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            <Plus className="w-3 h-3" /> Submit
          </button>
        )}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">💡</p>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No facts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(fact => (
            <DYKCard key={fact.id} fact={fact} user={user} onVoted={load} />
          ))}
        </div>
      )}

      {showSubmit && (
        <DYKSubmitModal
          user={user}
          onClose={() => setShowSubmit(false)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}