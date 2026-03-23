import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaggedImage from "./TaggedImage";

export default function PhotoCarousel({ images, tags = [], aspectRatio = "4/5" }) {
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef(null);
  const count = images.length;

  const goTo = (index, dir = 1) => {
    setDirection(dir);
    setCurrent((index + count) % count);
  };

  const next = () => goTo(current + 1, 1);
  const prev = () => goTo(current - 1, -1);

  const getTagsForImage = (index) => {
    if (!tags || !Array.isArray(tags)) return [];
    return tags.filter(t => (t.imageIndex === index) || (index === 0 && t.imageIndex == null));
  };

  // Touch/mouse swipe
  const onDragStart = (clientX) => { setDragging(true); setDragStartX(clientX); setDragOffset(0); };
  const onDragMove = (clientX) => { if (!dragging) return; setDragOffset(clientX - dragStartX); };
  const onDragEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragOffset < -50) next();
    else if (dragOffset > 50) prev();
    setDragOffset(0);
  };

  if (!images || count === 0) return null;

  // Single image — clean display, no carousel chrome
  if (count === 1) {
    return (
      <div className="w-full" style={{ overflow: "hidden" }}>
        <TaggedImage imageUrl={images[0]} tags={getTagsForImage(0)} aspectRatio={aspectRatio} />
      </div>
    );
  }

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className="relative w-full" style={{ overflow: "hidden" }}>
      {/* Swipeable image area */}
      <div
        ref={containerRef}
        className="w-full"
        style={{ position: "relative", overflow: "hidden", aspectRatio, touchAction: "pan-y", cursor: dragging ? "grabbing" : "grab" }}
        onTouchStart={e => onDragStart(e.touches[0].clientX)}
        onTouchMove={e => onDragMove(e.touches[0].clientX)}
        onTouchEnd={onDragEnd}
        onMouseDown={e => onDragStart(e.clientX)}
        onMouseMove={e => { if (dragging) onDragMove(e.clientX); }}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
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
            <TaggedImage imageUrl={images[current]} tags={getTagsForImage(current)} aspectRatio={aspectRatio} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Image counter — top right, minimal pill */}
      <div className="absolute top-2.5 right-3 z-10 pointer-events-none">
        <div className="text-white text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          {current + 1} / {count}
        </div>
      </div>

      {/* Dot indicators — below image, centered */}
      <div className="flex justify-center gap-1.5 pt-2 pb-1">
        {images.map((_, i) => (
          <button key={i} onClick={() => goTo(i, i > current ? 1 : -1)}
            style={{
              width: i === current ? 18 : 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: i === current ? "var(--accent-primary)" : "var(--border-medium)",
              border: "none",
              padding: 0,
              transition: "all 0.2s ease",
              minHeight: "unset",
              minWidth: "unset",
            }} />
        ))}
      </div>
    </div>
  );
}