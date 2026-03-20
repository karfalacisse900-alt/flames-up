import React, { useRef, useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

// Session-level mute preference — unmuted by default
const sessionPrefs = { muted: false };

// Global singleton — only one video plays at a time
const activeIframe = { id: null };

function extractVideoId(src) {
  if (!src) return null;
  // Bare 32-char hex ID
  if (/^[a-f0-9]{32}$/.test(src)) return src;
  // Any cloudflarestream.com URL containing the ID
  const match = src.match(/([a-f0-9]{32})/);
  return match ? match[1] : null;
}

export function isStreamVideo(src) {
  if (!src) return false;
  return /^[a-f0-9]{32}$/.test(src) || src.includes("cloudflarestream.com");
}

function getEmbedUrl(videoId) {
  if (!videoId) return null;
  // Always start muted so browsers allow autoplay; we send unmute via postMessage after load
  return `https://iframe.cloudflarestream.com/${videoId}?autoplay=true&muted=true&loop=true&controls=false&preload=metadata`;
}

export default function StreamVideo({ src, postId, onDoubleTap }) {
  const videoId = extractVideoId(src);
  const [muted, setMuted] = useState(sessionPrefs.muted);
  const [playing, setPlaying] = useState(false);
  const [showIcon, setShowIcon] = useState(null);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const instanceId = useRef(postId || Math.random().toString(36).slice(2));
  const iconTimer = useRef(null);
  const tapTimer = useRef(null);
  const tapCount = useRef(0);
  const iframeReady = useRef(false);

  const flashIcon = (icon) => {
    setShowIcon(icon);
    clearTimeout(iconTimer.current);
    iconTimer.current = setTimeout(() => setShowIcon(null), 700);
  };

  const sendMessage = useCallback((method, value) => {
    const msg = value !== undefined
      ? JSON.stringify({ method, value })
      : JSON.stringify({ method });
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
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
    // Apply current mute preference after play
    setTimeout(() => {
      sendMessage("muted", sessionPrefs.muted);
    }, 200);
  }, [sendMessage]);

  // Listen for messages from the iframe (Stream SDK events)
  useEffect(() => {
    const handler = (e) => {
      if (!e.data) return;
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data.event === "ready") {
          iframeReady.current = true;
          // If this video is supposed to be playing, play it now
          if (activeIframe.id === instanceId.current) {
            sendMessage("play");
            setTimeout(() => sendMessage("muted", sessionPrefs.muted), 100);
          }
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [sendMessage]);

  // Pause when another stream video starts
  useEffect(() => {
    const handler = (e) => {
      if (e.detail !== instanceId.current) pauseVideo();
    };
    window.addEventListener("stream_pause_all", handler);
    return () => window.removeEventListener("stream_pause_all", handler);
  }, [pauseVideo]);

  // IntersectionObserver for autoplay/pause
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) playVideo();
        else pauseVideo();
      },
      { threshold: [0, 0.6] }
    );
    obs.observe(container);
    return () => { obs.disconnect(); pauseVideo(); };
  }, [playVideo, pauseVideo]);

  const toggleMute = (e) => {
    e.stopPropagation();
    const next = !muted;
    sessionPrefs.muted = next;
    setMuted(next);
    sendMessage("muted", next);
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

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      className="relative w-full overflow-hidden"
      style={{
        borderRadius: 16,
        aspectRatio: "9/16",
        maxHeight: "72vh",
        cursor: "pointer",
        userSelect: "none",
        background: "#000",
      }}
    >
      <iframe
        ref={iframeRef}
        src={getEmbedUrl(videoId)}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        style={{ border: "none", zIndex: 1, background: "transparent" }}
      />

      {/* Transparent tap capture layer — lets taps through to our handler */}
      <div className="absolute inset-0" style={{ zIndex: 2 }} />

      {/* Mute toggle */}
      <div className="absolute bottom-3 right-3" style={{ zIndex: 3 }}>
        <button
          onClick={toggleMute}
          className="p-2 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "#fff" }}
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