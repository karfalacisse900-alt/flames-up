import React, { useRef, useEffect, useState, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

// Global registry – ensures only one video plays at a time across all instances
const activeVideoRegistry = { current: null };

export default function AutoplayVideo({ src }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const observerRef = useRef(null);

  const pauseVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.paused) return;
    v.pause();
    setPlaying(false);
  }, []);

  const playVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;

    // Pause the previously active video (different instance)
    if (activeVideoRegistry.current && activeVideoRegistry.current !== videoRef) {
      const prev = activeVideoRegistry.current.current;
      if (prev && !prev.paused) {
        prev.pause();
      }
    }
    activeVideoRegistry.current = videoRef;

    v.muted = true; // must be muted for autoplay policy
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          playVideo();
        } else {
          pauseVideo();
        }
      },
      { threshold: [0, 0.6] }
    );

    observerRef.current.observe(container);

    return () => {
      observerRef.current?.disconnect();
      pauseVideo();
      // Clean up registry if this was the active video
      if (activeVideoRegistry.current === videoRef) {
        activeVideoRegistry.current = null;
      }
    };
  }, [playVideo, pauseVideo]);

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    const newMuted = !muted;
    v.muted = newMuted;
    setMuted(newMuted);
    // If unmuting, pause all others
    if (!newMuted && activeVideoRegistry.current !== videoRef) {
      if (activeVideoRegistry.current?.current) {
        activeVideoRegistry.current.current.pause();
      }
      activeVideoRegistry.current = videoRef;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden mb-2.5"
      style={{ maxHeight: 360, backgroundColor: "#000", border: "1px solid var(--border-subtle)" }}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        muted
        loop
        preload="none"
        className="w-full h-full object-cover"
        style={{ display: "block", maxHeight: 360, minHeight: 160 }}
      />

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 p-1.5 rounded-full transition-all"
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          color: "#fff",
          backdropFilter: "blur(6px)",
        }}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}