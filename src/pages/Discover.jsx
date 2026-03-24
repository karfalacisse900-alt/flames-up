import React from "react";
import { Search } from "lucide-react";

export default function Discover() {
  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh", padding: "1rem" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
          <Search className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Discover</h1>
      </div>
      <div style={{ color: "var(--text-hint)" }}>Discover page loading...</div>
    </div>
  );
}