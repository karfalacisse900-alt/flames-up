import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Type, Check, ChevronLeft, ChevronRight, Sun, Contrast, Sliders } from "lucide-react";

// ── Filter presets ────────────────────────────────────────────────────────────
const FILTERS = [
  { id: "none",      label: "Original", css: "" },
  { id: "vivid",     label: "Vivid",    css: "saturate(1.6) contrast(1.1)" },
  { id: "fade",      label: "Fade",     css: "brightness(1.1) saturate(0.7) contrast(0.9)" },
  { id: "warm",      label: "Warm",     css: "sepia(0.3) saturate(1.4) brightness(1.05)" },
  { id: "cool",      label: "Cool",     css: "hue-rotate(20deg) saturate(1.2) brightness(1.05)" },
  { id: "mono",      label: "Mono",     css: "grayscale(1) contrast(1.1)" },
  { id: "drama",     label: "Drama",    css: "contrast(1.4) saturate(1.2) brightness(0.9)" },
  { id: "golden",    label: "Golden",   css: "sepia(0.5) saturate(1.6) brightness(1.1) hue-rotate(-10deg)" },
  { id: "matte",     label: "Matte",    css: "contrast(0.85) saturate(0.9) brightness(1.08)" },
];

function buildFilter(filterId, brightness, contrast) {
  const preset = FILTERS.find(f => f.id === filterId)?.css || "";
  const bAdj = brightness !== 100 ? `brightness(${brightness / 100})` : "";
  const cAdj = contrast !== 100 ? `contrast(${contrast / 100})` : "";
  return [preset, bAdj, cAdj].filter(Boolean).join(" ") || "none";
}

// ── Text overlay item ─────────────────────────────────────────────────────────
function TextItem({ item, isSelected, onSelect, onMove }) {
  const startRef = useRef(null);

  const onTouchStart = (e) => {
    onSelect(item.id);
    startRef.current = { x: e.touches[0].clientX - item.x, y: e.touches[0].clientY - item.y };
  };
  const onTouchMove = (e) => {
    if (!startRef.current) return;
    e.stopPropagation();
    onMove(item.id, e.touches[0].clientX - startRef.current.x, e.touches[0].clientY - startRef.current.y);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onClick={() => onSelect(item.id)}
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        color: item.color,
        fontSize: item.size,
        fontWeight: "bold",
        textShadow: "0 1px 6px rgba(0,0,0,0.7)",
        cursor: "grab",
        userSelect: "none",
        border: isSelected ? "2px dashed rgba(255,255,255,0.8)" : "2px solid transparent",
        padding: "4px 8px",
        borderRadius: 6,
        touchAction: "none",
        whiteSpace: "nowrap",
        maxWidth: "90%",
      }}>
      {item.text}
    </div>
  );
}

// ── Main Photo Editor ─────────────────────────────────────────────────────────
export default function PhotoEditor({ file, onDone, onCancel }) {
  const [activeTab, setActiveTab] = useState("filters"); // filters | adjust | text | crop
  const [filterId, setFilterId] = useState("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [textItems, setTextItems] = useState([]);
  const [selectedText, setSelectedText] = useState(null);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(22);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 100, h: 100 }); // percent
  const [showCropOverlay, setShowCropOverlay] = useState(false);
  const [processing, setProcessing] = useState(false);

  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const srcUrl = useRef(URL.createObjectURL(file)).current;

  const cssFilter = buildFilter(filterId, brightness, contrast);

  const addText = () => {
    if (!newText.trim()) return;
    setTextItems(prev => [...prev, {
      id: Date.now(),
      text: newText.trim(),
      x: 40,
      y: 60,
      color: textColor,
      size: textSize,
    }]);
    setNewText("");
  };

  const moveText = useCallback((id, x, y) => {
    setTextItems(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
  }, []);

  const removeText = (id) => {
    setTextItems(prev => prev.filter(t => t.id !== id));
    setSelectedText(null);
  };

  // Export: draw onto canvas with all edits
  const handleExport = async () => {
    setProcessing(true);
    const img = imgRef.current;
    if (!img) { setProcessing(false); return; }

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");

    // Apply CSS filter via OffscreenCanvas workaround using SVG feColorMatrix
    ctx.filter = cssFilter === "none" ? "none" : cssFilter;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";

    // Render text overlays (scale from display to natural size)
    const scaleX = canvas.width / img.clientWidth;
    const scaleY = canvas.height / img.clientHeight;
    textItems.forEach(t => {
      ctx.font = `bold ${Math.round(t.size * scaleX)}px sans-serif`;
      ctx.fillStyle = t.color;
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x * scaleX, t.y * scaleY + t.size * scaleX);
    });

    canvas.toBlob(async (blob) => {
      const editedFile = new File([blob], file.name || "edited.jpg", { type: "image/jpeg" });
      setProcessing(false);
      onDone(editedFile, URL.createObjectURL(blob));
    }, "image/jpeg", 0.92);
  };

  const COLORS = ["#ffffff", "#000000", "#ffdd00", "#ff4444", "#44aaff", "#44ff88"];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: "#0d0d0d" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onCancel} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
          <X className="w-4 h-4" /> Cancel
        </button>
        <p className="text-sm font-bold text-white">Edit Photo</p>
        <button onClick={handleExport} disabled={processing}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
          {processing ? "..." : <><Check className="w-4 h-4" /> Done</>}
        </button>
      </div>

      {/* Image preview */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center" style={{ minHeight: 0 }}>
        <div className="relative" style={{ maxWidth: "100%", maxHeight: "100%" }}>
          <img
            ref={imgRef}
            src={srcUrl}
            alt="edit"
            style={{
              maxWidth: "100%",
              maxHeight: "55vh",
              objectFit: "contain",
              filter: cssFilter,
              display: "block",
              borderRadius: 4,
            }}
          />
          {/* Text overlays */}
          <div className="absolute inset-0" style={{ pointerEvents: "auto" }}>
            {textItems.map(item => (
              <TextItem
                key={item.id}
                item={item}
                isSelected={selectedText === item.id}
                onSelect={setSelectedText}
                onMove={moveText}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="shrink-0 flex border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        {[
          { id: "filters", label: "Filters", icon: "🎨" },
          { id: "adjust", label: "Adjust", icon: "☀️" },
          { id: "text", label: "Text", icon: "T" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all"
            style={{ color: activeTab === tab.id ? "#2E6B4F" : "rgba(255,255,255,0.4)", backgroundColor: activeTab === tab.id ? "rgba(46,107,79,0.12)" : "transparent" }}>
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="shrink-0" style={{ maxHeight: "28vh", overflowY: "auto", backgroundColor: "#111" }}>

        {/* FILTERS */}
        {activeTab === "filters" && (
          <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilterId(f.id)}
                className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden"
                  style={{ border: filterId === f.id ? "2px solid #2E6B4F" : "2px solid rgba(255,255,255,0.1)" }}>
                  <img src={srcUrl} alt={f.label} className="w-full h-full object-cover" style={{ filter: f.css || "none" }} />
                </div>
                <p className="text-[9px] font-semibold" style={{ color: filterId === f.id ? "#2E6B4F" : "rgba(255,255,255,0.5)" }}>{f.label}</p>
              </button>
            ))}
          </div>
        )}

        {/* ADJUST */}
        {activeTab === "adjust" && (
          <div className="px-5 py-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.6)" }} /><p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Brightness</p></div>
                <p className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{brightness}%</p>
              </div>
              <input type="range" min={50} max={150} value={brightness} onChange={e => setBrightness(+e.target.value)}
                className="w-full accent-green-600" style={{ height: 4 }} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5"><Contrast className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.6)" }} /><p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Contrast</p></div>
                <p className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{contrast}%</p>
              </div>
              <input type="range" min={50} max={150} value={contrast} onChange={e => setContrast(+e.target.value)}
                className="w-full accent-green-600" style={{ height: 4 }} />
            </div>
            <button onClick={() => { setBrightness(100); setContrast(100); setFilterId("none"); }}
              className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
              <RotateCcw className="w-3 h-3" /> Reset adjustments
            </button>
          </div>
        )}

        {/* TEXT */}
        {activeTab === "text" && (
          <div className="px-4 py-3 space-y-3">
            <div className="flex gap-2">
              <input
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addText()}
                placeholder="Enter text…"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }} />
              <button onClick={addText} className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#243D33,#2E6B4F)" }}>Add</button>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Color:</p>
              {COLORS.map(c => (
                <button key={c} onClick={() => setTextColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: textColor === c ? "#fff" : "transparent" }} />
              ))}
            </div>

            {/* Size */}
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Size:</p>
              <input type="range" min={12} max={48} value={textSize} onChange={e => setTextSize(+e.target.value)}
                className="flex-1 accent-green-600" style={{ height: 4 }} />
              <p className="text-[10px] tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{textSize}px</p>
            </div>

            {/* Active text list */}
            {textItems.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {textItems.map(t => (
                  <div key={t.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", border: `1px solid ${t.id === selectedText ? "#2E6B4F" : "rgba(255,255,255,0.15)"}` }}>
                    <span className="text-[10px] font-semibold" style={{ color: t.color, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.text}</span>
                    <button onClick={() => removeText(t.id)} style={{ color: "rgba(255,255,255,0.4)" }}><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}