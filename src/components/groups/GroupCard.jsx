import React from "react";
import { Users, ArrowRight } from "lucide-react";

export default function GroupCard({ group }) {
  const title = group?.name || group?.title || "Community Group";
  const description = group?.description || "A curated space for people with shared interests, conversations, and ongoing activity.";
  const category = group?.category || "community";
  const members = group?.member_count || group?.members_count || group?.participant_count || 0;

  return (
    <div className="overflow-hidden rounded-[30px] border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
      <div className="relative h-36 p-5" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(20,184,166,0.12) 55%, rgba(255,255,255,0.9))" }}>
        <div className="absolute right-4 top-4 h-16 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
        <span className="relative z-10 rounded-full px-3 py-1 text-xs font-semibold capitalize" style={{ backgroundColor: "rgba(255,255,255,0.76)", color: "var(--text-primary)" }}>{category}</span>
      </div>
      <div className="space-y-4 p-5">
        <h3 className="h4" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{description}</p>
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            <Users className="h-3.5 w-3.5" /> {members} members
          </div>
          <button className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            Explore <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}