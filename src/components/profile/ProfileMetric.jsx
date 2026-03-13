import React from "react";

export default function ProfileMetric({ label, value, tone = "primary" }) {
  const bg = tone === "accent" ? "rgba(20,184,166,0.10)" : "rgba(79,70,229,0.10)";
  const color = tone === "accent" ? "var(--accent-secondary)" : "var(--accent-primary)";

  return (
    <div className="rounded-3xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-1)" }}>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: bg, color: "var(--text-secondary)" }}>
        {label}
      </div>
    </div>
  );
}