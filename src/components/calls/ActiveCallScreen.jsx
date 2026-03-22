import React, { useState, useEffect, useRef, useCallback } from "react";
import { PhoneOff, Users, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

// Jitsi config — no login, no popup, no moderator requirement
function buildJitsiUrl(roomId, displayName, callType) {
  const room = `flamesup-${roomId}`;
  const params = new URLSearchParams({
    // Core: disable ALL auth / login
    "config.prejoinPageEnabled": "false",
    "config.requireDisplayName": "false",
    "config.enableWelcomePage": "false",
    "config.disableDeepLinking": "true",
    "config.disableThirdPartyRequests": "true",
    // No moderator / lobby
    "config.lobby.autoKnock": "false",
    "config.securityUi.hideLobbyButton": "true",
    "config.hiddenPremadeBackgroundEnabled": "false",
    // Audio/video defaults
    "config.startWithAudioMuted": "false",
    "config.startWithVideoMuted": callType === "audio" ? "true" : "false",
    // UI cleanup
    "interfaceConfig.SHOW_JITSI_WATERMARK": "false",
    "interfaceConfig.SHOW_WATERMARK_FOR_GUESTS": "false",
    "interfaceConfig.SHOW_POWERED_BY": "false",
    "interfaceConfig.SHOW_BRAND_WATERMARK": "false",
    "interfaceConfig.SHOW_CHROME_EXTENSION_BANNER": "false",
    "interfaceConfig.MOBILE_APP_PROMO": "false",
    "interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS": "true",
    // Display name
    "userInfo.displayName": displayName,
  });
  return `https://meet.jit.si/${room}#${params.toString()}`;
}

const COLORS = ["#7C3AED", "#0F766E", "#E53935", "#D97706", "#1D4ED8"];
const avatarColor = (email) => COLORS[(email || "a").charCodeAt(0) % COLORS.length];

export default function ActiveCallScreen({ session, currentUser, onEnd }) {
  const [status, setStatus] = useState("connecting"); // connecting | active | ended
  const [callDuration, setCallDuration] = useState(0);
  const [showInvite, setShowInvite] = useState(false);
  const [follows, setFollows] = useState([]);
  const durationRef = useRef(null);
  const iframeRef = useRef(null);

  const partnerEmail = session.caller_email === currentUser.email
    ? session.callee_email
    : session.caller_email;
  const partnerName = session.caller_email === currentUser.email
    ? (session.callee_name || session.callee_email?.split("@")[0])
    : (session.caller_name || session.caller_email?.split("@")[0]);

  const displayName = currentUser.full_name || currentUser.email?.split("@")[0] || "User";
  const jitsiUrl = buildJitsiUrl(session.room_id, displayName, session.call_type);

  // Mark active after iframe loads
  const handleIframeLoad = useCallback(() => {
    setStatus("active");
    base44.entities.CallSession.update(session.id, { status: "active" }).catch(() => {});
  }, [session.id]);

  // Duration timer
  useEffect(() => {
    if (status !== "active") return;
    durationRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(durationRef.current);
  }, [status]);

  // Watch for remote hang-up
  useEffect(() => {
    const unsub = base44.entities.CallSession.subscribe((event) => {
      if (event.id === session.id && event.data?.status === "ended") {
        handleEnd(false);
      }
    });
    return unsub;
  }, [session.id]);

  // Jitsi postMessage hang-up
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.action === "hangup" || e.data?.event === "VIDEO_CONFERENCE_LEFT") {
        handleEnd(true);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleEnd = useCallback(async (selfInitiated = true) => {
    setStatus("ended");
    clearInterval(durationRef.current);
    if (selfInitiated) {
      await base44.entities.CallSession.update(session.id, {
        status: "ended",
        ended_at: new Date().toISOString(),
      }).catch(() => {});
    }
    setTimeout(onEnd, 1200);
  }, [session.id, onEnd]);

  // Load follows for invite
  const loadFollows = useCallback(async () => {
    const f = await base44.entities.Follow.filter({ follower_email: currentUser.email });
    setFollows(f);
  }, [currentUser.email]);

  const handleInvite = async (email, name) => {
    const maxParticipants = session.participant_emails || [];
    if (maxParticipants.length >= 10) return;
    // Add to participant list
    await base44.entities.CallSession.update(session.id, {
      participant_emails: [...maxParticipants, email],
    }).catch(() => {});
    // Send notification
    await base44.entities.Notification.create({
      recipient_email: email,
      actor_email: currentUser.email,
      actor_name: displayName,
      type: "creator_live",
      post_text: `${displayName} is inviting you to join a call`,
      ref_id: session.room_id,
      is_read: false,
    }).catch(() => {});
    setShowInvite(false);
  };

  const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
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
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${color}, #7C3AED)`, color: "#fff" }}
          >
            {partnerName?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{partnerName}</p>
            <p className="text-white/50 text-xs">
              {status === "connecting" ? "Connecting…" : status === "ended" ? "Call ended" : formatDuration(callDuration)}
            </p>
          </div>
          {status === "active" && (
            <div className="w-2 h-2 rounded-full ml-1 animate-pulse" style={{ backgroundColor: "#25D366" }} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadFollows(); setShowInvite(true); }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <Users className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => handleEnd(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#E53935" }}
          >
            <PhoneOff className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Jitsi iframe — fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        {status === "ended" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ backgroundColor: "#0a0a0f" }}>
            <PhoneOff className="w-14 h-14 text-white/30" />
            <p className="text-white/60 text-lg font-semibold">Call ended</p>
            <p className="text-white/30 text-sm">{formatDuration(callDuration)}</p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={jitsiUrl}
            allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
            allowFullScreen
            className="w-full h-full border-0"
            title="Video Call"
            onLoad={handleIframeLoad}
          />
        )}

        {/* Connecting overlay */}
        {status === "connecting" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10 }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <p className="text-white/70 font-medium">Connecting to {partnerName}…</p>
          </div>
        )}
      </div>

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[210]"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
              onClick={() => setShowInvite(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[220] rounded-t-3xl overflow-hidden"
              style={{ backgroundColor: "#1a1a2e", maxHeight: "70vh" }}
            >
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h3 className="text-white font-bold text-base">Invite to Call</h3>
                <button onClick={() => setShowInvite(false)} className="text-white/50 text-sm">Cancel</button>
              </div>
              <div className="overflow-y-auto px-2 pb-6" style={{ maxHeight: "55vh" }}>
                {follows.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-8">No contacts to invite</p>
                ) : (
                  follows.map(f => (
                    <button
                      key={f.following_email}
                      onClick={() => handleInvite(f.following_email, f.following_name)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl"
                      style={{ color: "#fff" }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: `linear-gradient(135deg, ${avatarColor(f.following_email)}, #7C3AED)`, color: "#fff" }}
                      >
                        {(f.following_name || f.following_email)?.[0]?.toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{f.following_name || f.following_email?.split("@")[0]}</p>
                        <p className="text-white/40 text-xs">{f.following_email}</p>
                      </div>
                      <div
                        className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: "#25D366", color: "#fff" }}
                      >
                        Invite
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}