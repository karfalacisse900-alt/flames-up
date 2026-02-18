import React from "react";
import { X, GitCompare } from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";

export default function CompareBar({ selected, onRemove, onCompare, onClear }) {
  if (selected.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 left-2 right-2 max-w-lg mx-auto z-40 rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ backgroundColor: "#2F2F2F", boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}
    >
      <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
        {selected.map(item => (
          <div key={item.id} className="relative shrink-0">
            <DiscoverLogo item={item} size="sm" />
            <button
              onClick={() => onRemove(item.id)}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center"
            >
              <X className="w-2 h-2 text-white" />
            </button>
          </div>
        ))}
        {selected.length < 3 && (
          <div className="shrink-0 w-8 h-8 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center">
            <span className="text-white/40 text-lg leading-none">+</span>
          </div>
        )}
      </div>
      <button
        onClick={onCompare}
        disabled={selected.length < 2}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors"
        style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
      >
        <GitCompare className="w-3.5 h-3.5" />
        Compare {selected.length > 0 ? `(${selected.length})` : ""}
      </button>
    </div>
  );
}