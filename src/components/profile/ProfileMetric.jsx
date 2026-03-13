import React from "react";

export default function ProfileMetric({ label, value, tone = "primary" }) {
  const accent = tone === "accent" ? "var(--accent-secondary)" : "var(--accent-primary)";
  const surface = tone === "accent"
    ? "linear-gradient(135deg, rgba(20,184,166,0.16), rgba(20,184,166,0.04))"
    : "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(79,70,229,0.04))";

  return (
    <div className="rounded-[28px] border p-5" style={{ background: surface, borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>{label}</div>
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <div className="mt-5 text-3xl font-bold leading-none" style={{ color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}