import React, { useEffect, useState } from "react";
import { PhoneOff } from "lucide-react";
import { useRealtimeKitClient } from "@cloudflare/realtimekit/react";
import { RtkMeeting } from "@cloudflare/realtimekit-react-ui";
import { base44 } from "@/api/base44Client";

export default function VideoCallModal({ roomName, displayName, onClose }) {
  const [meeting, initMeeting] = useRealtimeKitClient();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const join = async () => {
      const res = await base44.functions.invoke("realtimeCall", {
        action: "join_group_call",
        room_name: roomName,
        participant_name: displayName,
      });
      const { token } = res.data;
      if (!token) throw new Error("No token returned from server");
      await initMeeting({
        authToken: token,
        defaults: { audio: true, video: true },
      });
      setReady(true);
    };
    join().catch((e) => setError(e?.message || "Failed to start call"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect meeting end
  useEffect(() => {
    if (!meeting || !ready) return;
    meeting.self.on("roomLeft", onClose);
    return () => meeting.self.off?.("roomLeft", onClose);
  }, [meeting, ready, onClose]);

  if (error) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
        style={{ background: "#0a0a0f" }}
      >
        <PhoneOff className="w-14 h-14" style={{ color: "rgba(255,255,255,0.3)" }} />
        <p className="text-white font-semibold text-lg">Call failed</p>
        <p className="text-sm text-center px-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          {error}
        </p>
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-2xl text-white font-bold"
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
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
        style={{ background: "#0a0a0f" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }}
        />
        <p style={{ color: "rgba(255,255,255,0.6)" }}>Starting call…</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100]"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <RtkMeeting meeting={meeting} />
    </div>
  );
}