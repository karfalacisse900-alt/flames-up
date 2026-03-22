import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

const HEARTBEAT_INTERVAL = 30000; // 30s

/**
 * Updates the current user's last_seen every 30 seconds.
 * Call this once at the app level (Layout or main component).
 */
export function useOnlinePresence(user) {
  useEffect(() => {
    if (!user?.email) return;

    const update = () => {
      base44.auth.updateMe({ last_seen: new Date().toISOString() }).catch(() => {});
    };

    update(); // immediate on mount
    const interval = setInterval(update, HEARTBEAT_INTERVAL);

    // Also update on visibility change
    const onVisible = () => { if (document.visibilityState === "visible") update(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.email]);
}

/**
 * Returns true if a user is online (seen within last 2 minutes).
 */
export function isOnline(lastSeen) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
}

/**
 * OnlineDot — small indicator component
 */
export function OnlineDot({ lastSeen, size = 10 }) {
  const online = isOnline(lastSeen);
  if (!online) return null;
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#25D366",
        border: "2px solid var(--bg-card, #fff)",
        flexShrink: 0,
      }}
    />
  );
}