import React from "react";
import { MailCheck } from "lucide-react";

/**
 * Wrap any action that requires email verification.
 * If user.email_verified is falsy, shows a prompt instead of calling the action.
 *
 * Usage (imperative check):
 *   import { requireVerified } from "@/components/auth/EmailVerificationGate";
 *   if (!requireVerified(user)) return;
 *   // proceed with action
 *
 * Usage (inline banner):
 *   <EmailVerificationBanner />
 */

export function requireVerified(user) {
  if (!user) return false;
  if (user.email_verified === false) {
    // dispatch a global event so any listener can show the banner
    window.dispatchEvent(new CustomEvent("show_verify_banner"));
    return false;
  }
  return true;
}

export default function EmailVerificationBanner({ onDismiss }) {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] max-w-lg mx-auto rounded-2xl shadow-xl px-4 py-3 flex items-start gap-3"
      style={{ backgroundColor: "#EEF3F0", border: "2px solid #3C6E5A" }}>
      <MailCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#3C6E5A" }} />
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "#2F2F2F" }}>Verify your email first</p>
        <p className="text-xs mt-0.5" style={{ color: "#6B6B6B" }}>
          Check your inbox and click the verification link to post, comment, or leave reviews.
        </p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-xs font-bold mt-0.5" style={{ color: "#3C6E5A" }}>✕</button>
      )}
    </div>
  );
}