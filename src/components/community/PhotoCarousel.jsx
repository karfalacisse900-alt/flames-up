import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PhotoCarousel({ images, aspectRatio = "4/3" }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = forward, -1 = backward
  const autoTimer = useRef(null);
  const holdTimer = useRef(null);
  const containerRef = useRef(null);
  const count = images.length;

  const goTo = useCallback((index, dir = 1) => {
    setDirection(dir);
    setCurrent((index + count) % count);
  }, [count]);

  const next = useCallback(() => goTo(current + 1, 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, -1), [current, goTo]);

  // Auto-advance every 4 seconds unless paused
  const resetTimer = useCallback(() => {
    clearInterval(autoTimer.current);
    if (!paused) {
      autoTimer.current = setInterval(next, 4000);
    }
  }, [paused, next]);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(autoTimer.current);
  }, [resetTimer, current, paused]);

  // Touch / mouse swipe handling
  const onDragStart = (clientX) => {
    setDragging(true);
    setDragStartX(clientX);
    setDragOffset(0);
    clearInterval(autoTimer.current);
  };

  const onDragMove = (clientX) => {
    if (!dragging) return;
    setDragOffset(clientX - dragStartX);
  };

  const onDragEnd = () => {
    if (!dragging) return;
    setDragging(false);
    const threshold = 50;
    if (dragOffset < -threshold) {
      next();
    } else if (dragOffset > threshold) {
      prev();
    }
    setDragOffset(0);
    resetTimer();
  };

  // Tap-and-hold to pause
  const onHoldStart = () => {
    holdTimer.current = setTimeout(() => setPaused(true), 200);
  };
  const onHoldEnd = () => {
    clearTimeout(holdTimer.current);
    setPaused(false);
    resetTimer();
  };

  if (!images || count === 0) return null;
  if (count === 1) {
    return (
      <img
        src={images[0]}
        alt=""
        loading="lazy"
        className="w-full"
        style={{ borderRadius: 16, aspectRatio, objectFit: "cover", display: "block", border: "1px solid var(--border-subtle)" }}
      />
    );
  }

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className="relative w-full select-none" style={{ borderRadius: 16, overflow: "hidden", aspectRatio, border: "1px solid var(--border-subtle)" }}>
      {/* Images */}
      <div
        ref={containerRef}
        className="w-full h-full"
        onTouchStart={e => { onDragStart(e.touches[0].clientX); onHoldStart(); }}
        onTouchMove={e => { onDragMove(e.touches[0].clientX); }}
        onTouchEnd={() => { onDragEnd(); onHoldEnd(); }}
        onMouseDown={e => { onDragStart(e.clientX); onHoldStart(); }}
        onMouseMove={e => { if (dragging) onDragMove(e.clientX); }}
        onMouseUp={() => { onDragEnd(); onHoldEnd(); }}
        onMouseLeave={() => { onDragEnd(); onHoldEnd(); }}
        style={{ touchAction: "pan-y", cursor: dragging ? "grabbing" : "grab", position: "relative", overflow: "hidden", width: "100%", height: "100%" }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.28, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            <img
              src={images[current]}
              alt={`Photo ${current + 1} of ${count}`}
              loading="lazy"
              draggable="false"
              style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", display: "block" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Pause overlay */}
        {paused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ backgroundColor: "rgba(0,0,0,0.25)", zIndex: 5 }}>
            <div className="text-white text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              ⏸ Paused
            </div>
          </div>
        )}
      </div>

      {/* Progress bars */}
      <div className="absolute top-2.5 left-3 right-3 flex gap-1 z-10 pointer-events-none">
        {images.map((_, i) => (
          <div key={i} className="flex-1 rounded-full overflow-hidden" style={{ height: 3, backgroundColor: "rgba(255,255,255,0.35)" }}>
            {i === current ? (
              <motion.div
                key={`${i}-${current}-${paused}`}
                initial={{ width: 0 }}
                animate={{ width: paused ? undefined : "100%" }}
                transition={{ duration: 4, ease: "linear" }}
                style={{ height: "100%", backgroundColor: "#fff", borderRadius: 999 }}
              />
            ) : (
              <div style={{ width: i < current ? "100%" : "0%", height: "100%", backgroundColor: "#fff", borderRadius: 999 }} />
            )}
          </div>
        ))}
      </div>

      {/* Dot counter */}
      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
        {images.map((_, i) => (
          <div key={i} style={{
            width: i === current ? 16 : 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: i === current ? "#fff" : "rgba(255,255,255,0.5)",
            transition: "all 0.25s ease",
          }} />
        ))}
      </div>

      {/* Image counter badge */}
      <div className="absolute top-2.5 right-3 z-10 pointer-events-none">
        <div className="text-white text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          {current + 1} / {count}
        </div>
      </div>
    </div>
  );
}