import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, TrendingUp, Clock, Search } from "lucide-react";
import DYKCard from "../components/dyk/DYKCard";
import DYKSubmitModal from "../components/dyk/DYKSubmitModal";

const CATEGORIES = [
  { value: "all",           label: "✨ All" },
  { value: "save_money",    label: "💰 Save Money" },
  { value: "apps_tech",     label: "📱 Apps & Tech" },
  { value: "travel",        label: "🌎 Travel" },
  { value: "city_services", label: "🏙 City Services" },
  { value: "entertainment", label: "🎬 Entertainment" },
  { value: "jobs",          label: "💼 Jobs & Opportunities" },
];

export default function DidYouKnow() {
  const [user, setUser] = useState(null);
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("trending"); // trending | recent
  const [search, setSearch] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    load();
  }, []);

  async function load() {
    setLoading(true);
    const all = await base44.entities.DidYouKnow.filter({ status: "approved" }, "-useful_count", 100);
    setFacts(all);
    setLoading(false);
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
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary, #f9fafb)" }}>
      {/* Hero */}
      <div className="px-4 pt-6 pb-4 text-center" style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
        <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-3">
          <span className="text-white text-xs font-semibold tracking-wider">DISCOVERY HUB</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-1">💡 Did You Know?</h1>
        <p className="text-white/80 text-sm max-w-sm mx-auto">
          Useful facts that help you save money, find free services, and discover hidden gems.
        </p>

        {/* Search */}
        <div className="mt-4 max-w-sm mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search facts..."
            className="w-full pl-9 pr-4 py-2.5 rounded-full text-sm outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
          />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-3 pb-24">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={{
                backgroundColor: category === c.value ? "var(--accent-primary, #6366f1)" : "var(--bg-card, #fff)",
                color: category === c.value ? "#fff" : "var(--text-secondary, #6b7280)",
                border: "1px solid var(--border-light, #e5e7eb)",
              }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSort("trending")}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            style={{
              backgroundColor: sort === "trending" ? "var(--accent-primary, #6366f1)" : "var(--bg-card, #fff)",
              color: sort === "trending" ? "#fff" : "var(--text-secondary, #6b7280)",
              border: "1px solid var(--border-light, #e5e7eb)",
            }}>
            <TrendingUp className="w-3 h-3" /> Trending
          </button>
          <button
            onClick={() => setSort("recent")}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            style={{
              backgroundColor: sort === "recent" ? "var(--accent-primary, #6366f1)" : "var(--bg-card, #fff)",
              color: sort === "recent" ? "#fff" : "var(--text-secondary, #6b7280)",
              border: "1px solid var(--border-light, #e5e7eb)",
            }}>
            <Clock className="w-3 h-3" /> Recent
          </button>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-card, #fff)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💡</p>
            <p className="font-semibold" style={{ color: "var(--text-primary, #111)" }}>No facts yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary, #6b7280)" }}>
              {search ? "Try a different search." : "Be the first to share something!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(fact => (
              <DYKCard key={fact.id} fact={fact} user={user} onVoted={load} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {user && (
        <button
          onClick={() => setShowSubmit(true)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <Plus className="w-6 h-6 text-white" />
        </button>
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