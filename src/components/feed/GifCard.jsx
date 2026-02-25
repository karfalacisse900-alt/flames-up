import React, { useRef, useEffect, useState } from "react";

/**
 * Optimized GIF component with:
 * - Responsive aspect ratio container
 * - Auto-play on load
 * - Pause when off-screen
 * - Proper layout without breaking
 */
export default function GifCard({ src, alt = "GIF", maxHeight = 200 }) {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef(null);

  // Intersection Observer to pause GIF when off-screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="rounded-2xl mt-1 overflow-hidden"
      style={{
        maxHeight: `${maxHeight}px`,
        maxWidth: "100%",
        aspectRatio: "16/9",
        backgroundColor: "var(--bg-subtle)",
      }}
    >
      {isVisible ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ display: "block" }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-hint)" }}>
          <span className="text-sm">🎬</span>
        </div>
      )}
    </div>
  );
}