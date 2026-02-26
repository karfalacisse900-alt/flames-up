import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Global singleton so only one preview plays at a time ──────────────────
const globalAudio = {
  current: null,
  stopCb: null,
  stop() {
    if (this.current) {
      this.current.pause();
      this.current.currentTime = 0;
      this.current = null;
    }
    if (this.stopCb) {
      this.stopCb();
      this.stopCb = null;
    }
  },
};

// Mini waveform bars
function WaveBars({ playing }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            backgroundColor: "#1DB954",
            height: playing ? undefined : "4px",
            animation: playing ? `waveBar 0.8s ease-in-out ${(i - 1) * 0.12}s infinite` : "none",
            minHeight: "4px",
            maxHeight: "16px",
          }}
        />
      ))}
    </div>
  );
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `0:${String(s).padStart(2, "0")}`;
}

// ── Inline player shown inside the card ───────────────────────────────────
export function AudioPreviewPlayer({ previewUrl, trackTitle, autoPlay = false, onPlayStart }) {
  const [state, setState] = useState("idle"); // idle | loading | playing | paused
  const [progress, setProgress] = useState(0); // 0–1
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef(null);
  const tickRef = useRef(null);
  const MAX = 30;

  const cleanup = useCallback(() => {
    clearInterval(tickRef.current);
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.oncanplay = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState("idle");
    setProgress(0);
    setElapsed(0);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  // autoPlay on mount
  useEffect(() => {
    if (!autoPlay || !previewUrl) return;
    globalAudio.stop();
    setState("loading");
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;
    globalAudio.current = audio;
    globalAudio.stopCb = cleanup;
    audio.oncanplay = () => {
      audio.play().catch(() => cleanup());
      setState("playing");
      if (onPlayStart) onPlayStart();
      tickRef.current = setInterval(() => {
        const cur = audio.currentTime;
        setElapsed(cur);
        setProgress(cur / MAX);
        if (cur >= MAX) { audio.pause(); globalAudio.stop(); }
      }, 100);
    };
    audio.onended = () => { globalAudio.stop(); };
    audio.onerror = () => { cleanup(); };
    audio.src = previewUrl;
    audio.load();
  }, []); // eslint-disable-line

  const handlePlay = (e) => {
    e.stopPropagation();
    if (!previewUrl) return;

    if (state === "playing") {
      // Pause
      audioRef.current?.pause();
      clearInterval(tickRef.current);
      setState("paused");
      return;
    }

    if (state === "paused" && audioRef.current) {
      // Resume
      audioRef.current.play();
      setState("playing");
      tickRef.current = setInterval(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const cur = audio.currentTime;
        setElapsed(cur);
        setProgress(cur / MAX);
        if (cur >= MAX) { globalAudio.stop(); }
      }, 100);
      return;
    }

    // Fresh play — stop whatever is playing globally
    globalAudio.stop();

    setState("loading");
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;
    globalAudio.current = audio;
    globalAudio.stopCb = cleanup;

    audio.oncanplay = () => {
      audio.play().catch(() => cleanup());
      setState("playing");
      if (onPlayStart) onPlayStart();
      tickRef.current = setInterval(() => {
        const cur = audio.currentTime;
        setElapsed(cur);
        setProgress(cur / MAX);
        if (cur >= MAX) {
          audio.pause();
          globalAudio.stop();
        }
      }, 100);
    };
    audio.onended = () => { globalAudio.stop(); };
    audio.onerror = () => { cleanup(); };
    audio.src = previewUrl;
    audio.load();
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    if (!audioRef.current || state === "idle" || state === "loading") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * MAX;
    audioRef.current.currentTime = newTime;
    setElapsed(newTime);
    setProgress(ratio);
  };

  if (!previewUrl) return null;

  const isPlaying = state === "playing";
  const isLoading = state === "loading";
  const isActive = state !== "idle";

  return (
    <motion.div
      layout
      className="mt-2 rounded-xl overflow-hidden"
      style={{
        backgroundColor: isActive ? "#0a0a0a" : "var(--bg-subtle)",
        border: `1px solid ${isPlaying ? "#1DB95440" : "var(--border-light)"}`,
        boxShadow: isPlaying ? "0 0 16px #1DB95430" : "none",
        transition: "box-shadow 0.3s ease, background-color 0.2s ease",
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Play/Pause button */}
        <button
          onClick={handlePlay}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
          style={{ backgroundColor: "#1DB954" }}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5 text-black" fill="black" />
          ) : (
            <Play className="w-3.5 h-3.5 text-black" fill="black" style={{ marginLeft: 1 }} />
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div
            className="relative h-1.5 rounded-full overflow-hidden cursor-pointer"
            style={{ backgroundColor: "#ffffff18" }}
            onClick={handleSeek}
          >
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ backgroundColor: "#1DB954" }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[9px] font-medium tabular-nums" style={{ color: isActive ? "#1DB954" : "var(--text-hint)" }}>
              {formatTime(elapsed)}
            </span>
            <span className="text-[9px]" style={{ color: "var(--text-hint)" }}>0:30</span>
          </div>
        </div>

        {/* Waveform */}
        {isPlaying && <WaveBars playing={true} />}

        {/* Preview label */}
        {!isActive && (
          <span className="text-[10px] font-medium shrink-0" style={{ color: "var(--text-hint)" }}>Preview</span>
        )}
      </div>
    </motion.div>
  );
}

// ── Mini sticky player at bottom ──────────────────────────────────────────
export function MiniStickyPlayer({ track, onClose }) {
  if (!track) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="mini-player"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-16 left-0 right-0 z-50 px-4 max-w-lg mx-auto"
      >
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: "#111",
            border: "1px solid #1DB95450",
            boxShadow: "0 -4px 24px #1DB95422, 0 4px 16px rgba(0,0,0,0.4)",
          }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#1DB954" }}>
            <WaveBars playing={true} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-white">{track.title}</p>
            <p className="text-[10px] truncate" style={{ color: "#1DB954" }}>{track.artist} · Preview</p>
          </div>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "#ffffff15", color: "#aaa" }}>
            Stop
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}