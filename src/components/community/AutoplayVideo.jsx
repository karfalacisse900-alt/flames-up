import React, { useRef, useEffect, useState, useCallback } from "react";
import { Volume2, VolumeX, Maximize2, Pause, Play } from "lucide-react";

// Session-level mute preference — unmuted by default
const sessionPrefs = { muted: false };

// Global singleton — only one video plays at a time
const activeVideo = { ref: null, setPlaying: null };

// Continue-watching progress store (postId → seconds)
const videoProgress = {};

export default function AutoplayVideo({ src, postId, onDoubleTap }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [muted, setMuted] = useState(sessionPrefs.muted);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showIcon, setShowIcon] = useState(null); // "play" | "pause" | "like"
  const [savedProgress, setSavedProgress] = useState(postId ? videoProgress[postId] || 0 : 0);
  // eslint-disable-next-line no-unused-vars
  const [aspect, setAspect] = useState("9/16");
  const iconTimer = useRef(null);
  const tapTimer = useRef(null);
  const tapCount = useRef(0);
  const progressTimer = useRef(null);

  const flashIcon = (icon) => {
    setShowIcon(icon);
    clearTimeout(iconTimer.current);
    iconTimer.current = setTimeout(() => setShowIcon(null), 700);
  };

  const pauseGlobally = useCallback(() => {
    if (activeVideo.ref === videoRef) {
      activeVideo.ref = null;
      activeVideo.setPlaying = null;
    }
  }, []);

  const doPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    // Pause the previous active video
    if (activeVideo.ref && activeVideo.ref !== videoRef) {
      activeVideo.ref.current?.pause();
      activeVideo.setPlaying?.(false);
    }
    activeVideo.ref = videoRef;
    activeVideo.setPlaying = setPlaying;
    v.muted = sessionPrefs.muted;
    setMuted(sessionPrefs.muted);
    // Resume from saved position
    if (postId && videoProgress[postId] > 2) {
      v.currentTime = videoProgress[postId];
    }
    v.play().then(() => {
      setPlaying(true);
      setSavedProgress(0); // hide banner once playing
      // Save progress every second
      clearInterval(progressTimer.current);
      progressTimer.current = setInterval(() => {
        if (!v.paused && postId) videoProgress[postId] = Math.floor(v.currentTime);
      }, 1000);
    }).catch(() => {});
  }, [postId]);

  const doPause = useCallback(() => {
    const v = videoRef.current;
    if (v && postId) videoProgress[postId] = Math.floor(v.currentTime);
    clearInterval(progressTimer.current);
    v?.pause();
    setPlaying(false);
    pauseGlobally();
  }, [pauseGlobally, postId]);



  // IntersectionObserver for autoplay
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          doPlay();
        } else {
          doPause();
        }
      },
      { threshold: [0, 0.6] }
    );
    obs.observe(container);
    return () => {
      obs.disconnect();
      clearInterval(progressTimer.current);
      doPause();
    };
  }, [doPlay, doPause]);

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    sessionPrefs.muted = next;
    v.muted = next;
    setMuted(next);
  };

  const openFullscreen = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iOS Safari
  };

  const handleTap = () => {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (tapCount.current >= 2) {
        // Double tap → like
        flashIcon("like");
        onDoubleTap?.();
      } else {
        // Single tap → play/pause
        if (playing) {
          doPause();
          flashIcon("pause");
        } else {
          doPlay();
          flashIcon("play");
        }
      }
      tapCount.current = 0;
    }, 250);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      className="relative w-full overflow-hidden"
      style={{
        borderRadius: 16,
        aspectRatio: loaded ? "4/5" : undefined,
        maxHeight: loaded ? "80vh" : undefined,
        width: "100%",
        cursor: "pointer",
        userSelect: "none",
        background: loaded ? "#000" : "transparent",
      }}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        loop
        preload="metadata"
        onLoadedMetadata={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: loaded ? "block" : "none" }}
      />

      {/* Tap icon feedback */}
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 64, height: 64,
              backgroundColor: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              animation: "tapFade 0.7s ease forwards",
            }}
          >
            {showIcon === "like" ? (
              <span style={{ fontSize: 32 }}>❤️</span>
            ) : showIcon === "play" ? (
              <Play className="w-7 h-7 text-white" fill="white" />
            ) : (
              <Pause className="w-7 h-7 text-white" fill="white" />
            )}
          </div>
        </div>
      )}

      {/* Continue Watching banner */}
      {savedProgress > 2 && !playing && (
        <div
          className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 10 }}
        >
          <Play className="w-3 h-3" fill="white" />
          Continue from {Math.floor(savedProgress / 60)}:{String(savedProgress % 60).padStart(2, "0")}
        </div>
      )}

      {/* Bottom controls */}
      {loaded && (
        <div className="absolute bottom-3 right-3 flex gap-2 pointer-events-auto">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "#fff" }}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={openFullscreen}
            className="p-2 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "#fff" }}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
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