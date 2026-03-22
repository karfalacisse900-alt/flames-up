import React, { useState, useEffect, useRef, useCallback } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, RotateCcw, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

const COLORS = ["#7C3AED", "#0F766E", "#E53935", "#D97706", "#1D4ED8"];
const avatarColor = (email) => COLORS[(email || "a").charCodeAt(0) % COLORS.length];

// Simple WebRTC signaling via CallSession entity fields
// We store SDP offers/answers and ICE candidates in the session

export default function NativeCallScreen({ session, currentUser, onEnd }) {
  const [status, setStatus] = useState("connecting");
  const [callDuration, setCallDuration] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(session.call_type === "audio");
  const [remoteVideoActive, setRemoteVideoActive] = useState(false);
  const [facingMode, setFacingMode] = useState("user");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const durationRef = useRef(null);
  const pollingRef = useRef(null);
  const sessionIdRef = useRef(session.id);
  const isCaller = session.caller_email === currentUser.email;

  const partnerName = isCaller
    ? (session.callee_name || session.callee_email?.split("@")[0])
    : (session.caller_name || session.caller_email?.split("@")[0]);
  const partnerEmail = isCaller ? session.callee_email : session.caller_email;

  const formatDuration = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const cleanup = useCallback(() => {
    clearInterval(durationRef.current);
    clearInterval(pollingRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  const handleEnd = useCallback(async (selfInitiated = true) => {
    setStatus("ended");
    cleanup();
    if (selfInitiated) {
      await base44.entities.CallSession.update(sessionIdRef.current, {
        status: "ended",
        ended_at: new Date().toISOString(),
        webrtc_offer: null,
        webrtc_answer: null,
        webrtc_ice_caller: null,
        webrtc_ice_callee: null,
      }).catch(() => {});
    }
    setTimeout(onEnd, 1500);
  }, [cleanup, onEnd]);

  // Watch for remote hang-up
  useEffect(() => {
    const unsub = base44.entities.CallSession.subscribe((event) => {
      if (event.id === session.id && event.data?.status === "ended") {
        handleEnd(false);
      }
    });
    return unsub;
  }, [session.id, handleEnd]);

  // Start duration timer when connected
  useEffect(() => {
    if (status === "active") {
      durationRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(durationRef.current);
  }, [status]);

  // Main WebRTC setup
  useEffect(() => {
    let cancelled = false;

    const setupCall = async () => {
      // Get local media
      const constraints = {
        audio: true,
        video: session.call_type !== "audio" ? { facingMode: "user" } : false,
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Try audio only fallback
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch {
          handleEnd(true);
          return;
        }
      }
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Remote stream
      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        setRemoteVideoActive(true);
        setStatus("active");
      };

      // Collect ICE candidates
      const iceCandidates = [];
      pc.onicecandidate = (event) => {
        if (event.candidate) iceCandidates.push(event.candidate.toJSON());
      };

      if (isCaller) {
        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait for ICE gathering
        await new Promise(resolve => {
          if (pc.iceGatheringState === "complete") { resolve(); return; }
          const check = setInterval(() => {
            if (pc.iceGatheringState === "complete") { clearInterval(check); resolve(); }
          }, 200);
          setTimeout(() => { clearInterval(check); resolve(); }, 3000);
        });

        // Store offer + ICE in session
        await base44.entities.CallSession.update(session.id, {
          webrtc_offer: JSON.stringify(pc.localDescription),
          webrtc_ice_caller: JSON.stringify(iceCandidates),
        }).catch(() => {});

        // Poll for answer
        pollingRef.current = setInterval(async () => {
          if (cancelled || !pcRef.current) return;
          const updated = await base44.entities.CallSession.filter({ id: session.id }).catch(() => []);
          const s = updated[0] || updated;
          const sess = Array.isArray(updated) ? updated[0] : updated;
          if (!sess?.webrtc_answer) return;
          if (pc.signalingState !== "have-local-offer") { clearInterval(pollingRef.current); return; }

          try {
            const answer = JSON.parse(sess.webrtc_answer);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            // Add callee ICE candidates
            if (sess.webrtc_ice_callee) {
              const candidates = JSON.parse(sess.webrtc_ice_callee);
              for (const c of candidates) {
                await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
              }
            }
            clearInterval(pollingRef.current);
          } catch {}
        }, 1500);

      } else {
        // Callee: poll for offer then send answer
        const waitForOffer = async () => {
          for (let i = 0; i < 20; i++) {
            if (cancelled) return;
            const sessions = await base44.entities.CallSession.filter({ id: session.id }).catch(() => []);
            const sess = Array.isArray(sessions) ? sessions[0] : sessions;
            if (sess?.webrtc_offer) {
              const offer = JSON.parse(sess.webrtc_offer);
              await pc.setRemoteDescription(new RTCSessionDescription(offer));

              // Add caller ICE
              if (sess.webrtc_ice_caller) {
                const candidates = JSON.parse(sess.webrtc_ice_caller);
                for (const c of candidates) {
                  await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                }
              }

              // Create answer
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await new Promise(resolve => {
                if (pc.iceGatheringState === "complete") { resolve(); return; }
                const check = setInterval(() => {
                  if (pc.iceGatheringState === "complete") { clearInterval(check); resolve(); }
                }, 200);
                setTimeout(() => { clearInterval(check); resolve(); }, 3000);
              });

              await base44.entities.CallSession.update(session.id, {
                webrtc_answer: JSON.stringify(pc.localDescription),
                webrtc_ice_callee: JSON.stringify(iceCandidates),
              }).catch(() => {});
              return;
            }
            await new Promise(r => setTimeout(r, 1500));
          }
          // Timeout — end call
          handleEnd(true);
        };
        waitForOffer();
      }
    };

    setupCall();
    return () => { cancelled = true; cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = micMuted; });
      setMicMuted(m => !m);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = videoOff; });
      setVideoOff(v => !v);
    }
  };

  const flipCamera = async () => {
    if (!localStreamRef.current) return;
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { facingMode: newMode },
    }).catch(() => null);
    if (!newStream || !pcRef.current) return;
    const [newVideoTrack] = newStream.getVideoTracks();
    const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
    if (sender && newVideoTrack) await sender.replaceTrack(newVideoTrack);
    localStreamRef.current.getVideoTracks().forEach(t => t.stop());
    if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
    localStreamRef.current = newStream;
  };

  const color = avatarColor(partnerEmail);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{
        background: "#0a0a0f",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Remote video — fills screen */}
      <div className="absolute inset-0">
        {remoteVideoActive ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4"
            style={{ background: "linear-gradient(160deg, #0f0c29, #302b63, #24243e)" }}>
            {/* Partner avatar while connecting */}
            <div className="relative flex items-center justify-center">
              {[1, 2, 3].map(i => (
                <motion.div key={i} className="absolute rounded-full"
                  style={{ border: `2px solid rgba(255,255,255,${0.15 - i * 0.04})`, width: 80 + i * 44, height: 80 + i * 44 }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.1, 0.4] }}
                  transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                />
              ))}
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold relative z-10"
                style={{ background: `linear-gradient(135deg, ${color}, #7C3AED)`, color: "#fff", border: "3px solid rgba(255,255,255,0.25)" }}>
                {partnerName?.[0]?.toUpperCase() || "?"}
              </div>
            </div>
            <p className="text-white text-2xl font-bold mt-6">{partnerName}</p>
            <p className="text-white/50 text-base">
              {status === "ended" ? "Call ended" : "Connecting…"}
            </p>
            {status === "connecting" && (
              <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin mt-2" />
            )}
          </div>
        )}
      </div>

      {/* Local video — pip */}
      {session.call_type !== "audio" && (
        <div className="absolute top-20 right-4 z-10 rounded-2xl overflow-hidden shadow-xl"
          style={{ width: 100, height: 140, border: "2px solid rgba(255,255,255,0.3)" }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 shrink-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
        <div>
          <p className="text-white font-bold text-lg">{partnerName}</p>
          <p className="text-white/60 text-sm">
            {status === "connecting" ? "Calling…" : status === "ended" ? "Call ended" : formatDuration(callDuration)}
          </p>
        </div>
        {status === "active" && (
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#25D366" }} />
        )}
      </div>

      {/* Ended overlay */}
      {status === "ended" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
          <PhoneOff className="w-14 h-14 text-white/30" />
          <p className="text-white/70 text-xl font-semibold">Call ended</p>
          <p className="text-white/40 text-sm">{formatDuration(callDuration)}</p>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 px-8"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)", paddingBottom: "max(env(safe-area-inset-bottom, 0px), 32px)" }}>
        <div className="flex items-center justify-around">
          {/* Mic */}
          <button onClick={toggleMic}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: micMuted ? "#E53935" : "rgba(255,255,255,0.2)" }}>
            {micMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>

          {/* End call */}
          <button onClick={() => handleEnd(true)}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#E53935" }}>
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          {/* Video toggle / flip */}
          {session.call_type !== "audio" ? (
            <button onClick={toggleVideo}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: videoOff ? "#E53935" : "rgba(255,255,255,0.2)" }}>
              {videoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
            </button>
          ) : (
            <div className="w-14 h-14" />
          )}
        </div>

        {session.call_type !== "audio" && (
          <div className="flex justify-center mt-4">
            <button onClick={flipCamera}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <RotateCcw className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}