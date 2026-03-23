import React, { useEffect, useState, useRef, useCallback } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, RotateCcw, Volume2 } from "lucide-react";

export default function FaceTimeCallScreen({ meeting, session, onEnd }) {
  const [participants, setParticipants] = useState([]);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const selfVideoRef = useRef(null);

  // Track active participants
  useEffect(() => {
    if (!meeting) return;
    const update = () => {
      try {
        setParticipants(meeting.participants.active.toArray?.() || []);
      } catch {}
    };
    update();
    meeting.participants.active.on?.("participantJoined", update);
    meeting.participants.active.on?.("participantLeft", update);
    return () => {
      meeting.participants.active.off?.("participantJoined", update);
      meeting.participants.active.off?.("participantLeft", update);
    };
  }, [meeting]);

  // Call timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Attach remote video stream
  useEffect(() => {
    const remote = participants[0];
    if (!remote || !remoteVideoRef.current) return;
    try {
      const track = remote.videoTrack;
      if (track) remoteVideoRef.current.srcObject = new MediaStream([track]);
    } catch {}
  }, [participants]);

  // Attach self video stream
  useEffect(() => {
    if (!meeting?.self || !selfVideoRef.current) return;
    try {
      const track = meeting.self.videoTrack;
      if (track) selfVideoRef.current.srcObject = new MediaStream([track]);
    } catch {}
  }, [meeting, videoOff]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const toggleMic = useCallback(async () => {
    if (!meeting) return;
    if (audioMuted) {
      await meeting.self.enableAudio?.().catch(() => {});
    } else {
      await meeting.self.disableAudio?.().catch(() => {});
    }
    setAudioMuted(v => !v);
  }, [meeting, audioMuted]);

  const toggleVideo = useCallback(async () => {
    if (!meeting) return;
    if (videoOff) {
      await meeting.self.enableVideo?.().catch(() => {});
    } else {
      await meeting.self.disableVideo?.().catch(() => {});
    }
    setVideoOff(v => !v);
  }, [meeting, videoOff]);

  const flipCamera = useCallback(async () => {
    await meeting.self.switchCamera?.().catch(() => {});
  }, [meeting]);

  const endCall = useCallback(async () => {
    await meeting.leaveRoom?.().catch(() => {});
    onEnd();
  }, [meeting, onEnd]);

  const remoteParticipant = participants[0] || null;
  const isAudioCall = session?.call_type === "audio";

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{
        background: "#000",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Remote video — full screen */}
      <div className="absolute inset-0">
        {remoteParticipant && !isAudioCall ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-5"
            style={{ background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
          >
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
            >
              {(session?.callee_name || session?.caller_name || "?")[0]?.toUpperCase()}
            </div>
            <p className="text-white text-2xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
              {session?.callee_name || session?.caller_name || "Calling…"}
            </p>
            {!remoteParticipant && (
              <p className="text-white/60 text-sm">Connecting…</p>
            )}
          </div>
        )}
      </div>

      {/* Top overlay — name + timer */}
      <div
        className="relative z-10 flex flex-col items-center pt-12 pb-4"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)" }}
      >
        <p className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-serif)" }}>
          {session?.callee_name || session?.caller_name || "Call"}
        </p>
        <p className="text-white/70 text-sm mt-0.5">{formatTime(elapsed)}</p>
      </div>

      {/* Self video — PiP top-right */}
      {!isAudioCall && (
        <div
          className="absolute z-20 rounded-2xl overflow-hidden"
          style={{
            width: 100, height: 140,
            top: 80, right: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            border: "2px solid rgba(255,255,255,0.2)",
          }}
        >
          {!videoOff ? (
            <video
              ref={selfVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a1a1a" }}>
              <VideoOff className="w-6 h-6 text-white/40" />
            </div>
          )}
        </div>
      )}

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pb-10 pt-8"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
      >
        <div className="flex items-center justify-center gap-6 px-8">
          {/* Mute */}
          <button
            onClick={toggleMic}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: audioMuted ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            {audioMuted ? <MicOff className="w-6 h-6 text-black" /> : <Mic className="w-6 h-6 text-white" />}
          </button>

          {/* End call */}
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "#FF3B30", boxShadow: "0 4px 20px rgba(255,59,48,0.5)" }}
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          {/* Video toggle / Speaker */}
          {!isAudioCall ? (
            <button
              onClick={toggleVideo}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: videoOff ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              {videoOff ? <VideoOff className="w-6 h-6 text-black" /> : <Video className="w-6 h-6 text-white" />}
            </button>
          ) : (
            <button
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
            >
              <Volume2 className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Flip camera */}
        {!isAudioCall && (
          <div className="flex justify-center mt-4">
            <button
              onClick={flipCamera}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
            >
              <RotateCcw className="w-4 h-4" />
              Flip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}