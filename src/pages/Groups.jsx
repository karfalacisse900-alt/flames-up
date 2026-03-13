import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Layers3, Users } from "lucide-react";
import PageIntroCard from "@/components/shared/PageIntroCard";
import GroupCard from "@/components/groups/GroupCard";

export default function Groups() {
  const { data: groups = [] } = useQuery({
    queryKey: ["groups-redesign"],
    queryFn: () => base44.entities.Group.list("-created_date", 24),
    initialData: [],
  });

  const featured = groups.slice(0, 2);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-6">
      <PageIntroCard eyebrow="Groups redesign" title="More breathing room for communities" description="A complete visual refresh for groups with cleaner cards, softer depth, and clearer hierarchy for browsing on any screen." />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border p-6 md:p-7" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            <Layers3 className="h-3.5 w-3.5" /> Featured communities
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {featured.map((group) => <GroupCard key={group.id} group={group} />)}
          </div>
        </div>

        <div className="rounded-[30px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-1)" }}>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: "var(--accent-secondary)" }} />
            <h3 className="h4" style={{ color: "var(--text-primary)" }}>Group browsing, simplified</h3>
          </div>
          <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
            The page now uses wider cards, clearer sections, cleaner buttons, and softer surfaces so discovering communities feels less crowded and much more premium.
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => <GroupCard key={group.id} group={group} />)}
      </section>
    </div>
  );
}