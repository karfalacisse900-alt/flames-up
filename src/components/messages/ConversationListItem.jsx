import React from "react";
import { ChevronRight } from "lucide-react";

export default function ConversationListItem({ conversation, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-[24px] border p-4 text-left"
      style={{
        backgroundColor: isActive ? "var(--accent-primary-light)" : "var(--bg-card)",
        borderColor: isActive ? "rgba(79,70,229,0.22)" : "var(--border-light)",
        boxShadow: isActive ? "var(--elevation-2)" : "var(--elevation-1)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold" style={{ backgroundColor: "rgba(79,70,229,0.12)", color: "var(--accent-primary)" }}>
          {(conversation.name || "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{conversation.name}</p>
            <ChevronRight className="h-4 w-4" style={{ color: "var(--text-hint)" }} />
          </div>
          <p className="mt-1 truncate text-xs" style={{ color: "var(--text-secondary)" }}>{conversation.preview}</p>
        </div>
      </div>
    </button>
  );
}