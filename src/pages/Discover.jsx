import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Compass, Search } from "lucide-react";
import PageIntroCard from "@/components/shared/PageIntroCard";
import DiscoverItemCard from "@/components/discover/DiscoverItemCard";

export default function Discover() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: items = [] } = useQuery({
    queryKey: ["discover-redesign"],
    queryFn: async () => {
      const all = await base44.entities.DiscoverItem.list("-updated_date", 36);
      return all.filter((item) => item.is_approved !== false);
    },
    initialData: [],
  });

  const categories = useMemo(() => ["all", ...Array.from(new Set(items.map((item) => item.category).filter(Boolean)))], [items]);
  const filtered = useMemo(() => items.filter((item) => {
    const searchMatch = `${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase());
    const categoryMatch = category === "all" || item.category === category;
    return searchMatch && categoryMatch;
  }), [items, search, category]);
  const featured = filtered.find((item) => item.is_featured) || filtered[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-6">
      <PageIntroCard eyebrow="Discover redesign" title="Cleaner discovery, better focus" description="This version uses calmer color balance, stronger typography, cleaner cards, and softer motion so browsing feels more modern and easier on the eyes." />

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[30px] border p-6 md:p-7" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-hint)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools, ideas, and recommendations" className="w-full pl-11 pr-4 py-3 text-sm" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className="px-3 py-2 text-sm font-semibold capitalize" style={{ backgroundColor: category === item ? "var(--accent-primary)" : "var(--bg-subtle)", color: category === item ? "white" : "var(--text-secondary)", boxShadow: category === item ? "var(--elevation-1)" : "none" }}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {featured ? (
          <div className="rounded-[30px] border p-6" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.10), rgba(20,184,166,0.12))", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "var(--accent-primary)" }}>
              <Compass className="h-3.5 w-3.5" /> Featured pick
            </div>
            <h2 className="mt-4 h3" style={{ color: "var(--text-primary)" }}>{featured.title}</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{featured.long_description || featured.description}</p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => <DiscoverItemCard key={item.id} item={item} />)}
      </section>
    </div>
  );
}