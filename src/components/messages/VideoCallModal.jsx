import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2 } from "lucide-react";

export default function VideoCallModal({ roomName, displayName, onClose }) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const iframeRef = useRef(null);

  const jitsiRoom = `flamesup-${roomName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;
  const jitsiUrl = `https://meet.jit.si/${jitsiRoom}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.TOOLBAR_BUTTONS=[]`;

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.action === "hangup") onClose();
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", paddingTop: "max(env(safe-area-inset-top, 0px), 12px)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#25D366" }} />
          <span className="text-white font-semibold text-sm">Live Call</span>
        </div>
        <button onClick={() => {
          if (window.confirm("Leave the call?")) onClose();
        }} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#E53935" }}>
          <PhoneOff className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Jitsi iframe */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={jitsiUrl}
          allow="camera; microphone; display-capture; autoplay; clipboard-write"
          className="w-full h-full border-0"
          title="Video Call"
        />
      </div>

      {/* Info bar */}
      <div className="px-4 py-3 shrink-0 text-center"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}>
        <p className="text-white/60 text-xs">Powered by end-to-end encrypted video · Use call controls inside the video</p>
      </div>
    </div>
  );
}