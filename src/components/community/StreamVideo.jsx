import React, { useRef, useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause, Loader2, AlertCircle } from "lucide-react";

// ── Global singleton: only one video plays at a time ──────────────────────────
const activePlayer = { pause: null };

// Detect Cloudflare Stream video ID (32-char hex) or URL
export function isStreamVideo(src) {
  if (!src) return false;
  return /^[a-f0-9]{32}$/.test(src) || src.includes("cloudflarestream.com");
}

function extractVideoId(src) {
  if (!src) return null;
  if (/^[a-f0-9]{32}$/.test(src)) return src;
  const m = src.match(/([a-f0-9]{32})/);
  return m ? m[1] : null;
}

// Session mute preference — start muted for autoplay compliance
const sessionPrefs = { muted: true };

export default function StreamVideo({ src, postId, thumbnail, onDoubleTap }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [muted, setMuted] = useState(sessionPrefs.muted);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [showIcon, setShowIcon] = useState(null);
  const iconTimer = useRef(null);
  const tapTimer = useRef(null);
  const tapCount = useRef(0);
  const userPaused = useRef(false);
  const playingRef = useRef(false);
  const srcLoaded = useRef(false);

  useEffect(() => { playingRef.current = playing; }, [playing]);

  const videoId = extractVideoId(src);

  // HLS URL from Cloudflare Stream — native HLS works on iOS Safari
  const hlsUrl = videoId
    ? `https://customer-y552ojl6mo04xwk9.cloudflarestream.com/${videoId}/manifest/video.m3u8`
    : null;

  const flashIcon = (type) => {
    setShowIcon(type);
    clearTimeout(iconTimer.current);
    iconTimer.current = setTimeout(() => setShowIcon(null), 600);
  };

  const stopOthers = () => {
    if (activePlayer.pause && activePlayer.pause !== doPause) {
      activePlayer.pause();
    }
  };

  const doPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || !hlsUrl) return;

    // Lazy-load src on first play
    if (!srcLoaded.current) {
      v.src = hlsUrl;
      srcLoaded.current = true;
    }

    stopOthers();
    activePlayer.pause = doPause;

    v.muted = sessionPrefs.muted;
    setMuted(sessionPrefs.muted);

    const tryPlay = () => {
      setBuffering(true);
      v.play().then(() => {
        setPlaying(true);
        setBuffering(false);
      }).catch(() => {
        // Autoplay blocked — retry muted
        v.muted = true;
        sessionPrefs.muted = true;
        setMuted(true);
        v.play().then(() => {
          setPlaying(true);
          setBuffering(false);
        }).catch(() => {
          setBuffering(false);
        });
      });
    };
    tryPlay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hlsUrl]);

  const doPause = useCallback(() => {
    const v = videoRef.current;
    v?.pause();
    setPlaying(false);
    setBuffering(false);
    if (activePlayer.pause === doPause) activePlayer.pause = null;
  }, []);

  // Intersection Observer — 60% visible = play
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hlsUrl) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.6) {
        if (!userPaused.current) doPlay();
      } else {
        doPause();
      }
    }, { threshold: [0, 0.6, 1.0] });

    obs.observe(el);
    return () => { obs.disconnect(); doPause(); };
  }, [doPlay, doPause, hlsUrl]);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    // Unmuting requires the video to have been interacted with
    v.muted = next;
    v.volume = next ? 0 : 1;
    sessionPrefs.muted = next;
    setMuted(next);
    // On iOS, we need a user gesture to enable audio — try replaying
    if (!next && v.paused === false) {
      const t = v.currentTime;
      v.pause();
      v.muted = false;
      v.volume = 1;
      v.currentTime = t;
      v.play().catch(() => {});
    }
  }, [muted]);

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

  if (!videoId) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      className="relative w-full overflow-hidden"
      style={{
        borderRadius: 0,
        aspectRatio: "9/16",
        maxHeight: "80vh",
        background: "#000",
        cursor: "pointer",
        touchAction: "manipulation",
        userSelect: "none",
      }}
    >
      {/* Thumbnail placeholder while not loaded */}
      {!loaded && thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", zIndex: 1 }}
        />
      )}

      {/* Shimmer if no thumbnail */}
      {!loaded && !thumbnail && (
        <div className="absolute inset-0 z-1" style={{
          background: "linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)",
          backgroundSize: "200% 100%",
          animation: "streamShimmer 1.4s linear infinite",
        }} />
      )}

      {/* Native video — HLS works natively on iOS Safari, Cloudflare also provides MP4 fallback */}
      <video
        ref={videoRef}
        playsInline
        loop
        muted={muted}
        preload="none"
        poster={thumbnail || undefined}
        onLoadedMetadata={() => setLoaded(true)}
        onCanPlay={() => setLoaded(true)}
        onPlaying={() => { setLoaded(true); setBuffering(false); setPlaying(true); }}
        onPause={() => setPlaying(false)}
        onWaiting={() => loaded && setBuffering(true)}
        onError={() => { setError(true); setBuffering(false); }}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", zIndex: 2, opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease" }}
      />

      {/* Buffering spinner */}
      {buffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ zIndex: 5, backgroundColor: "rgba(0,0,0,0.7)" }}>
          <AlertCircle className="w-8 h-8 text-white/60" />
          <span className="text-white/60 text-sm">Could not load video</span>
          <button
            onClick={(e) => { e.stopPropagation(); setError(false); setLoaded(false); srcLoaded.current = false; if (videoRef.current) videoRef.current.src = ""; setTimeout(doPlay, 100); }}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Paused overlay */}
      {loaded && !playing && !buffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4, backgroundColor: "rgba(0,0,0,0.2)" }}>
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 56, height: 56, backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
            <Play className="w-6 h-6 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Tap feedback icon */}
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 6 }}>
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 64, height: 64, backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", animation: "streamTapFade 0.6s ease forwards" }}>
            {showIcon === "like" ? <span style={{ fontSize: 32 }}>❤️</span>
              : showIcon === "play" ? <Play className="w-7 h-7 text-white" fill="white" />
              : <Pause className="w-7 h-7 text-white" fill="white" />}
          </div>
        </div>
      )}

      {/* Mute button */}
      <div className="absolute bottom-3 right-3" style={{ zIndex: 7 }}>
        <button
          onClick={toggleMute}
          className="flex items-center justify-center rounded-full active:scale-90"
          style={{
            width: 44, height: 44,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            touchAction: "manipulation",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Tap capture overlay (above video, below controls) */}
      <div className="absolute inset-0" style={{ zIndex: 3 }} />

      <style>{`
        @keyframes streamTapFade {
          0%   { opacity: 0; transform: scale(0.6); }
          20%  { opacity: 1; transform: scale(1.15); }
          70%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes streamShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}