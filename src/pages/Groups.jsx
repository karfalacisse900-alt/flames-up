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

  const featured = groups.slice(0, 5);
  const categories = useMemo(() => Array.from(new Set(groups.map((group) => group.category).filter(Boolean))).slice(0, 4), [groups]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <PageIntroCard eyebrow="Groups redesign" title="This feels more like a community hub" description="I rebuilt the page with a broader, more visual layout so it doesn’t read like a plain stacked list of groups anymore." />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[34px] border p-6 md:p-8" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            <Layers3 className="h-3.5 w-3.5" /> Featured communities
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((group, index) => (
              <div key={group.id} className={index === 0 ? "md:col-span-2 xl:row-span-2" : ""}>
                <GroupCard group={group} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[30px] border p-6" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.10), rgba(20,184,166,0.08))", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.72)", color: "var(--accent-primary)" }}>
              <Sparkles className="h-3.5 w-3.5" /> Cleaner browsing
            </div>
            <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>Bigger cards, mixed sizing, and visual blocks make this page feel more alive and less repetitive.</p>
          </div>
          <div className="rounded-[30px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-1)" }}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: "var(--accent-secondary)" }} />
              <h3 className="h4" style={{ color: "var(--text-primary)" }}>Popular categories</h3>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <div key={category} className="rounded-full px-3 py-2 text-sm font-semibold capitalize" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{category}</div>
              ))}
            </div>
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