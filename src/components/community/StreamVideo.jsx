import React, { useRef, useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

// Session-level mute preference
const sessionPrefs = { muted: true };

// Global singleton — only one video plays at a time
const activeIframe = { id: null };

/**
 * Detects if a URL is a Cloudflare Stream video ID or HLS URL.
 * Returns the Cloudflare Stream iframe embed URL.
 */
function getStreamEmbedUrl(src, muted) {
  if (!src) return null;
  // Already a stream video ID (32-char hex)
  if (/^[a-f0-9]{32}$/.test(src)) {
    return `https://iframe.cloudflarestream.com/${src}?autoplay=true&muted=${muted ? 1 : 0}&loop=true&controls=false&preload=metadata`;
  }
  // HLS manifest URL from cloudflarestream.com
  const hlsMatch = src.match(/cloudflarestream\.com\/([a-f0-9]{32})\//);
  if (hlsMatch) {
    return `https://iframe.cloudflarestream.com/${hlsMatch[1]}?autoplay=true&muted=${muted ? 1 : 0}&loop=true&controls=false&preload=metadata`;
  }
  return null;
}

export function isStreamVideo(src) {
  if (!src) return false;
  return /^[a-f0-9]{32}$/.test(src) || src.includes("cloudflarestream.com");
}

export default function StreamVideo({ src, postId, onDoubleTap }) {
  const [muted, setMuted] = useState(sessionPrefs.muted);
  const [playing, setPlaying] = useState(false);
  const [showIcon, setShowIcon] = useState(null);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const instanceId = useRef(postId || Math.random().toString(36).slice(2));
  const iconTimer = useRef(null);
  const tapTimer = useRef(null);
  const tapCount = useRef(0);

  const embedUrl = getStreamEmbedUrl(src, muted);

  const flashIcon = (icon) => {
    setShowIcon(icon);
    clearTimeout(iconTimer.current);
    iconTimer.current = setTimeout(() => setShowIcon(null), 700);
  };

  const pauseVideo = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage('{"method":"pause"}', "*");
    setPlaying(false);
  }, []);

  const playVideo = useCallback(() => {
    // Pause any other playing stream video
    if (activeIframe.id && activeIframe.id !== instanceId.current) {
      window.dispatchEvent(new CustomEvent("stream_pause_all", { detail: instanceId.current }));
    }
    activeIframe.id = instanceId.current;
    iframeRef.current?.contentWindow?.postMessage('{"method":"play"}', "*");
    setPlaying(true);
  }, []);

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
    // Reload iframe with new mute state — simplest way to toggle mute on CF stream iframe
    if (iframeRef.current) {
      iframeRef.current.src = getStreamEmbedUrl(src, next);
      setTimeout(() => playVideo(), 300);
    }
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

  if (!embedUrl) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      className="relative w-full overflow-hidden"
      style={{
        borderRadius: 16,
        aspectRatio: "4/5",
        maxHeight: "56vh",
        cursor: "pointer",
        userSelect: "none",
        background: "#1a1a1a",
      }}
    >
      <iframe
        ref={iframeRef}
        src={embedUrl}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        style={{ border: "none", zIndex: 1 }}
      />

      {/* Transparent tap capture layer */}
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