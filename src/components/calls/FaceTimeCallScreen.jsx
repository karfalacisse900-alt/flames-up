import React, { useEffect } from "react";
import { RtkMeeting } from "@cloudflare/realtimekit-react-ui";
import { base44 } from "@/api/base44Client";

export default function FaceTimeCallScreen({ meeting, session, onEnd }) {
  // Watch for remote party ending the call
  useEffect(() => {
    const unsub = base44.entities.CallSession.subscribe((event) => {
      if (event.id === session.id && event.data?.status === "ended") {
        meeting?.leaveRoom?.().catch(() => {});
        onEnd();
      }
    });
    return unsub;
  }, [session.id, meeting, onEnd]);

  // Handle self leaving
  useEffect(() => {
    if (!meeting) return;
    const handler = async () => {
      await base44.entities.CallSession.update(session.id, {
        status: "ended",
        ended_at: new Date().toISOString(),
      }).catch(() => {});
      onEnd();
    };
    meeting.self?.on("roomLeft", handler);
    return () => meeting.self?.off?.("roomLeft", handler);
  }, [meeting, session.id, onEnd]);

  return (
    <div className="fixed inset-0 z-[200]" style={{ background: "#000" }}>
      <RtkMeeting meeting={meeting} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}