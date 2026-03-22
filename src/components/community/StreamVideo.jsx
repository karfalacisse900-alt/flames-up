import React, { useRef, useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

// Global singleton — only one video plays at a time
const activeIframe = { id: null };

function extractVideoId(src) {
  if (!src) return null;
  if (/^[a-f0-9]{32}$/.test(src)) return src;
  const m = src.match(/([a-f0-9]{32})/);
  return m ? m[1] : null;
}

export function isStreamVideo(src) {
  if (!src) return false;
  return /^[a-f0-9]{32}$/.test(src) || src.includes("cloudflarestream.com");
}

function buildEmbedUrl(videoId, muted) {
  const params = new URLSearchParams({
    loop: "true",
    autoplay: "true",
    preload: "auto",
    poster: "false",
    // fit=cover fills the iframe without letterboxing
    "letterboxColor": "transparent",
  });
  if (muted) params.set("muted", "true");
  // Do NOT set controls=false via URL — omit it instead (avoids Cloudflare error)
  return `https://iframe.cloudflarestream.com/${videoId}?${params.toString()}`;
}

export default function StreamVideo({ src, postId, onDoubleTap }) {
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showIcon, setShowIcon] = useState(null);
  // Rebuild URL when muted changes so the iframe re-loads with correct state
  const [embedUrl, setEmbedUrl] = useState("");
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const instanceId = useRef(postId || Math.random().toString(36).slice(2));
  const iconTimer = useRef(null);
  const tapTimer = useRef(null);
  const tapCount = useRef(0);
  const isInView = useRef(false);

  const videoId = extractVideoId(src);

  // Build URL on mount — always muted for autoplay compliance
  useEffect(() => {
    if (videoId) setEmbedUrl(buildEmbedUrl(videoId, true));
  }, [videoId]);

  const flashIcon = (icon) => {
    setShowIcon(icon);
    clearTimeout(iconTimer.current);
    iconTimer.current = setTimeout(() => setShowIcon(null), 700);
  };

  const sendMessage = useCallback((method, value) => {
    try {
      const msg = value !== undefined ? { method, value } : { method };
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
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
  }, [sendMessage]);

  // Listen for pause-all events from other videos
  useEffect(() => {
    const handler = (e) => {
      if (e.detail !== instanceId.current) pauseVideo();
    };
    window.addEventListener("stream_pause_all", handler);
    return () => window.removeEventListener("stream_pause_all", handler);
  }, [pauseVideo]);

  // IntersectionObserver: autoplay when 60% visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) {
          isInView.current = true;
          playVideo();
        } else {
          isInView.current = false;
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
    // Use postMessage to toggle mute without reloading iframe
    sendMessage(next ? "mute" : "unmute");
  };

  const handleTap = (e) => {
    e.stopPropagation();
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
        touchAction: "manipulation",
      }}
    >
      {/* iframe scaled to cover — eliminates black bars */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        style={{
          border: "none",
          position: "absolute",
          // Overscan to hide letterbox bars: scale up so object-fit cover fills the box
          top: "-5%",
          left: "-5%",
          width: "110%",
          height: "110%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Transparent tap capture overlay */}
      <div className="absolute inset-0" style={{ zIndex: 2 }} />

      {/* Mute toggle */}
      <div className="absolute bottom-3 right-3" style={{ zIndex: 3 }}>
        <button
          onClick={toggleMute}
          className="p-2 rounded-full active:scale-95 transition-transform"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            minWidth: 44,
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: "manipulation",
          }}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Tap icon feedback */}
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4 }}>
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 64, height: 64, backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", animation: "tapFade 0.7s ease forwards" }}
          >
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