import React, { useRef, useEffect, useState } from "react";

/**
 * Optimized Image component with:
 * - Responsive aspect ratio container
 * - Proper layout without breaking
 * - Lazy loading
 */
export default function ImageCard({ src, alt = "Image", maxHeight = 240, aspectRatio = "1/1" }) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      className="rounded-2xl mt-1 overflow-hidden"
      style={{
        maxHeight: `${maxHeight}px`,
        maxWidth: "100%",
        aspectRatio,
        backgroundColor: "var(--bg-subtle)",
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="w-full h-full object-cover"
        style={{
          display: "block",
          opacity: loaded ? 1 : 0.7,
          transition: "opacity 0.3s ease",
        }}
      />
    </div>
  );
}