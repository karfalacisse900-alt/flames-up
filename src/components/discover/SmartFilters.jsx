import React from "react";

const SMART_FILTERS = [];

export default function SmartFilters({ active, onChange }) {
  return (
    <div className="px-5 mb-3 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 w-max">
        {SMART_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all active:scale-95"
            style={{
              backgroundColor: active === f.key ? "var(--accent-primary)" : "var(--bg-card)",
              color: active === f.key ? "#fff" : "var(--text-secondary)",
              borderColor: active === f.key ? "var(--accent-primary)" : "var(--border-medium)",
              boxShadow: active === f.key ? "0 2px 8px rgba(60,110,90,0.20)" : "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}