import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Clock, Search } from "lucide-react";
import DYKCard from "../dyk/DYKCard";
import DYKSubmitModal from "../dyk/DYKSubmitModal";

const CATEGORIES = [
  { value: "all",           label: "✨ All" },
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
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("trending");
  const [search, setSearch] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
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
    .filter(f => category === "all" || f.category === category)
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
    <div className="px-4 py-3">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search facts..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            style={{
              backgroundColor: category === c.value ? "var(--accent-primary)" : "var(--bg-card)",
              color: category === c.value ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border-light)",
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setSort("trending")}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
          style={{
            backgroundColor: sort === "trending" ? "var(--accent-primary)" : "var(--bg-card)",
            color: sort === "trending" ? "#fff" : "var(--text-secondary)",
            border: "1px solid var(--border-light)",
          }}>
          <TrendingUp className="w-3 h-3" /> Trending
        </button>
        <button
          onClick={() => setSort("recent")}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
          style={{
            backgroundColor: sort === "recent" ? "var(--accent-primary)" : "var(--bg-card)",
            color: sort === "recent" ? "#fff" : "var(--text-secondary)",
            border: "1px solid var(--border-light)",
          }}>
          <Clock className="w-3 h-3" /> Recent
        </button>
        {user && (
          <button
            onClick={() => setShowSubmit(true)}
            className="ml-auto text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            style={{
              backgroundColor: "var(--accent-primary)",
              color: "#fff",
            }}>
            + Submit
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