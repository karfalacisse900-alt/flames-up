import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const NOTIFY_RADIUS_KM = 1.6; // ~1 mile
const CHECK_INTERVAL_MS = 60 * 1000; // check every 60s
const NOTIFIED_KEY = "proximity_notified"; // sessionStorage key

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function kmToMiles(km) { return km * 0.621371; }

/**
 * ProximityNotifier
 * Invisible component — checks if any friend has entered the user's ~1 mile radius.
 * Only sends one in-app notification per friend per session.
 */
export default function ProximityNotifier({ currentUser, userLoc, followedEmails }) {
  const timerRef = useRef(null);
  const sentRef = useRef(new Set());

  // Load already-notified from sessionStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(NOTIFIED_KEY) || "[]");
      saved.forEach(e => sentRef.current.add(e));
    } catch {}
  }, []);

  const saveNotified = () => {
    try {
      sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...sentRef.current]));
    } catch {}
  };

  const runCheck = async () => {
    if (!currentUser?.email || !userLoc || !followedEmails?.length) return;

    const [uLng, uLat] = userLoc;
    const now = new Date();

    // Fetch all active presences
    const presences = await base44.entities.LocationPresence.list("-updated_date", 100).catch(() => []);
    const friendSet = new Set(followedEmails);

    for (const presence of presences) {
      if (!presence.location_lat || !presence.location_lng) continue;
      if (presence.user_email === currentUser.email) continue;
      if (!friendSet.has(presence.user_email)) continue; // only friends
      if (presence.visibility_mode === "invisible") continue;
      if (presence.expires_at && new Date(presence.expires_at) < now) continue;

      const sessionKey = `${presence.user_email}`;
      if (sentRef.current.has(sessionKey)) continue; // already notified this session

      const distKm = haversineKm(uLat, uLng, presence.location_lat, presence.location_lng);
      if (distKm <= NOTIFY_RADIUS_KM) {
        const distMi = kmToMiles(distKm);
        const distLabel = distMi < 0.5 ? "less than half a mile" : `about ${Math.round(distMi)} mile${Math.round(distMi) !== 1 ? "s" : ""}`;
        
        // Create in-app notification
        await base44.entities.Notification.create({
          recipient_email: currentUser.email,
          actor_email: presence.user_email,
          actor_name: presence.user_name || "A friend",
          type: "friend_nearby",
          post_text: `Your friend ${presence.user_name || "someone"} is ${distLabel} away`,
          ref_id: presence.user_email,
        }).catch(() => {});

        // Browser notification if permitted
        if ("Notification" in window && window.Notification.permission === "granted") {
          new window.Notification(`${presence.user_name || "A friend"} is nearby!`, {
            body: `${presence.user_name || "Your friend"} is ${distLabel} away from you`,
            icon: presence.avatar_url || "/favicon.ico",
          });
        }

        sentRef.current.add(sessionKey);
        saveNotified();
      }
    }
  };

  useEffect(() => {
    if (!currentUser?.email || !userLoc) return;
    runCheck();
    timerRef.current = setInterval(runCheck, CHECK_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [currentUser?.email, userLoc?.toString(), followedEmails?.join(",")]);

  // Request browser notification permission once
  useEffect(() => {
    if ("Notification" in window && window.Notification.permission === "default") {
      window.Notification.requestPermission().catch(() => {});
    }
  }, []);

  return null; // invisible component
}