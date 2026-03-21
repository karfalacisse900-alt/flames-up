import React, { useRef, useEffect, useState, useCallback } from "react";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import StreamVideo, { isStreamVideo } from "./StreamVideo";

// Session-level mute preference — start muted for autoplay policy compliance
const sessionPrefs = { muted: true };

// Global: only one video plays at a time
let activeVideoRef = null;
let activeSetPlaying = null;

export default function AutoplayVideo({ src, postId, onDoubleTap }) {
  if (isStreamVideo(src)) {
    return <StreamVideo src={src} postId={postId} onDoubleTap={onDoubleTap} />;
  }

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [muted, setMuted] = useState(sessionPrefs.muted);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [showIcon, setShowIcon] = useState(null); // "play" | "pause" | "like"
  const iconTimer = useRef(null);
  const tapTimer = useRef(null);
  const tapCount = useRef(0);
  const playingRef = useRef(false);
  const inViewport = useRef(false);
  const userPaused = useRef(false);
  const srcSet = useRef(false); // whether we've assigned src yet

  // Keep playingRef in sync
  useEffect(() => { playingRef.current = playing; }, [playing]);

  const flashIcon = (icon) => {
    setShowIcon(icon);
    clearTimeout(iconTimer.current);
    iconTimer.current = setTimeout(() => setShowIcon(null), 600);
  };

  const stopGlobal = () => {
    if (activeVideoRef && activeVideoRef !== videoRef) {
      activeVideoRef.current?.pause();
      activeSetPlaying?.(false);
    }
  };

  const doPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    stopGlobal();
    activeVideoRef = videoRef;
    activeSetPlaying = setPlaying;
    v.muted = sessionPrefs.muted;
    setMuted(sessionPrefs.muted);
    v.play().then(() => {
      setPlaying(true);
      setBuffering(false);
    }).catch(() => {
      // Autoplay blocked — try muted
      v.muted = true;
      sessionPrefs.muted = true;
      setMuted(true);
      v.play().then(() => {
        setPlaying(true);
        setBuffering(false);
      }).catch(() => {
        setPlaying(false);
        setBuffering(false);
      });
    });
  }, []);

  const doPause = useCallback(() => {
    const v = videoRef.current;
    v?.pause();
    setPlaying(false);
    if (activeVideoRef === videoRef) {
      activeVideoRef = null;
      activeSetPlaying = null;
    }
  }, []);

  // Intersection Observer — pause when out of viewport, play when back in (if not user-paused)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          inViewport.current = true;
          // Assign src lazily on first viewport entry
          if (videoRef.current && !srcSet.current) {
            videoRef.current.src = src;
            srcSet.current = true;
          }
          if (!userPaused.current) {
            doPlay();
          }
        } else if (!entry.isIntersecting) {
          inViewport.current = false;
          doPause();
        }
      },
      { threshold: [0, 0.5, 1.0] }
    );
    obs.observe(container);
    return () => {
      obs.disconnect();
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

  // Tap handler — single tap toggles play/pause, double tap likes
  const handleTap = useCallback((e) => {
    e.stopPropagation();
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      const count = tapCount.current;
      tapCount.current = 0;
      if (count >= 2) {
        flashIcon("like");
        onDoubleTap?.();
      } else {
        if (playingRef.current) {
          userPaused.current = true;
          doPause();
          flashIcon("pause");
        } else {
          userPaused.current = false;
          doPlay();
          flashIcon("play");
        }
      }
    }, 220);
  }, [doPlay, doPause, onDoubleTap]);

  const markLoaded = () => { setLoaded(true); setBuffering(false); };

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
        background: "#000",
      }}
    >
      {/* Skeleton shimmer before loaded */}
      {!loaded && (
        <div className="absolute inset-0 z-10" style={{
          background: "linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)",
          backgroundSize: "200% 100%",
          animation: "videoShimmer 1.4s ease-in-out infinite",
        }} />
      )}

      {/* Buffering spinner */}
      {buffering && loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
        </div>
      )}

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
        onWaiting={() => { if (loaded) setBuffering(true); }}
        onPlaying={() => { setBuffering(false); setLoaded(true); setPlaying(true); }}
        onPause={() => setPlaying(false)}
        onError={markLoaded}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", objectPosition: "center", zIndex: 1, display: "block" }}
      />

      {/* Tap feedback icon */}
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 5 }}>
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 64, height: 64, backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", animation: "tapFade 0.6s ease forwards" }}>
            {showIcon === "like" ? <span style={{ fontSize: 32 }}>❤️</span>
              : showIcon === "play" ? <Play className="w-7 h-7 text-white" fill="white" />
              : <Pause className="w-7 h-7 text-white" fill="white" />}
          </div>
        </div>
      )}

      {/* Paused overlay */}
      {loaded && !playing && !buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3, backgroundColor: "rgba(0,0,0,0.25)" }}>
          <div className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
            <Play className="w-6 h-6 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Mute button */}
      {loaded && (
        <div className="absolute bottom-3 right-3 z-10 pointer-events-auto">
          <button onClick={toggleMute} className="p-2 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "#fff" }}>
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      <style>{`
        @keyframes tapFade {
          0%   { opacity: 0; transform: scale(0.6); }
          20%  { opacity: 1; transform: scale(1.15); }
          70%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes videoShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}