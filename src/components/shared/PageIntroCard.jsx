import React from "react";
import { Sparkles } from "lucide-react";

export default function PageIntroCard({ eyebrow, title, description, action }) {
  return (
    <div
      className="relative overflow-hidden rounded-[34px] border p-6 md:p-8"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(238,242,255,0.88) 52%, rgba(240,253,250,0.88))",
        borderColor: "rgba(148,163,184,0.18)",
        boxShadow: "var(--elevation-3)",
      }}
    >
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full" style={{ background: "rgba(79,70,229,0.10)", filter: "blur(8px)" }} />
      <div className="absolute -bottom-20 left-10 h-40 w-40 rounded-full" style={{ background: "rgba(20,184,166,0.10)", filter: "blur(8px)" }} />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-4">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: "rgba(255,255,255,0.72)", color: "var(--accent-primary)", boxShadow: "var(--elevation-1)" }}
          >
            <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
          </div>
          <div className="max-w-3xl space-y-3">
            <h1 className="h1" style={{ color: "var(--text-primary)" }}>{title}</h1>
            <p className="max-w-2xl text-sm leading-7 md:text-base" style={{ color: "var(--text-secondary)" }}>{description}</p>
          </div>
        </div>
        {action ? <div className="relative">{action}</div> : null}
      </div>
    </div>
  );
}