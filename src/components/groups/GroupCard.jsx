import React from "react";
import { Users, ArrowRight } from "lucide-react";

export default function GroupCard({ group }) {
  const title = group?.name || group?.title || "Community Group";
  const description = group?.description || "A curated space for people with shared interests, conversations, and ongoing activity.";
  const category = group?.category || "community";
  const members = group?.member_count || group?.members_count || group?.participant_count || 0;

  return (
    <div className="rounded-[28px] border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
      <div className="mb-5 flex h-32 items-end rounded-[22px] p-4" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(20,184,166,0.12))" }}>
        <span className="rounded-full px-3 py-1 text-xs font-semibold capitalize" style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "var(--text-primary)" }}>{category}</span>
      </div>
      <div className="space-y-3">
        <h3 className="h4" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{description}</p>
        <div className="flex items-center justify-between pt-2">
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