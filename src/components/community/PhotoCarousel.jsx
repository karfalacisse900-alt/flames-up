import React, { useState, useRef, useCallback, useEffect } from "react";
import TaggedImage from "./TaggedImage";

// Preload an image URL into browser cache
function preloadImage(url) {
  if (!url) return;
  const img = new window.Image();
  img.src = url;
}

export default function PhotoCarousel({ images, tags = [], aspectRatio = "4/5" }) {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Preload current, next and previous images
  useEffect(() => {
    if (!images || count === 0) return;
    preloadImage(images[current]);
    preloadImage(images[(current + 1) % count]);
    preloadImage(images[(current - 1 + count) % count]);
  }, [current, images, count]);
  const dragStartX = useRef(null);
  const isDragging = useRef(false);
  const containerRef = useRef(null);
  const count = images?.length || 0;

  const getTagsForImage = (index) => {
    if (!tags || !Array.isArray(tags)) return [];
    return tags.filter(t => (t.imageIndex === index) || (index === 0 && t.imageIndex == null));
  };

  const goTo = useCallback((index) => {
    const next = Math.max(0, Math.min(count - 1, index));
    if (next === current) return;
    setIsAnimating(true);
    setCurrent(next);
    setDragOffset(0);
    setTimeout(() => setIsAnimating(false), 300);
  }, [current, count]);

  const onDragStart = useCallback((clientX) => {
    if (isAnimating) return;
    dragStartX.current = clientX;
    isDragging.current = true;
    setDragOffset(0);
  }, [isAnimating]);

  const onDragMove = useCallback((clientX) => {
    if (!isDragging.current || dragStartX.current === null) return;
    const diff = clientX - dragStartX.current;
    // Clamp: can't drag past edges
    const maxLeft = current < count - 1 ? -Infinity : 0;
    const maxRight = current > 0 ? Infinity : 0;
    const clamped = Math.max(maxLeft, Math.min(maxRight, diff));
    setDragOffset(clamped);
  }, [current, count]);

  const onDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const threshold = (containerRef.current?.offsetWidth || 300) * 0.3;
    if (dragOffset < -threshold && current < count - 1) {
      goTo(current + 1);
    } else if (dragOffset > threshold && current > 0) {
      goTo(current - 1);
    } else {
      // Snap back
      setIsAnimating(true);
      setDragOffset(0);
      setTimeout(() => setIsAnimating(false), 300);
    }
    dragStartX.current = null;
  }, [dragOffset, current, count, goTo]);

  if (!images || count === 0) return null;

  if (count === 1) {
    return (
      <div className="w-full" style={{ overflow: "hidden" }}>
        <TaggedImage imageUrl={images[0]} tags={getTagsForImage(0)} aspectRatio={aspectRatio} />
      </div>
    );
  }

  // translateX: each image is 100% wide, slide by (-current * 100%) + drag px
  const translateX = `calc(${-current * 100}% + ${dragOffset}px)`;
  const transitionStyle = isDragging.current ? "none" : "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)";

  return (
    <div className="relative w-full">
      {/* Swipeable container */}
      <div
        ref={containerRef}
        style={{ overflow: "hidden", aspectRatio, touchAction: "pan-y", cursor: "grab", userSelect: "none" }}
        onTouchStart={e => onDragStart(e.touches[0].clientX)}
        onTouchMove={e => { e.stopPropagation(); onDragMove(e.touches[0].clientX); }}
        onTouchEnd={onDragEnd}
        onMouseDown={e => { e.preventDefault(); onDragStart(e.clientX); }}
        onMouseMove={e => onDragMove(e.clientX)}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
      >
        {/* Horizontal strip — all images side by side */}
        <div
          style={{
            display: "flex",
            width: `${count * 100}%`,
            height: "100%",
            transform: `translateX(${translateX})`,
            transition: transitionStyle,
            willChange: "transform",
          }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              style={{ width: `${100 / count}%`, height: "100%", flexShrink: 0, overflow: "hidden" }}
            >
              <TaggedImage
                imageUrl={img}
                tags={getTagsForImage(i)}
                aspectRatio={aspectRatio}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Counter pill */}
      <div className="absolute top-2.5 right-3 z-10 pointer-events-none">
        <div className="text-white text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          {current + 1} / {count}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 pt-2 pb-1">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
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
            }}
          />
        ))}
      </div>
    </div>
  );
}