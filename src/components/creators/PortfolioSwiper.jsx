import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function PortfolioSwiper({ images, onClose }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
      onClick={onClose}>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-10"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
        <X className="w-5 h-5 text-white" />
      </button>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 w-10 h-10 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 w-10 h-10 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      <img src={images[idx]} alt=""
        className="max-w-full max-h-full rounded-2xl object-contain"
        style={{ maxWidth: "90vw", maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()} />

      {images.length > 1 && (
        <div className="absolute bottom-5 flex gap-1.5">
          {images.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className="w-2 h-2 rounded-full transition-all"
              style={{ backgroundColor: i === idx ? "white" : "rgba(255,255,255,0.35)" }} />
          ))}
        </div>
      )}
    </div>
  );
}