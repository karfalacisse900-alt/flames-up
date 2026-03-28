import React from "react";
import { ShieldAlert, ShieldCheck, Loader2, X } from "lucide-react";

/**
 * Displays the real-time scan status during upload.
 * status: "scanning" | "rejected" | "flagged" | "authentic" | null
 */
export default function ContentScanBanner({ status, message, onDismiss }) {
  if (!status) return null;

  const configs = {
    scanning: {
      bg: "var(--bg-subtle)",
      border: "var(--border-light)",
      icon: <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent-primary)" }} />,
      title: "Verifying authenticity…",
      body: "Scanning content to ensure it's real and authentic.",
      textColor: "var(--text-secondary)",
    },
    rejected: {
      bg: "#FEF2F2",
      border: "#FECACA",
      icon: <ShieldAlert className="w-4 h-4" style={{ color: "#DC2626" }} />,
      title: "AI-Generated Content Detected",
      body: message || "This content appears to be AI-generated. Only authentic, real content is allowed.",
      textColor: "#DC2626",
    },
    flagged: {
      bg: "#FFFBEB",
      border: "#FDE68A",
      icon: <ShieldAlert className="w-4 h-4" style={{ color: "#D97706" }} />,
      title: "Content Flagged for Review",
      body: message || "Your content will be reviewed before publishing.",
      textColor: "#D97706",
    },
    authentic: {
      bg: "#F0FDF4",
      border: "#BBF7D0",
      icon: <ShieldCheck className="w-4 h-4" style={{ color: "#16A34A" }} />,
      title: "Content Verified ✓",
      body: "Your content passed authenticity verification.",
      textColor: "#16A34A",
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="shrink-0 mt-0.5">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold" style={{ color: cfg.textColor }}>{cfg.title}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{cfg.body}</p>
      </div>
      {onDismiss && status !== "scanning" && (
        <button onClick={onDismiss} className="shrink-0 p-1 rounded-full" style={{ minHeight: "unset", minWidth: "unset" }}>
          <X className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
        </button>
      )}
    </div>
  );
}