import React, { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["#7C3AED", "#0F766E", "#E53935", "#D97706", "#1D4ED8"];
const avatarColor = (email) => COLORS[(email || "a").charCodeAt(0) % COLORS.length];

export default function IncomingCallOverlay({ session, onAccept, onDecline }) {
  const ringRef = useRef(null);

  // Vibrate on incoming call (mobile)
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
    return () => { if (navigator.vibrate) navigator.vibrate(0); };
  }, []);

  const name = session.caller_name || session.caller_email?.split("@")[0] || "Someone";
  const color = avatarColor(session.caller_email);

  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(160deg, #0f0c29, #302b63, #24243e)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Pulsing avatar rings */}
      <div className="relative flex items-center justify-center mb-8">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ border: `2px solid rgba(255,255,255,${0.15 - i * 0.04})`, width: 80 + i * 44, height: 80 + i * 44 }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden relative z-10"
          style={{ background: `linear-gradient(135deg, ${color}, #7C3AED)`, color: "#fff", border: "3px solid rgba(255,255,255,0.3)" }}
        >
          {session.caller_avatar ? (
            <img src={session.caller_avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            name[0]?.toUpperCase()
          )}
        </div>
      </div>

      {/* Caller info */}
      <p className="text-white/60 text-base mb-1 font-medium tracking-wide">Incoming {session.call_type === "audio" ? "Voice" : "Video"} Call</p>
      <h2 className="text-white text-3xl font-bold mb-2 text-center px-8">{name}</h2>
      <p className="text-white/40 text-sm mb-16">{session.caller_email}</p>

      {/* Accept / Decline */}
      <div className="flex items-center gap-16">
        {/* Decline */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDecline}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#E53935" }}
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </motion.button>
          <span className="text-white/60 text-sm">Decline</span>
        </div>

        {/* Accept */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onAccept}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#25D366" }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {session.call_type === "video"
              ? <Video className="w-7 h-7 text-white" />
              : <Phone className="w-7 h-7 text-white" />}
          </motion.button>
          <span className="text-white/60 text-sm">Accept</span>
        </div>
      </div>
    </motion.div>
  );
}