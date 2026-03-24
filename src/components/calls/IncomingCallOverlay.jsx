import React, { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#7C3AED", "#0F766E", "#E53935", "#D97706", "#1D4ED8"];
const avatarColor = (email) => COLORS[(email || "a").charCodeAt(0) % COLORS.length];

const QUICK_REPLIES = [
  "Busy right now, please wait",
  "In a meeting. I'll call after",
  "Can't talk, text me!",
];

export default function IncomingCallOverlay({ session, onAccept, onDecline }) {
  const [showReplies, setShowReplies] = useState(false);
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleQuickReply = async (text) => {
    const convId = [session.callee_email, session.caller_email].sort().join("_");
    await base44.entities.DirectMessage.create({
      conversation_id: convId,
      sender_email: session.callee_email,
      sender_name: session.callee_name || session.callee_email,
      receiver_email: session.caller_email,
      text: `[Call declined] ${text}`,
      message_type: "text",
      is_read: false,
    }).catch(() => {});
    onDecline();
  };

  const name = session.caller_name || session.caller_email?.split("@")[0] || "Someone";
  const color = avatarColor(session.caller_email);
  const isVideo = session.call_type === "video";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top, 44px)",
        paddingBottom: "env(safe-area-inset-bottom, 34px)",
        overflow: "hidden",
      }}
    >
      {/* Blurred background — caller avatar as backdrop */}
      <div className="absolute inset-0">
        {session.caller_avatar ? (
          <img src={session.caller_avatar} alt="" className="w-full h-full object-cover" style={{ filter: "blur(28px) brightness(0.55) saturate(1.4)", transform: "scale(1.1)" }} />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)` }} />
        )}
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,10,20,0.55)" }} />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center flex-1 pt-12">

        {/* Call type label */}
        <p className="text-white/70 text-base font-medium mb-1 tracking-wide">
          Incoming {isVideo ? "Video" : "Voice"} Call
        </p>

        {/* Pulsing avatar */}
        <div className="relative flex items-center justify-center mt-4 mb-6">
          {[1, 2, 3].map(i => (
            <motion.div key={i} className="absolute rounded-full"
              style={{ width: 96 + i * 40, height: 96 + i * 40, border: `2px solid rgba(255,255,255,${0.18 - i * 0.05})` }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.12, 0.5] }}
              transition={{ duration: 2.2, delay: i * 0.45, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
          <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-4xl font-bold relative z-10"
            style={{ background: `linear-gradient(135deg, ${color}, #7C3AED)`, color: "#fff", border: "4px solid rgba(255,255,255,0.35)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
            {session.caller_avatar ? (
              <img src={session.caller_avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              name[0]?.toUpperCase()
            )}
          </div>
        </div>

        {/* Caller name */}
        <h2 className="text-white text-[28px] font-bold text-center px-6 leading-tight">{name}</h2>
        <p className="text-white/50 text-sm mt-1 mb-8">{session.caller_email}</p>

        {/* Quick reply toggle */}
        <button onClick={() => setShowReplies(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, minHeight: 38 }}>
          <MessageCircle className="w-4 h-4" />
          Message
        </button>

        {/* Quick replies */}
        <AnimatePresence>
          {showReplies && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-xs px-4 space-y-2 mb-4">
              {QUICK_REPLIES.map(r => (
                <button key={r} onClick={() => handleQuickReply(r)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons — iOS-style bottom row */}
      <div className="relative px-10 pb-4">
        <div className="flex items-center justify-between">

          {/* Decline */}
          <div className="flex flex-col items-center gap-3">
            <motion.button whileTap={{ scale: 0.88 }} onClick={onDecline}
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#E53935", boxShadow: "0 8px 32px rgba(229,57,53,0.5)" }}>
              <PhoneOff className="w-8 h-8 text-white" />
            </motion.button>
            <span className="text-white text-sm font-semibold">Decline</span>
          </div>

          {/* Accept (audio) */}
          {isVideo && (
            <div className="flex flex-col items-center gap-3">
              <motion.button whileTap={{ scale: 0.88 }} onClick={onAccept}
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#1C7737", boxShadow: "0 8px 32px rgba(28,119,55,0.4)" }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                <Phone className="w-8 h-8 text-white" />
              </motion.button>
              <span className="text-white text-sm font-semibold">Audio</span>
            </div>
          )}

          {/* Accept (video / main accept) */}
          <div className="flex flex-col items-center gap-3">
            <motion.button whileTap={{ scale: 0.88 }} onClick={onAccept}
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#25D366", boxShadow: "0 8px 32px rgba(37,211,102,0.5)" }}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
              {isVideo ? <Video className="w-8 h-8 text-white" /> : <Phone className="w-8 h-8 text-white" />}
            </motion.button>
            <span className="text-white text-sm font-semibold">Accept</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}