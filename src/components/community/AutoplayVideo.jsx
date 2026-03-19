import React, { useRef, useEffect, useState, useCallback } from "react";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";

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
  const [visible, setVisible] = useState(false); // lazy: only load src when visible
  const [buffering, setBuffering] = useState(false);
  const [showIcon, setShowIcon] = useState(null); // "play" | "pause" | "like"
  const [savedProgress, setSavedProgress] = useState(postId ? videoProgress[postId] || 0 : 0);
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
    if (activeVideo.ref && activeVideo.ref !== videoRef) {
      activeVideo.ref.current?.pause();
      activeVideo.setPlaying?.(false);
    }
    activeVideo.ref = videoRef;
    activeVideo.setPlaying = setPlaying;
    v.muted = sessionPrefs.muted;
    setMuted(sessionPrefs.muted);
    if (postId && videoProgress[postId] > 2) {
      v.currentTime = videoProgress[postId];
    }
    // Force load before play
    if (v.readyState < 2) {
      v.load();
    }
    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setPlaying(true);
        setBuffering(false);
        setSavedProgress(0);
        clearInterval(progressTimer.current);
        progressTimer.current = setInterval(() => {
          if (!v.paused && postId) videoProgress[postId] = Math.floor(v.currentTime);
        }, 1000);
      }).catch((err) => {
        console.log("Video play failed:", err);
        setBuffering(false);
        setPlaying(false);
      });
    }
  }, [postId]);

  const doPause = useCallback(() => {
    const v = videoRef.current;
    if (v && postId) videoProgress[postId] = Math.floor(v.currentTime);
    clearInterval(progressTimer.current);
    v?.pause();
    setPlaying(false);
    pauseGlobally();
  }, [pauseGlobally, postId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true); // load src lazily only when entering viewport
          if (entry.intersectionRatio >= 0.6) {
            doPlay();
          }
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


  const handleTap = () => {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (tapCount.current >= 2) {
        flashIcon("like");
        onDoubleTap?.();
      } else {
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

  const markLoaded = () => {
    setLoaded(true);
    setBuffering(false);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      className="relative w-full overflow-hidden"
      style={{
        borderRadius: 16,
        aspectRatio: "4/5",
        maxHeight: "56vh",
        width: "100%",
        cursor: "pointer",
        userSelect: "none",
        background: "#1a1a1a",
      }}
    >
      {/* Dark placeholder before video loads, spinner only while buffering after load started */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#111", zIndex: 2 }}>
          {buffering && (
            <div className="w-9 h-9 rounded-full border-2 border-white/20 border-t-white/70 animate-spin opacity-60" />
          )}
        </div>
      )}

      {/*
        FIX — Black video bug:
        1. opacity is always 1 — the video element is never hidden.
           Previously `opacity: loaded ? 1 : 0` kept the video invisible if
           onLoadedMetadata never fired (mobile autoplay policy, CORS, slow network).
        2. preload="auto" instead of "metadata" so the browser downloads enough
           data to render a first frame immediately.
        3. muted={muted} prop keeps React's muted state in sync with the DOM attribute.
        4. Multiple load events (onLoadedMetadata, onCanPlay, onLoadedData, onError)
           all call markLoaded() so we catch whichever fires first.
      */}
      {/* Only inject src once visible — prevents eager loading for off-screen videos */}
      {visible && (
        <video
          ref={videoRef}
          src={src}
          playsInline
          loop
          muted={muted}
          preload="metadata"
          onLoadedMetadata={markLoaded}
          onCanPlay={markLoaded}
          onLoadedData={markLoaded}
          onError={markLoaded}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => { setBuffering(false); setLoaded(true); }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 1 }}
        />
      )}

      {/* Tap icon feedback */}
      {showIcon && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 5 }}
        >
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
          style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 4 }}
        >
          <Play className="w-3 h-3" fill="white" />
          Continue from {Math.floor(savedProgress / 60)}:{String(savedProgress % 60).padStart(2, "0")}
        </div>
      )}

      {/* Bottom controls */}
      {loaded && (
        <div className="absolute bottom-3 right-3 flex gap-2 pointer-events-auto" style={{ zIndex: 4 }}>
          <button
            onClick={toggleMute}
            className="p-2 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "#fff" }}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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