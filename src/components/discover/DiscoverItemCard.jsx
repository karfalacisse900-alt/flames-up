import React from "react";
import { ExternalLink, Star } from "lucide-react";

export default function DiscoverItemCard({ item }) {
  return (
    <div className="rounded-[28px] border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            {item.category}
          </div>
          <h3 className="mt-3 h4" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
        </div>
        {item.is_featured && <Star className="h-4 w-4 fill-current" style={{ color: "var(--accent-secondary)" }} />}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs" style={{ color: "var(--text-hint)" }}>{item.pricing || "Explore"}</div>
        {item.link ? (
          <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            Open <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
}