import React, { useState, useEffect, useRef, useCallback } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, RotateCcw, Monitor, MonitorOff, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const COLORS = ["#7C3AED", "#0F766E", "#E53935", "#D97706", "#1D4ED8"];
const avatarColor = (email) => COLORS[(email || "a").charCodeAt(0) % COLORS.length];

// Audio constraints — echo cancellation MUST be on for local mic capture
const AUDIO_CONSTRAINTS = {
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: true },
  sampleRate: 48000,
  sampleSize: 16,
  channelCount: 1,
};

// Fallback audio constraints — simpler but still with EC on
const AUDIO_CONSTRAINTS_FALLBACK = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

const VIDEO_CONSTRAINTS = {
  facingMode: "user",
  width: { ideal: 1280, min: 640 },
  height: { ideal: 720, min: 480 },
  frameRate: { ideal: 30, min: 15 },
};

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

const PC_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

function setAudioBitrate(pc, kbps = 64) {
  pc.getSenders().forEach(async (sender) => {
    if (sender.track?.kind !== "audio") return;
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
    params.encodings[0].maxBitrate = kbps * 1000;
    await sender.setParameters(params).catch(() => {});
  });
}

function setVideoBitrate(pc, kbps = 1500) {
  pc.getSenders().forEach(async (sender) => {
    if (sender.track?.kind !== "video") return;
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
    params.encodings[0].maxBitrate = kbps * 1000;
    params.encodings[0].maxFramerate = 30;
    await sender.setParameters(params).catch(() => {});
  });
}

// Patch SDP to set Opus bitrate and enable in-band FEC for packet loss resilience
function patchOpusSdp(sdp, bitrateBps = 64000) {
  if (!sdp) return sdp;
  const lines = sdp.split("\r\n");
  const out = [];
  let inAudio = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("m=audio")) inAudio = true;
    else if (line.startsWith("m=")) inAudio = false;

    // Inject b=AS bandwidth line right after m=audio line
    if (inAudio && line.startsWith("m=audio")) {
      out.push(line);
      out.push(`b=AS:${Math.floor(bitrateBps / 1000)}`);
      continue;
    }

    // Patch Opus fmtp line — add FEC + CBR for stable audio on bad networks
    if (inAudio && line.startsWith("a=fmtp") && line.toLowerCase().includes("opus")) {
      let patched = line;
      const add = (key, val) => {
        if (!patched.includes(key)) patched += `;${key}=${val}`;
        else patched = patched.replace(new RegExp(`${key}=\\d+`), `${key}=${val}`);
      };
      add("maxaveragebitrate", bitrateBps);
      add("useinbandfec", 1);
      add("stereo", 0);
      add("cbr", 1); // constant bitrate — avoids silent gaps being misdetected as echo
      out.push(patched);
      continue;
    }

    out.push(line);
  }
  return out.join("\r\n");
}

// Attach stream to video element safely — only when srcObject actually changes
function attachStream(videoEl, stream) {
  if (!videoEl || !stream) return;
  if (videoEl.srcObject === stream) return;
  videoEl.srcObject = stream;
  videoEl.volume = 1.0;
  videoEl.muted = false; // never mute remote audio
  videoEl.play().catch(() => {});
}

export default function NativeCallScreen({ session, currentUser, onEnd }) {
  const [status, setStatus] = useState("connecting");
  const [callDuration, setCallDuration] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(session.call_type === "audio");
  const [remoteVideoActive, setRemoteVideoActive] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [screenSharing, setScreenSharing] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [addPersonEmail, setAddPersonEmail] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null); // null until first track arrives
  const durationRef = useRef(null);
  const pollingRef = useRef(null);
  const sessionIdRef = useRef(session.id);
  const isCaller = session.caller_email === currentUser.email;
  const pendingCandidatesRef = useRef([]);
  const remoteTracksRef = useRef(new Set()); // deduplicate incoming tracks

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
    remoteTracksRef.current.clear();
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

  // Duration timer
  useEffect(() => {
    if (status === "active") {
      durationRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(durationRef.current);
  }, [status]);

  // Main WebRTC setup — runs once on mount
  useEffect(() => {
    let cancelled = false;

    const setupCall = async () => {
      // Acquire local media — always keep echoCancellation on in every fallback
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: AUDIO_CONSTRAINTS,
          video: session.call_type !== "audio" ? VIDEO_CONSTRAINTS : false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: AUDIO_CONSTRAINTS_FALLBACK,
            video: session.call_type !== "audio",
          });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: AUDIO_CONSTRAINTS_FALLBACK,
              video: false,
            });
          } catch {
            handleEnd(true);
            return;
          }
        }
      }

      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

      localStreamRef.current = stream;

      // Attach local video (muted to prevent local echo via speakers)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // CRITICAL: mute local playback
        localVideoRef.current.volume = 0;
        localVideoRef.current.play().catch(() => {});
      }

      const pc = new RTCPeerConnection(PC_CONFIG);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Remote track handler — deduplicate tracks to prevent double audio
      pc.ontrack = (event) => {
        const track = event.track;

        // Skip if we've already added this track (prevents duplicate audio)
        if (remoteTracksRef.current.has(track.id)) return;
        remoteTracksRef.current.add(track.id);

        // Use the stream from the event if available, else build one
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = event.streams[0] || new MediaStream();
        }

        // Only add track if not already in the stream
        const existing = remoteStreamRef.current.getTracks().find(t => t.id === track.id);
        if (!existing) {
          remoteStreamRef.current.addTrack(track);
        }

        // Attach to remote video element
        if (remoteVideoRef.current) {
          attachStream(remoteVideoRef.current, remoteStreamRef.current);
        }

        setRemoteVideoActive(true);
        setStatus("active");
      };

      // Trickle ICE
      pc.onicecandidate = (event) => {
        if (!event.candidate || cancelled) return;
        pendingCandidatesRef.current.push(event.candidate.toJSON());
        clearTimeout(pc._iceFlushTimer);
        pc._iceFlushTimer = setTimeout(async () => {
          if (cancelled || !pcRef.current) return;
          const field = isCaller ? "webrtc_ice_caller" : "webrtc_ice_callee";
          await base44.entities.CallSession.update(session.id, {
            [field]: JSON.stringify(pendingCandidatesRef.current),
          }).catch(() => {});
        }, 300);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setStatus("active");
          setAudioBitrate(pc, 64);
          if (session.call_type !== "audio") setVideoBitrate(pc, 1500);
        }
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          if (!cancelled) handleEnd(false);
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (["connected", "completed"].includes(pc.iceConnectionState)) {
          setStatus("active");
        }
      };

      const waitForIce = (pc) => new Promise(resolve => {
        if (pc.iceGatheringState === "complete") { resolve(); return; }
        const check = setInterval(() => {
          if (cancelled || pc.iceGatheringState === "complete") { clearInterval(check); resolve(); }
        }, 150);
        setTimeout(() => { clearInterval(check); resolve(); }, 5000);
      });

      if (isCaller) {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: session.call_type !== "audio" });
        offer.sdp = patchOpusSdp(offer.sdp, 64000);
        await pc.setLocalDescription(offer);
        await waitForIce(pc);

        await base44.entities.CallSession.update(session.id, {
          webrtc_offer: JSON.stringify(pc.localDescription),
          webrtc_ice_caller: JSON.stringify(pendingCandidatesRef.current),
        }).catch(() => {});

        // Poll for callee answer
        pollingRef.current = setInterval(async () => {
          if (cancelled || !pcRef.current) return;
          const sessions = await base44.entities.CallSession.filter({ id: session.id }).catch(() => []);
          const sess = Array.isArray(sessions) ? sessions[0] : sessions;
          if (!sess?.webrtc_answer) return;
          if (pc.signalingState !== "have-local-offer") { clearInterval(pollingRef.current); return; }
          try {
            const answer = JSON.parse(sess.webrtc_answer);
            answer.sdp = patchOpusSdp(answer.sdp, 64000);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            if (sess.webrtc_ice_callee) {
              for (const c of JSON.parse(sess.webrtc_ice_callee)) {
                await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
              }
            }
            clearInterval(pollingRef.current);
          } catch {}
        }, 1000);

      } else {
        // Callee: wait for caller's offer
        for (let i = 0; i < 30; i++) {
          if (cancelled) return;
          const sessions = await base44.entities.CallSession.filter({ id: session.id }).catch(() => []);
          const sess = Array.isArray(sessions) ? sessions[0] : sessions;
          if (sess?.webrtc_offer) {
            const offer = JSON.parse(sess.webrtc_offer);
            offer.sdp = patchOpusSdp(offer.sdp, 64000);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            if (sess.webrtc_ice_caller) {
              for (const c of JSON.parse(sess.webrtc_ice_caller)) {
                await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
              }
            }

            const answer = await pc.createAnswer();
            answer.sdp = patchOpusSdp(answer.sdp, 64000);
            await pc.setLocalDescription(answer);
            await waitForIce(pc);

            await base44.entities.CallSession.update(session.id, {
              webrtc_answer: JSON.stringify(pc.localDescription),
              webrtc_ice_callee: JSON.stringify(pendingCandidatesRef.current),
            }).catch(() => {});
            break;
          }
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    };

    setupCall();
    return () => { cancelled = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const newMuted = !micMuted;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
    setMicMuted(newMuted);
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const newOff = !videoOff;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !newOff; });
    setVideoOff(newOff);
  };

  const toggleScreenShare = async () => {
    if (!pcRef.current) return;
    if (screenSharing) {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      }).catch(() => null);
      if (!newStream) return;
      const [videoTrack] = newStream.getVideoTracks();
      const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
      if (sender && videoTrack) await sender.replaceTrack(videoTrack);
      localStreamRef.current.getVideoTracks().forEach(t => t.stop());
      const updated = new MediaStream([...localStreamRef.current.getAudioTracks(), videoTrack]);
      localStreamRef.current = updated;
      if (localVideoRef.current) { localVideoRef.current.srcObject = updated; localVideoRef.current.play().catch(() => {}); }
      setScreenSharing(false);
    } else {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false }).catch(() => null);
      if (!screenStream) return;
      const [screenTrack] = screenStream.getVideoTracks();
      const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
      if (sender && screenTrack) await sender.replaceTrack(screenTrack);
      localStreamRef.current.getVideoTracks().forEach(t => t.stop());
      const updated = new MediaStream([...localStreamRef.current.getAudioTracks(), screenTrack]);
      localStreamRef.current = updated;
      if (localVideoRef.current) { localVideoRef.current.srcObject = updated; }
      screenTrack.onended = () => setScreenSharing(false);
      setScreenSharing(true);
    }
  };

  const handleAddPerson = () => {
    if (!addPersonEmail.trim()) return;
    window.__callManager?.startCall({ calleeEmail: addPersonEmail.trim(), callType: session.call_type || "video" });
    setShowAddPerson(false);
    setAddPersonEmail("");
  };

  const flipCamera = async () => {
    if (!localStreamRef.current || !pcRef.current) return;
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: newMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    }).catch(() => null);
    if (!newStream) return;
    const [newVideoTrack] = newStream.getVideoTracks();
    const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
    if (sender && newVideoTrack) await sender.replaceTrack(newVideoTrack);
    localStreamRef.current.getVideoTracks().forEach(t => t.stop());
    const newFull = new MediaStream([...localStreamRef.current.getAudioTracks(), newVideoTrack]);
    localStreamRef.current = newFull;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = newFull;
      localVideoRef.current.play().catch(() => {});
    }
  };

  const color = avatarColor(partnerEmail);
  const isAudioOnly = session.call_type === "audio";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "#0a0a0f", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      {/* Remote video — fills screen, NEVER muted (audio plays through device speaker) */}
      <div className="absolute inset-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          // DO NOT set muted here — remote audio must play through speaker
          className="w-full h-full object-cover"
          style={{ display: remoteVideoActive && !isAudioOnly ? "block" : "none" }}
        />
        {(!remoteVideoActive || isAudioOnly) && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4"
            style={{ background: "linear-gradient(160deg, #0f0c29, #302b63, #24243e)" }}>
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
              {status === "ended" ? "Call ended" : status === "active" ? formatDuration(callDuration) : "Connecting…"}
            </p>
            {status === "connecting" && (
              <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin mt-2" />
            )}
          </div>
        )}
      </div>

      {/* Local video PiP — always muted to prevent local echo */}
      {!isAudioOnly && (
        <div className="absolute z-10 rounded-2xl overflow-hidden shadow-xl"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 72px)", right: 16, width: 100, height: 140, border: "2px solid rgba(255,255,255,0.3)", background: "#111" }}>
          <video ref={localVideoRef} autoPlay playsInline muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      )}

      {/* Hidden local audio element for audio-only calls — always muted */}
      {isAudioOnly && <video ref={localVideoRef} autoPlay playsInline muted style={{ display: "none" }} />}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 shrink-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)" }}>
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
      <div className="absolute bottom-0 left-0 right-0 z-10"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)", paddingBottom: "max(env(safe-area-inset-bottom, 0px), 36px)", paddingTop: 24, paddingLeft: 32, paddingRight: 32 }}>
        <div className="flex items-center justify-around">
          <button onClick={toggleMic}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: micMuted ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)" }}>
            {micMuted ? <MicOff className="w-6 h-6" style={{ color: "#111" }} /> : <Mic className="w-6 h-6 text-white" />}
          </button>

          <button onClick={() => handleEnd(true)}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#E53935", boxShadow: "0 8px 24px rgba(229,57,53,0.5)" }}>
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          {!isAudioOnly ? (
            <button onClick={toggleVideo}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: videoOff ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)" }}>
              {videoOff ? <VideoOff className="w-6 h-6" style={{ color: "#111" }} /> : <Video className="w-6 h-6 text-white" />}
            </button>
          ) : <div className="w-14 h-14" />}
        </div>

        {/* Secondary row */}
        <div className="flex items-center justify-around mt-4">
          {!isAudioOnly && (
            <button onClick={flipCamera}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <RotateCcw className="w-5 h-5 text-white" />
            </button>
          )}
          {!isAudioOnly && (
            <button onClick={toggleScreenShare}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: screenSharing ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)" }}>
              {screenSharing
                ? <MonitorOff className="w-5 h-5" style={{ color: "#111" }} />
                : <Monitor className="w-5 h-5 text-white" />}
            </button>
          )}
          <button onClick={() => setShowAddPerson(v => !v)}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: showAddPerson ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)" }}>
            <UserPlus className="w-5 h-5" style={{ color: showAddPerson ? "#111" : "#fff" }} />
          </button>
        </div>

        {showAddPerson && (
          <div className="mt-3 flex gap-2">
            <input
              type="email"
              value={addPersonEmail}
              onChange={e => setAddPersonEmail(e.target.value)}
              placeholder="Enter email to invite…"
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", minHeight: 40 }}
            />
            <button onClick={handleAddPerson}
              className="px-4 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: "var(--accent-primary)", minHeight: 40 }}>
              Invite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}