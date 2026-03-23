import React, { useEffect, useState } from "react";
import { PhoneOff } from "lucide-react";
import { useRealtimeKitClient } from "@cloudflare/realtimekit-react";
import { base44 } from "@/api/base44Client";
import FaceTimeCallScreen from "./FaceTimeCallScreen";

export default function NativeCallScreen({ session, currentUser, onEnd }) {
  const [meeting, initMeeting] = useRealtimeKitClient();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const isCaller = session.caller_email === currentUser.email;
  const token = isCaller ? session.caller_token : session.callee_token;

  // Initialize RealtimeKit with the participant token
  useEffect(() => {
    if (!token) {
      setError("No call token available. Please try again.");
      return;
    }
    initMeeting({
      authToken: token,
      defaults: {
        audio: true,
        video: session.call_type !== "audio",
      },
    })
      .then(() => setReady(true))
      .catch((e) => setError(e?.message || "Failed to connect"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle meeting ended event (leave room → update session)
  useEffect(() => {
    if (!meeting || !ready) return;
    const handler = async () => {
      await base44.entities.CallSession.update(session.id, {
        status: "ended",
        ended_at: new Date().toISOString(),
      }).catch(() => {});
      onEnd();
    };
    meeting.self.on("roomLeft", handler);
    return () => meeting.self.off?.("roomLeft", handler);
  }, [meeting, ready, session.id, onEnd]);

  // Watch for remote party ending the call
  useEffect(() => {
    const unsub = base44.entities.CallSession.subscribe((event) => {
      if (event.id === session.id && event.data?.status === "ended") {
        meeting?.leaveRoom().catch(() => {});
        onEnd();
      }
    });
    return unsub;
  }, [session.id, meeting, onEnd]);

  if (error) {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4"
        style={{ background: "#0a0a0f" }}
      >
        <PhoneOff className="w-16 h-16" style={{ color: "rgba(255,255,255,0.3)" }} />
        <p className="text-white font-semibold text-lg">Call failed</p>
        <p className="text-sm text-center px-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          {error}
        </p>
        <button
          onClick={onEnd}
          className="mt-2 px-6 py-3 rounded-2xl text-white font-bold"
          style={{ backgroundColor: "#E53935" }}
        >
          Close
        </button>
      </div>
    );
  }

  if (!ready || !meeting) {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4"
        style={{ background: "#0a0a0f" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }}
        />
        <p style={{ color: "rgba(255,255,255,0.6)" }}>Connecting…</p>
      </div>
    );
  }

  return (
    <FaceTimeCallScreen
      meeting={meeting}
      session={session}
      onEnd={onEnd}
    />
  );
}