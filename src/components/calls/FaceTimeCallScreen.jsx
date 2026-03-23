import React, { useEffect, useState, useRef, useCallback } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, RotateCcw, Volume2 } from "lucide-react";

export default function FaceTimeCallScreen({ meeting, session, onEnd }) {
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const remoteVideoRef = useRef(null);
  const selfVideoRef = useRef(null);
  const selfStreamRef = useRef(null);

  const isAudioCall = session?.call_type === "audio";

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Self camera via getUserMedia (most reliable) ─────────────────────────
  useEffect(() => {
    if (isAudioCall) return;
    let stopped = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(stream => {
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        selfStreamRef.current = stream;
        if (selfVideoRef.current) {
          selfVideoRef.current.srcObject = stream;
          selfVideoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {}); // permission denied — show VideoOff placeholder
    return () => {
      stopped = true;
      selfStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [isAudioCall]);

  // ── Remote participant tracking ──────────────────────────────────────────
  useEffect(() => {
    if (!meeting) return;

    // Helper: try every known SDK path to get tracks from a participant
    const attachRemote = (participant) => {
      if (!participant) return;
      setRemoteJoined(true);

      const tryAttach = () => {
        const el = remoteVideoRef.current;
        if (!el) return;

        // Strategy 1: participant.streams (standard WebRTC-in-SDK)
        const streams = participant.streams;
        if (streams && streams.length > 0) {
          el.srcObject = streams[0];
          el.play().catch(() => {});
          return;
        }

        // Strategy 2: videoTrack / audioTrack raw
        const vTrack = participant.videoTrack || participant.video?.track;
        const aTrack = participant.audioTrack || participant.audio?.track;
        const tracks = [vTrack, aTrack].filter(Boolean);
        if (tracks.length > 0) {
          el.srcObject = new MediaStream(tracks);
          el.play().catch(() => {});
        }
      };

      tryAttach();
      // Some SDKs fire trackAdded after participantJoined
      participant.on?.("trackAdded", tryAttach);
      participant.on?.("videoUpdate", tryAttach);
      participant.on?.("audioUpdate", tryAttach);
      participant.on?.("streamAdded", tryAttach);
    };

    // Check already-present participants
    const getActive = () => {
      try {
        const arr = meeting.participants?.active?.toArray?.()
          || (meeting.participants?.active ? [...meeting.participants.active] : []);
        return arr.filter(p => p.id !== meeting.self?.id);
      } catch { return []; }
    };

    const existing = getActive();
    if (existing.length > 0) attachRemote(existing[0]);

    // Listen for future joins
    const onJoin = (p) => attachRemote(p);
    const onLeave = () => {
      const arr = getActive();
      if (arr.length === 0) setRemoteJoined(false);
    };

    meeting.participants?.active?.on?.("participantJoined", onJoin);
    meeting.participants?.active?.on?.("participantLeft", onLeave);
    meeting.participants?.joined?.on?.("participantJoined", onJoin);

    // Also try meeting-level events
    meeting.on?.("participantJoined", onJoin);
    meeting.on?.("participantLeft", onLeave);

    return () => {
      meeting.participants?.active?.off?.("participantJoined", onJoin);
      meeting.participants?.active?.off?.("participantLeft", onLeave);
      meeting.participants?.joined?.off?.("participantJoined", onJoin);
      meeting.off?.("participantJoined", onJoin);
      meeting.off?.("participantLeft", onLeave);
    };
  }, [meeting]);

  // ── Controls ─────────────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    if (!meeting) return;
    if (audioMuted) {
      await meeting.self?.enableAudio?.().catch(() => {});
      await meeting.self?.unmuteMic?.().catch(() => {});
    } else {
      await meeting.self?.disableAudio?.().catch(() => {});
      await meeting.self?.muteMic?.().catch(() => {});
    }
    setAudioMuted(v => !v);
  }, [meeting, audioMuted]);

  const toggleVideo = useCallback(async () => {
    if (!meeting) return;
    if (videoOff) {
      await meeting.self?.enableVideo?.().catch(() => {});
      // Also resume local stream
      selfStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = true; });
    } else {
      await meeting.self?.disableVideo?.().catch(() => {});
      selfStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = false; });
    }
    setVideoOff(v => !v);
  }, [meeting, videoOff]);

  const flipCamera = useCallback(async () => {
    await meeting.self?.switchCamera?.().catch(() => {});
  }, [meeting]);

  const endCall = useCallback(async () => {
    selfStreamRef.current?.getTracks().forEach(t => t.stop());
    await meeting?.leaveRoom?.().catch(() => {});
    onEnd();
  }, [meeting, onEnd]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const remoteName = session?.callee_name || session?.caller_name || "User";

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "#000", paddingTop: "env(safe-area-inset-top,0px)", paddingBottom: "env(safe-area-inset-bottom,0px)" }}
    >
      {/* Remote — full screen */}
      <div className="absolute inset-0">
        {remoteJoined && !isAudioCall ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-5"
            style={{ background: "linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" }}
          >
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-bold text-white"
              style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}
            >
              {remoteName[0]?.toUpperCase()}
            </div>
            <p className="text-white text-2xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
              {remoteName}
            </p>
            <p className="text-white/60 text-sm">
              {remoteJoined ? "Connected" : "Connecting…"}
            </p>
          </div>
        )}
      </div>

      {/* Remote audio element (always render for audio calls) */}
      <audio ref={remoteVideoRef} autoPlay playsInline style={{ display: isAudioCall ? "block" : "none", position: "absolute", opacity: 0 }} />

      {/* Top bar */}
      <div
        className="relative z-10 flex flex-col items-center pt-12 pb-4"
        style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.65) 0%,transparent 100%)" }}
      >
        <p className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-serif)" }}>{remoteName}</p>
        <p className="text-white/70 text-sm mt-0.5">{formatTime(elapsed)}</p>
      </div>

      {/* Self video PiP */}
      {!isAudioCall && (
        <div
          className="absolute z-20 rounded-2xl overflow-hidden"
          style={{ width: 100, height: 140, top: 80, right: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", border: "2px solid rgba(255,255,255,0.2)" }}
        >
          {!videoOff ? (
            <video
              ref={selfVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
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
        style={{ background: "linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 100%)" }}
      >
        <div className="flex items-center justify-center gap-6 px-8">
          <button
            onClick={toggleMic}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: audioMuted ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
          >
            {audioMuted ? <MicOff className="w-6 h-6 text-black" /> : <Mic className="w-6 h-6 text-white" />}
          </button>

          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "#FF3B30", boxShadow: "0 4px 20px rgba(255,59,48,0.5)" }}
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          {!isAudioCall ? (
            <button
              onClick={toggleVideo}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: videoOff ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
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

        {!isAudioCall && (
          <div className="flex justify-center mt-4">
            <button
              onClick={flipCamera}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
            >
              <RotateCcw className="w-4 h-4" /> Flip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}