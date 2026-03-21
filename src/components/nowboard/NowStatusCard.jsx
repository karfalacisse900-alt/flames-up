import React, { useState, useEffect } from "react";

export default function NowStatusCard({ status, currentUser, onView }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(status.expires_at) - new Date();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      if (days > 0) setTimeLeft(`${days}d`);
      else if (hours > 0) setTimeLeft(`${hours}h`);
      else setTimeLeft(`${mins}m`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [status.expires_at]);

  const TEXT_POSITION_STYLES = {
    "top-left":      { top: 8, left: 10, textAlign: "left" },
    "top-center":    { top: 8, left: "50%", transform: "translateX(-50%)", textAlign: "center" },
    "top-right":     { top: 8, right: 10, textAlign: "right" },
    "center-left":   { top: "50%", left: 10, transform: "translateY(-50%)", textAlign: "left" },
    "center":        { top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" },
    "center-right":  { top: "50%", right: 10, transform: "translateY(-50%)", textAlign: "right" },
    "bottom-left":   { bottom: 10, left: 10, textAlign: "left" },
    "bottom-center": { bottom: 10, left: "50%", transform: "translateX(-50%)", textAlign: "center" },
    "bottom-right":  { bottom: 10, right: 10, textAlign: "right" },
  };
  const textPosStyle = TEXT_POSITION_STYLES[status.text_position] || TEXT_POSITION_STYLES["center"];
  const textFontSize = Math.max(12, Math.round((status.text_size || 24) * 0.6));

  const hasMedia = status.image_url || status.video_url;
  const bgStyle = hasMedia
    ? { backgroundColor: "#000" }
    : { background: status.background || "linear-gradient(135deg, #7C3AED, #4F46E5)" };

  return (
    <div
      onClick={onView}
      className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-95"
      style={{ ...bgStyle, aspectRatio: "9/16", boxShadow: "var(--elevation-2)" }}
    >
      {/* Background image */}
      {status.image_url && (
        <img src={status.image_url} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
      )}
      {/* Background video */}
      {status.video_url && (
        <video src={status.video_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
      )}
      {/* Overlay for readability */}
      {hasMedia && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />}

      {/* Author strip at top */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-1.5 px-2 pt-2">
        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-[9px]"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          {status.author_avatar_url
            ? <img src={status.author_avatar_url} alt="" className="w-full h-full object-cover" />
            : (status.author_name || "U")[0]?.toUpperCase()}
        </div>
        <span className="text-white text-[10px] font-semibold truncate flex-1" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
          {status.author_name?.split(" ")[0] || "User"}
        </span>
        <span className="text-white/70 text-[9px] font-medium shrink-0">{timeLeft}</span>
      </div>

      {/* Overlay text at position */}
      {status.text && (
        <div className="absolute z-10 max-w-[90%]" style={{ ...textPosStyle }}>
          <p style={{
            color: "#fff",
            fontFamily: "var(--font-serif)",
            fontSize: textFontSize,
            fontWeight: 700,
            lineHeight: 1.25,
            textAlign: textPosStyle.textAlign,
            textShadow: "0 1px 8px rgba(0,0,0,0.8)",
          }}>
            {status.text}
          </p>
        </div>
      )}
    </div>
  );
}