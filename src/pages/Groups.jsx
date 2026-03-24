import React from "react";
import { Users } from "lucide-react";

export default function Groups() {
  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh", padding: "1rem" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
          <Users className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Groups</h1>
      </div>
      <div style={{ color: "var(--text-hint)" }}>Groups page loading...</div>
    </div>
  );
}