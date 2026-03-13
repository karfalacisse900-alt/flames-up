import React from "react";
import { Sparkles } from "lucide-react";

export default function PageIntroCard({ eyebrow, title, description, action }) {
  return (
    <div
      className="rounded-[28px] border p-5 md:p-7"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(238,242,255,0.9))",
        borderColor: "var(--border-light)",
        boxShadow: "var(--elevation-2)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
          >
            <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
          </div>
          <div className="space-y-2">
            <h1 className="h2" style={{ color: "var(--text-primary)" }}>{title}</h1>
            <p className="max-w-2xl text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>{description}</p>
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}