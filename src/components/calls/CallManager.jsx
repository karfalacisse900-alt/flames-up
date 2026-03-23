import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import IncomingCallOverlay from "./IncomingCallOverlay";
import NativeCallScreen from "./NativeCallScreen";

// Timeout: auto-decline if not answered in 30s
const RING_TIMEOUT_MS = 30000;

export default function CallManager({ user }) {
  const [incomingSession, setIncomingSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const ringTimer = useRef(null);
  const seenIds = useRef(new Set());

  const clearRingTimer = () => {
    if (ringTimer.current) {
      clearTimeout(ringTimer.current);
      ringTimer.current = null;
    }
  };

  // Subscribe to new CallSession records targeted at this user
  useEffect(() => {
    if (!user?.email) return;

    // Check for already-ringing sessions on mount
    base44.entities.CallSession.filter({ callee_email: user.email, status: "ringing" })
      .then(sessions => {
        const recent = sessions.find(s => {
          // Only surface sessions created in the last 30 seconds
          const age = Date.now() - new Date(s.created_date).getTime();
          return age < RING_TIMEOUT_MS && !seenIds.current.has(s.id);
        });
        if (recent) {
          seenIds.current.add(recent.id);
          setIncomingSession(recent);
          startRingTimer(recent);
        }
      })
      .catch(() => {});

    const unsub = base44.entities.CallSession.subscribe((event) => {
      if (event.type === "create" && event.data?.callee_email === user.email && event.data?.status === "ringing") {
        if (seenIds.current.has(event.id)) return;
        seenIds.current.add(event.id);
        setIncomingSession(event.data);
        startRingTimer(event.data);
      }
      if (event.type === "update") {
        // If the active session was ended remotely
        if (activeSession && event.id === activeSession.id && event.data?.status === "ended") {
          setActiveSession(null);
        }
        // Keep active session data in sync (e.g. status change to "active")
        if (activeSession && event.id === activeSession.id) {
          setActiveSession(prev => prev ? { ...prev, ...event.data } : prev);
        }
        // If the incoming session was cancelled by caller
        if (incomingSession && event.id === incomingSession.id && ["ended", "declined", "missed"].includes(event.data?.status)) {
          clearRingTimer();
          setIncomingSession(null);
        }
      }
    });

    return () => { unsub(); clearRingTimer(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const startRingTimer = (session) => {
    clearRingTimer();
    ringTimer.current = setTimeout(async () => {
      // Auto-miss
      await base44.entities.CallSession.update(session.id, { status: "missed" }).catch(() => {});
      setIncomingSession(null);
    }, RING_TIMEOUT_MS);
  };

  const handleAccept = useCallback(async () => {
    if (!incomingSession) return;
    clearRingTimer();
    await base44.entities.CallSession.update(incomingSession.id, { status: "active" }).catch(() => {});
    // Re-fetch the session so we have the full record including realtime tokens
    const sessions = await base44.entities.CallSession.filter({ id: incomingSession.id }).catch(() => []);
    const full = Array.isArray(sessions) ? sessions[0] : sessions;
    setActiveSession(full || incomingSession);
    setIncomingSession(null);
  }, [incomingSession]);

  const handleDecline = useCallback(async () => {
    if (!incomingSession) return;
    clearRingTimer();
    await base44.entities.CallSession.update(incomingSession.id, { status: "declined" }).catch(() => {});
    setIncomingSession(null);
  }, [incomingSession]);

  const handleEndCall = useCallback(() => {
    setActiveSession(null);
  }, []);

  // Expose initiateCall globally so any component can trigger it
  useEffect(() => {
    window.__callManager = {
      startCall: async ({ calleeEmail, calleeName, callType = "video", call_type }) => {
        callType = callType || call_type || "video";
        if (!user?.email) return;
        const roomId = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
        const callerName = user.full_name || user.email?.split("@")[0];
        const calleeDisplayName = calleeName || calleeEmail?.split("@")[0];

        // Create RealtimeKit meeting + participant tokens
        let realtimeMeetingId, callerToken, calleeToken;
        try {
          const res = await base44.functions.invoke("realtimeCall", {
            action: "create_call",
            callerName,
            calleeName: calleeDisplayName,
            sessionId: roomId,
          });
          realtimeMeetingId = res.data.meetingId;
          callerToken = res.data.callerToken;
          calleeToken = res.data.calleeToken;
        } catch (e) {
          console.error("Failed to create RealtimeKit meeting:", e);
          return;
        }

        const session = await base44.entities.CallSession.create({
          room_id: roomId,
          caller_email: user.email,
          caller_name: callerName,
          caller_avatar: user.avatar_url || "",
          callee_email: calleeEmail,
          callee_name: calleeDisplayName,
          participant_emails: [user.email, calleeEmail],
          status: "ringing",
          call_type: callType,
          realtime_meeting_id: realtimeMeetingId,
          caller_token: callerToken,
          callee_token: calleeToken,
        });
        // Send notification to callee
        await base44.entities.Notification.create({
          recipient_email: calleeEmail,
          actor_email: user.email,
          actor_name: callerName,
          type: "creator_live",
          post_text: `📞 Incoming ${callType} call from ${callerName}`,
          ref_id: session.id,
          is_read: false,
        }).catch(() => {});
        setActiveSession(session);
      },
    };
    return () => { delete window.__callManager; };
  }, [user]);

  return (
    <AnimatePresence>
      {incomingSession && !activeSession && (
        <IncomingCallOverlay
          key="incoming"
          session={incomingSession}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
      {activeSession && (
        <NativeCallScreen
          key="active"
          session={activeSession}
          currentUser={user}
          onEnd={handleEndCall}
        />
      )}
    </AnimatePresence>
  );
}