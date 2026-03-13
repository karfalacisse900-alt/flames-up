import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Layers3, Sparkles, Users } from "lucide-react";
import PageIntroCard from "@/components/shared/PageIntroCard";
import GroupCard from "@/components/groups/GroupCard";

export default function Groups() {
  const { data: groups = [] } = useQuery({
    queryKey: ["groups-redesign"],
    queryFn: () => base44.entities.Group.list("-created_date", 24),
    initialData: [],
  });

  const featured = groups.slice(0, 6);
  const categories = useMemo(() => Array.from(new Set(groups.map((group) => group.category).filter(Boolean))).slice(0, 5), [groups]);
  const hero = featured[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <PageIntroCard eyebrow="Groups redesign" title="Now it actually feels different" description="This page now behaves like a visual community hub with a big hero, mixed card sizes, and a masonry layout instead of repeated vertical rows." />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[36px] border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-3)" }}>
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 md:p-8" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(20,184,166,0.10), rgba(255,255,255,0.94))" }}>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.78)", color: "var(--accent-primary)" }}>
                <Layers3 className="h-3.5 w-3.5" /> Community spotlight
              </div>
              <h2 className="mt-6 h2" style={{ color: "var(--text-primary)" }}>{hero?.name || hero?.title || "Find your next community"}</h2>
              <p className="mt-3 max-w-xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{hero?.description || "Browse communities through a more visual, breathable layout with clearer hierarchy and better card presentation."}</p>
            </div>
            <div className="grid gap-4 p-6 md:p-8">
              <div className="rounded-[28px] border p-5" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Total groups</div>
                <div className="mt-4 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{groups.length}</div>
              </div>
              <div className="rounded-[28px] border p-5" style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(255,255,255,0.92))", borderColor: "rgba(148,163,184,0.16)" }}>
                <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}><Sparkles className="h-4 w-4" /> Mixed-size layout</div>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>Less repetition, more emphasis, and better visual rhythm.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[34px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: "var(--accent-secondary)" }} />
            <h3 className="h4" style={{ color: "var(--text-primary)" }}>Popular categories</h3>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <div key={category} className="rounded-full px-3 py-2 text-sm font-semibold capitalize" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{category}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="masonry-grid">
        {groups.map((group) => (
          <div key={group.id} className="masonry-item">
            <GroupCard group={group} />
          </div>
        ))}
      </section>
    </div>
  );
}