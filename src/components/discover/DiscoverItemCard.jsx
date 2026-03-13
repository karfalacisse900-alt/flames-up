import React from "react";
import { ExternalLink, Star } from "lucide-react";

export default function DiscoverItemCard({ item }) {
  return (
    <div className="overflow-hidden rounded-[30px] border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
      <div className="h-24 px-5 pt-5" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.14), rgba(20,184,166,0.10))" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize" style={{ backgroundColor: "rgba(255,255,255,0.74)", color: "var(--text-primary)" }}>
            {item.category}
          </div>
          {item.is_featured && <Star className="h-4 w-4 fill-current" style={{ color: "var(--accent-secondary)" }} />}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <h3 className="h4" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
        <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-xs font-medium" style={{ color: "var(--text-hint)" }}>{item.pricing || "Explore"}</div>
          {item.link ? (
            <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              Open <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}