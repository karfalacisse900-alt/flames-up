import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Compass, Search, Sparkles } from "lucide-react";
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
  const spotlight = filtered.slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <PageIntroCard eyebrow="Discover redesign" title="This is a cleaner discovery canvas" description="I rebuilt Discover with a proper hero, spotlight tiles, and masonry results so it feels curated instead of flat and repetitive." />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[36px] border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-3)" }}>
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 md:p-8" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(20,184,166,0.10), rgba(255,255,255,0.94))" }}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-hint)" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools, ideas, and recommendations" className="w-full pl-11 pr-4 py-3 text-sm" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button key={item} onClick={() => setCategory(item)} className="px-3 py-2 text-sm font-semibold capitalize" style={{ backgroundColor: category === item ? "var(--accent-primary)" : "rgba(255,255,255,0.72)", color: category === item ? "white" : "var(--text-secondary)", boxShadow: category === item ? "var(--elevation-1)" : "none" }}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                <Compass className="h-3.5 w-3.5" /> Discovery mood
              </div>
              <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>Bigger visual blocks, less clutter, softer hierarchy, and a proper sense of editorial curation.</p>
            </div>
          </div>
        </div>

        {featured ? (
          <div className="rounded-[34px] border p-6" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(20,184,166,0.10))", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.74)", color: "var(--accent-primary)" }}>
              <Sparkles className="h-3.5 w-3.5" /> Featured pick
            </div>
            <h2 className="mt-4 h3" style={{ color: "var(--text-primary)" }}>{featured.title}</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{featured.long_description || featured.description}</p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {spotlight.map((item, index) => (
          <div key={item.id} className={index === 0 ? "md:col-span-2 xl:col-span-2" : ""}>
            <div className="rounded-[28px] border p-5 h-full" style={{ background: index === 0 ? "linear-gradient(135deg, rgba(79,70,229,0.10), rgba(20,184,166,0.08))" : "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-1)" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>{item.category}</div>
              <h3 className="mt-3 h4" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{(item.long_description || item.description || "").slice(0, index === 0 ? 200 : 100)}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="masonry-grid">
        {filtered.map((item) => (
          <div key={item.id} className="masonry-item">
            <DiscoverItemCard item={item} />
          </div>
        ))}
      </section>
    </div>
  );
}