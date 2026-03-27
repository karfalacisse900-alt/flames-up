import React, { useState, useRef, useCallback, useEffect } from "react";
import TaggedImage from "./TaggedImage";

function preloadImage(url) {
  if (!url) return;
  const img = new window.Image();
  img.src = url;
}

export default function PhotoCarousel({ images, tags = [], aspectRatio = "4/5" }) {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const dragOffsetRef = useRef(0); // ref so onDragEnd always reads latest value
  const isAnimating = useRef(false);
  const dragStartX = useRef(null);
  const isDragging = useRef(false);
  const containerRef = useRef(null);
  const count = images?.length || 0;

  useEffect(() => {
    if (!images || count === 0) return;
    preloadImage(images[current]);
    preloadImage(images[(current + 1) % count]);
    preloadImage(images[(current - 1 + count) % count]);
  }, [current, images, count]);

  const getTagsForImage = (index) => {
    if (!tags || !Array.isArray(tags)) return [];
    return tags.filter(t => (t.imageIndex === index) || (index === 0 && t.imageIndex == null));
  };

  const goTo = useCallback((nextIdx) => {
    if (isAnimating.current) return;
    const clamped = Math.max(0, Math.min(count - 1, nextIdx));
    isAnimating.current = true;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setCurrent(clamped);
    setTimeout(() => { isAnimating.current = false; }, 320);
  }, [count]);

  const onDragStart = useCallback((clientX) => {
    if (isAnimating.current) return;
    dragStartX.current = clientX;
    isDragging.current = true;
    dragOffsetRef.current = 0;
    setDragOffset(0);
  }, []);

  const onDragMove = useCallback((clientX) => {
    if (!isDragging.current || dragStartX.current === null) return;
    const diff = clientX - dragStartX.current;
    dragOffsetRef.current = diff;
    setDragOffset(diff);
  }, []);

  const onDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const offset = dragOffsetRef.current;
    const threshold = (containerRef.current?.offsetWidth || 300) * 0.25;

    if (offset < -threshold) {
      setCurrent(prev => {
        const next = Math.min(count - 1, prev + 1);
        return next;
      });
    } else if (offset > threshold) {
      setCurrent(prev => {
        const next = Math.max(0, prev - 1);
        return next;
      });
    }
    isAnimating.current = true;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setTimeout(() => { isAnimating.current = false; }, 320);
    dragStartX.current = null;
  }, [count]);

  if (!images || count === 0) return null;

  if (count === 1) {
    return (
      <div className="w-full" style={{ overflow: "hidden" }}>
        <TaggedImage imageUrl={images[0]} tags={getTagsForImage(0)} aspectRatio={aspectRatio} />
      </div>
    );
  }

  // The strip is `count` times wider than the container.
  // To show image N: shift strip left by N * containerWidth.
  // In strip-relative %: N * containerWidth / (count * containerWidth) = N/count * 100%
  const translatePercent = (-current * 100) / count;

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        style={{ overflow: "hidden", aspectRatio, touchAction: "pan-y", userSelect: "none", cursor: "grab" }}
        onTouchStart={e => onDragStart(e.touches[0].clientX)}
        onTouchMove={e => { e.stopPropagation(); onDragMove(e.touches[0].clientX); }}
        onTouchEnd={onDragEnd}
        onMouseDown={e => { e.preventDefault(); onDragStart(e.clientX); }}
        onMouseMove={e => { if (isDragging.current) onDragMove(e.clientX); }}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
      >
        <div
          style={{
            display: "flex",
            width: `${count * 100}%`,
            height: "100%",
            transform: `translateX(calc(${translatePercent}% + ${dragOffset}px))`,
            transition: isDragging.current ? "none" : "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
            willChange: "transform",
          }}
        >
          {images.map((img, i) => (
            <div key={i} style={{ width: `${100 / count}%`, height: "100%", flexShrink: 0, overflow: "hidden" }}>
              <TaggedImage imageUrl={img} tags={getTagsForImage(i)} aspectRatio={aspectRatio} />
            </div>
          ))}
        </div>
      </div>

      {/* Counter */}
      <div className="absolute top-2.5 right-3 z-10 pointer-events-none">
        <div className="text-white text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          {current + 1} / {count}
        </div>
      </div>

      {/* Dots */}
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