import React from "react";

/**
 * PageLoader — full-screen themed loading state for async page transitions.
 * Matches the mobile app theme with a pulse animation.
 */
export default function PageLoader({ message }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-4"
      style={{
        backgroundColor: "var(--bg-app)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-live="polite"
      aria-label={message || "Loading"}
    >
      {/* Branded spinner */}
      <div className="relative w-14 h-14">
        <div
          className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
        />
        <div
          className="absolute inset-2 rounded-full"
          style={{ backgroundColor: "var(--accent-primary-light)" }}
        />
      </div>

      {message && (
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {message}
        </p>
      )}
    </div>
  );
}