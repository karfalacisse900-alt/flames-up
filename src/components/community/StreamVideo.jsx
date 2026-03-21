import React, { useRef, useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

// Global singleton — only one video plays at a time
const activeIframe = { id: null };

function extractVideoId(src) {
  if (!src) return null;
  // Already a bare 32-char hex video ID
  if (/^[a-f0-9]{32}$/.test(src)) return src;
  // HLS or iframe URL containing the ID
  const m = src.match(/([a-f0-9]{32})/);
  return m ? m[1] : null;
}

export function isStreamVideo(src) {
  if (!src) return false;
  return /^[a-f0-9]{32}$/.test(src) || src.includes("cloudflarestream.com");
}

function buildEmbedUrl(videoId, { autoplay = false, muted = true } = {}) {
  const params = new URLSearchParams({
    loop: "true",
    controls: "false",
    preload: "auto",
  });
  if (autoplay) params.set("autoplay", "true");
  if (muted) params.set("muted", "true");
  return `https://iframe.cloudflarestream.com/${videoId}?${params.toString()}`;
}

export default function StreamVideo({ src, postId, onDoubleTap }) {
  const [muted, setMuted] = useState(true); // start muted for autoplay policy
  const [playing, setPlaying] = useState(false);
  const [showIcon, setShowIcon] = useState(null);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const instanceId = useRef(postId || Math.random().toString(36).slice(2));
  const iconTimer = useRef(null);
  const tapTimer = useRef(null);
  const tapCount = useRef(0);
  const hasUnmuted = useRef(false);

  const videoId = extractVideoId(src);

  const flashIcon = (icon) => {
    setShowIcon(icon);
    clearTimeout(iconTimer.current);
    iconTimer.current = setTimeout(() => setShowIcon(null), 700);
  };

  const sendMessage = useCallback((method) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ method }), "*");
    } catch (_) {}
  }, []);

  const pauseVideo = useCallback(() => {
    sendMessage("pause");
    setPlaying(false);
  }, [sendMessage]);

  const playVideo = useCallback(() => {
    if (activeIframe.id && activeIframe.id !== instanceId.current) {
      window.dispatchEvent(new CustomEvent("stream_pause_all", { detail: instanceId.current }));
    }
    activeIframe.id = instanceId.current;
    sendMessage("play");
    setPlaying(true);

    // Unmute on first play only if not already unmuted
    if (!hasUnmuted.current && muted) {
      hasUnmuted.current = true;
      setTimeout(() => {
        sendMessage("unmute");
        setMuted(false);
      }, 500);
    }
  }, [sendMessage, muted]);

  // Listen for pause-all events from other videos
  useEffect(() => {
    const handler = (e) => {
      if (e.detail !== instanceId.current) pauseVideo();
    };
    window.addEventListener("stream_pause_all", handler);
    return () => window.removeEventListener("stream_pause_all", handler);
  }, [pauseVideo]);

  // IntersectionObserver: autoplay when 60% visible, pause when less than 60%
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) {
          playVideo();
        } else if (entry.intersectionRatio < 0.6) {
          pauseVideo();
        }
      },
      { threshold: [0, 0.6, 1.0] }
    );
    obs.observe(container);
    return () => { obs.disconnect(); pauseVideo(); };
  }, [playVideo, pauseVideo]);

  const toggleMute = (e) => {
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    sendMessage(next ? "mute" : "unmute");
    if (next === false) hasUnmuted.current = true;
  };

  const handleTap = () => {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (tapCount.current >= 2) {
        flashIcon("like");
        onDoubleTap?.();
      } else {
        if (playing) { pauseVideo(); flashIcon("pause"); }
        else { playVideo(); flashIcon("play"); }
      }
      tapCount.current = 0;
    }, 250);
  };

  if (!videoId) return null;

  // Build embed URL — always start muted so browser allows autoplay
  const embedUrl = buildEmbedUrl(videoId, { autoplay: true, muted: true });

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      className="relative w-full overflow-hidden"
      style={{
        borderRadius: 16,
        aspectRatio: "9/16",
        maxHeight: "80vh",
        cursor: "pointer",
        userSelect: "none",
        background: "#000",
        overflow: "hidden",
        WebkitUserSelectAll: "none",
        touchAction: "manipulation",
      }}
    >
      {/* Scale iframe to cover container without letterboxing */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        style={{
          border: "none",
          zIndex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: "scale(1.02)",
          objectFit: "cover",
        }}
      />

      {/* Transparent tap capture overlay */}
      <div className="absolute inset-0" style={{ zIndex: 2 }} />

      {/* Mute toggle */}
      <div className="absolute bottom-3 right-3" style={{ zIndex: 3 }}>
        <button
          onClick={toggleMute}
          className="p-2 rounded-full active:scale-95 transition-transform"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "#fff", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Tap icon feedback */}
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4 }}>
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 64, height: 64, backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", animation: "tapFade 0.7s ease forwards" }}>
            {showIcon === "like" ? <span style={{ fontSize: 32 }}>❤️</span>
              : showIcon === "play" ? <Play className="w-7 h-7 text-white" fill="white" />
              : <Pause className="w-7 h-7 text-white" fill="white" />}
          </div>
        </div>
      )}

      <style>{`
        @keyframes tapFade {
          0%   { opacity: 0; transform: scale(0.6); }
          20%  { opacity: 1; transform: scale(1.1); }
          70%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}