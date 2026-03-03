import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, RotateCw, Check, Sun, Contrast, Droplets, Thermometer, Crop, Type, Palette, FlipHorizontal, ZoomIn, ZoomOut } from "lucide-react";

// ── Filter presets ────────────────────────────────────────────────────────────
const FILTERS = [
  { id: "none",    label: "Original", css: "" },
  { id: "vivid",   label: "Vivid",    css: "saturate(1.6) contrast(1.1)" },
  { id: "fade",    label: "Fade",     css: "brightness(1.1) saturate(0.7) contrast(0.9)" },
  { id: "warm",    label: "Warm",     css: "sepia(0.3) saturate(1.4) brightness(1.05)" },
  { id: "cool",    label: "Cool",     css: "hue-rotate(20deg) saturate(1.2) brightness(1.05)" },
  { id: "mono",    label: "Mono",     css: "grayscale(1) contrast(1.1)" },
  { id: "drama",   label: "Drama",    css: "contrast(1.4) saturate(1.2) brightness(0.9)" },
  { id: "golden",  label: "Golden",   css: "sepia(0.5) saturate(1.6) brightness(1.1) hue-rotate(-10deg)" },
  { id: "matte",   label: "Matte",    css: "contrast(0.85) saturate(0.9) brightness(1.08)" },
  { id: "chrome",  label: "Chrome",   css: "saturate(0) contrast(1.2) brightness(1.1)" },
  { id: "punch",   label: "Punch",    css: "saturate(2) contrast(1.2) brightness(0.95)" },
];

function buildFilter(filterId, brightness, contrast, saturation, warmth) {
  const preset = FILTERS.find(f => f.id === filterId)?.css || "";
  const parts = [preset];
  if (brightness !== 100) parts.push(`brightness(${brightness / 100})`);
  if (contrast !== 100) parts.push(`contrast(${contrast / 100})`);
  if (saturation !== 100) parts.push(`saturate(${saturation / 100})`);
  if (warmth !== 0) parts.push(`sepia(${Math.abs(warmth) / 200}) hue-rotate(${warmth > 0 ? -warmth * 0.5 : -warmth * 0.3}deg)`);
  return parts.filter(Boolean).join(" ") || "none";
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
        left: item.x, top: item.y,
        color: item.color,
        fontSize: item.size,
        fontWeight: "bold",
        textShadow: "0 1px 8px rgba(0,0,0,0.8)",
        cursor: "grab",
        userSelect: "none",
        border: isSelected ? "2px dashed rgba(255,255,255,0.9)" : "2px solid transparent",
        padding: "4px 8px",
        borderRadius: 6,
        touchAction: "none",
        whiteSpace: "nowrap",
        maxWidth: "90%",
        fontFamily: item.fontFamily || "sans-serif",
      }}>
      {item.text}
    </div>
  );
}

// ── Slider Row ─────────────────────────────────────────────────────────────────
function SliderRow({ icon: Icon, label, value, min, max, onChange, unit = "%" }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.55)" }} />
          <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</p>
        </div>
        <p className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{value}{unit}</p>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)}
        className="w-full accent-emerald-500" style={{ height: 3, cursor: "pointer" }} />
    </div>
  );
}

const COLORS = ["#ffffff", "#000000", "#ffdd00", "#ff4455", "#44aaff", "#44ff88", "#ff88ff", "#ff8800"];
const TEXT_FONTS = ["sans-serif", "serif", "monospace", "cursive"];

// ── Main Photo Editor ─────────────────────────────────────────────────────────
export default function PhotoEditor({ file, onDone, onCancel }) {
  const [activeTab, setActiveTab] = useState("filters");
  const [filterId, setFilterId] = useState("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [warmth, setWarmth] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  // Crop state (percent of image)
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropRect, setCropRect] = useState(null); // {x,y,w,h} in px relative to imgWrapper
  const [appliedCrop, setAppliedCrop] = useState(null); // final crop in percent
  // Text overlays
  const [textItems, setTextItems] = useState([]);
  const [selectedText, setSelectedText] = useState(null);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(22);
  const [textFont, setTextFont] = useState("sans-serif");
  const [processing, setProcessing] = useState(false);

  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const imgWrapperRef = useRef(null);
  const srcUrl = useRef(URL.createObjectURL(file)).current;

  const cssFilter = buildFilter(filterId, brightness, contrast, saturation, warmth);
  const imgTransform = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`;

  // ── Crop pointer handlers ────────────────────────────────────────────────────
  const getCropXY = (e, rect) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onCropPointerDown = (e) => {
    if (!isCropping) return;
    const rect = imgWrapperRef.current.getBoundingClientRect();
    const pos = getCropXY(e, rect);
    setCropStart(pos);
    setCropRect(null);
  };

  const onCropPointerMove = useCallback((e) => {
    if (!isCropping || !cropStart) return;
    const rect = imgWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = getCropXY(e, rect);
    const x = Math.min(cropStart.x, pos.x);
    const y = Math.min(cropStart.y, pos.y);
    const w = Math.abs(pos.x - cropStart.x);
    const h = Math.abs(pos.y - cropStart.y);
    setCropRect({ x, y, w, h, wrapW: rect.width, wrapH: rect.height });
  }, [isCropping, cropStart]);

  const onCropPointerUp = useCallback(() => {
    if (!cropRect || cropRect.w < 10 || cropRect.h < 10) { setCropStart(null); return; }
    setCropStart(null);
  }, [cropRect]);

  useEffect(() => {
    if (!isCropping) return;
    window.addEventListener("mousemove", onCropPointerMove);
    window.addEventListener("mouseup", onCropPointerUp);
    window.addEventListener("touchmove", onCropPointerMove, { passive: false });
    window.addEventListener("touchend", onCropPointerUp);
    return () => {
      window.removeEventListener("mousemove", onCropPointerMove);
      window.removeEventListener("mouseup", onCropPointerUp);
      window.removeEventListener("touchmove", onCropPointerMove);
      window.removeEventListener("touchend", onCropPointerUp);
    };
  }, [isCropping, onCropPointerMove, onCropPointerUp]);

  const applyCrop = () => {
    if (!cropRect) return;
    setAppliedCrop({
      xPct: cropRect.x / cropRect.wrapW,
      yPct: cropRect.y / cropRect.wrapH,
      wPct: cropRect.w / cropRect.wrapW,
      hPct: cropRect.h / cropRect.wrapH,
    });
    setIsCropping(false);
    setCropRect(null);
  };

  const cancelCrop = () => { setIsCropping(false); setCropRect(null); setCropStart(null); };

  // ── Text ────────────────────────────────────────────────────────────────────
  const addText = () => {
    if (!newText.trim()) return;
    setTextItems(prev => [...prev, { id: Date.now(), text: newText.trim(), x: 40, y: 60, color: textColor, size: textSize, fontFamily: textFont }]);
    setNewText("");
  };

  const moveText = useCallback((id, x, y) => {
    setTextItems(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
  }, []);

  const removeText = (id) => { setTextItems(prev => prev.filter(t => t.id !== id)); setSelectedText(null); };

  // ── Reset all ───────────────────────────────────────────────────────────────
  const resetAll = () => { setFilterId("none"); setBrightness(100); setContrast(100); setSaturation(100); setWarmth(0); setRotation(0); setFlipH(false); setAppliedCrop(null); };

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setProcessing(true);
    const img = imgRef.current;
    if (!img) { setProcessing(false); return; }

    const canvas = document.createElement("canvas");
    let srcW = img.naturalWidth;
    let srcH = img.naturalHeight;

    // Determine draw dimensions accounting for rotation
    const isRotated90 = rotation % 180 !== 0;
    canvas.width = isRotated90 ? srcH : srcW;
    canvas.height = isRotated90 ? srcW : srcH;

    const ctx = canvas.getContext("2d");

    // Apply filter
    ctx.filter = cssFilter === "none" ? "none" : cssFilter;

    // Apply rotation + flip transform around center
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);

    // Crop
    if (appliedCrop) {
      const sx = appliedCrop.xPct * srcW;
      const sy = appliedCrop.yPct * srcH;
      const sw = appliedCrop.wPct * srcW;
      const sh = appliedCrop.hPct * srcH;
      ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
      canvas.width = sw; canvas.height = sh;
      ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
    } else {
      ctx.drawImage(img, -srcW / 2, -srcH / 2, srcW, srcH);
    }
    ctx.restore();
    ctx.filter = "none";

    // Draw text overlays
    const dispImg = imgRef.current;
    const wrapEl = imgWrapperRef.current;
    if (wrapEl && dispImg) {
      const scaleX = canvas.width / dispImg.clientWidth;
      const scaleY = canvas.height / dispImg.clientHeight;
      textItems.forEach(t => {
        ctx.font = `bold ${Math.round(t.size * scaleX)}px ${t.fontFamily || "sans-serif"}`;
        ctx.fillStyle = t.color;
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 6;
        ctx.fillText(t.text, t.x * scaleX, t.y * scaleY + t.size * scaleX);
      });
    }

    canvas.toBlob(async (blob) => {
      const editedFile = new File([blob], file.name || "edited.jpg", { type: "image/jpeg" });
      setProcessing(false);
      onDone(editedFile, URL.createObjectURL(blob));
    }, "image/jpeg", 0.92);
  };

  const TABS = [
    { id: "filters", label: "Filters", icon: "🎨" },
    { id: "adjust",  label: "Adjust",  icon: "✨" },
    { id: "crop",    label: "Crop",    icon: "✂️" },
    { id: "text",    label: "Text",    icon: "T" },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: "#0a0a0a", maxWidth: "100vw", overflowX: "hidden" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onCancel} className="flex items-center gap-1 text-sm font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>
          <X className="w-4 h-4" /> Cancel
        </button>
        <p className="text-sm font-bold text-white tracking-wide truncate px-2">Edit Photo</p>
        <button onClick={handleExport} disabled={processing}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 shrink-0"
          style={{ background: "linear-gradient(135deg, #1a3d2b, #2E6B4F)" }}>
          {processing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> Done</>}
        </button>
      </div>

      {/* Image preview area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center" style={{ minHeight: 0, background: "#111" }}>
        <div
          ref={imgWrapperRef}
          className="relative select-none"
          style={{ maxWidth: "100%", maxHeight: "100%", cursor: isCropping ? "crosshair" : "default" }}
          onMouseDown={onCropPointerDown}
          onTouchStart={onCropPointerDown}
        >
          <img
            ref={imgRef}
            src={srcUrl}
            alt="edit"
            style={{
              maxWidth: "100%",
              maxHeight: "52vh",
              objectFit: "contain",
              filter: cssFilter,
              transform: imgTransform,
              display: "block",
              borderRadius: 4,
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
          {/* Applied crop hint overlay */}
          {appliedCrop && (
            <div style={{
              position: "absolute",
              left: `${appliedCrop.xPct * 100}%`,
              top: `${appliedCrop.yPct * 100}%`,
              width: `${appliedCrop.wPct * 100}%`,
              height: `${appliedCrop.hPct * 100}%`,
              border: "2px solid rgba(46,107,79,0.8)",
              borderRadius: 4,
              pointerEvents: "none",
              backgroundColor: "rgba(46,107,79,0.08)",
            }} />
          )}
          {/* Active crop selection */}
          {isCropping && cropRect && (
            <div style={{
              position: "absolute",
              left: cropRect.x, top: cropRect.y,
              width: cropRect.w, height: cropRect.h,
              border: "2px dashed #fff",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
              pointerEvents: "none",
              borderRadius: 2,
            }}>
              {/* Corner handles */}
              {[[0,0],[100,0],[0,100],[100,100]].map(([l,t],i) => (
                <div key={i} style={{ position:"absolute", left:`${l}%`, top:`${t}%`, width:10, height:10, borderRadius:2, backgroundColor:"#fff", transform:"translate(-50%,-50%)" }} />
              ))}
            </div>
          )}
          {/* Text overlays */}
          <div className="absolute inset-0" style={{ pointerEvents: isCropping ? "none" : "auto" }}>
            {textItems.map(item => (
              <TextItem key={item.id} item={item} isSelected={selectedText === item.id} onSelect={setSelectedText} onMove={moveText} />
            ))}
          </div>
        </div>

        {/* Rotation quick controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          <button onClick={() => setRotation(r => (r - 90 + 360) % 360)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setRotation(r => (r + 90) % 360)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            <RotateCw className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setFlipH(v => !v)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: flipH ? "rgba(46,107,79,0.6)" : "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            <FlipHorizontal className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Reset button */}
        <button onClick={resetAll}
          className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.6)" }}>
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Tab nav */}
      <div className="shrink-0 flex" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", backgroundColor: "#0d0d0d" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id !== "crop") { setIsCropping(false); setCropRect(null); } }}
            className="flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all"
            style={{
              color: activeTab === tab.id ? "#4CAF7D" : "rgba(255,255,255,0.35)",
              backgroundColor: activeTab === tab.id ? "rgba(76,175,125,0.1)" : "transparent",
              borderTop: activeTab === tab.id ? "2px solid #4CAF7D" : "2px solid transparent",
            }}>
            <span className="text-base leading-none">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="shrink-0 overflow-y-auto" style={{ maxHeight: "26vh", backgroundColor: "#0f0f0f" }}>

        {/* FILTERS */}
        {activeTab === "filters" && (
          <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilterId(f.id)} className="flex flex-col items-center gap-1.5 shrink-0 transition-transform active:scale-95">
                <div className="w-14 h-14 rounded-2xl overflow-hidden"
                  style={{ border: filterId === f.id ? "2.5px solid #4CAF7D" : "2px solid rgba(255,255,255,0.08)", boxShadow: filterId === f.id ? "0 0 12px #4CAF7D50" : "none" }}>
                  <img src={srcUrl} alt={f.label} className="w-full h-full object-cover" style={{ filter: f.css || "none" }} />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: filterId === f.id ? "#4CAF7D" : "rgba(255,255,255,0.4)" }}>{f.label}</p>
              </button>
            ))}
          </div>
        )}

        {/* ADJUST */}
        {activeTab === "adjust" && (
          <div className="px-5 py-4 space-y-4">
            <SliderRow icon={Sun} label="Brightness" value={brightness} min={50} max={150} onChange={setBrightness} />
            <SliderRow icon={Contrast} label="Contrast" value={contrast} min={50} max={150} onChange={setContrast} />
            <SliderRow icon={Droplets} label="Saturation" value={saturation} min={0} max={200} onChange={setSaturation} />
            <SliderRow icon={Thermometer} label="Warmth" value={warmth} min={-50} max={50} onChange={setWarmth} unit="" />
          </div>
        )}

        {/* CROP */}
        {activeTab === "crop" && (
          <div className="px-5 py-4">
            {!isCropping ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Select a crop mode or draw freely on the image</p>
                {/* Aspect ratio presets */}
                <div className="flex gap-2 flex-wrap">
                  {[["Free", null], ["1:1", 1], ["4:3", 4/3], ["16:9", 16/9], ["3:4", 3/4], ["9:16", 9/16]].map(([label, ratio]) => (
                    <button key={label} onClick={() => { setIsCropping(true); setAppliedCrop(null); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      {label}
                    </button>
                  ))}
                </div>
                {appliedCrop && (
                  <button onClick={() => setAppliedCrop(null)} className="text-xs font-semibold" style={{ color: "#ff5555" }}>Remove crop</button>
                )}
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Tap a preset then drag on the photo to select area</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {cropRect ? "Release to confirm selection" : "Drag on the photo above to select crop area"}
                </p>
                <div className="flex gap-3">
                  <button onClick={applyCrop} disabled={!cropRect}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30"
                    style={{ background: "linear-gradient(135deg,#1a3d2b,#2E6B4F)" }}>
                    Apply Crop
                  </button>
                  <button onClick={cancelCrop}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
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
                placeholder="Add text to photo…"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", fontFamily: textFont, fontSize: 14 }} />
              <button onClick={addText} className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#1a3d2b,#2E6B4F)" }}>Add</button>
            </div>

            {/* Font family */}
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>FONT:</p>
              {TEXT_FONTS.map(f => (
                <button key={f} onClick={() => setTextFont(f)}
                  className="px-2.5 py-1 rounded-lg text-xs"
                  style={{ fontFamily: f, backgroundColor: textFont === f ? "rgba(76,175,125,0.25)" : "rgba(255,255,255,0.06)", color: textFont === f ? "#4CAF7D" : "rgba(255,255,255,0.5)", border: textFont === f ? "1px solid #4CAF7D40" : "1px solid transparent" }}>
                  Aa
                </button>
              ))}
            </div>

            {/* Colors */}
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>COLOR:</p>
              {COLORS.map(c => (
                <button key={c} onClick={() => setTextColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all active:scale-90"
                  style={{ backgroundColor: c, borderColor: textColor === c ? "#4CAF7D" : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>

            {/* Size */}
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>SIZE:</p>
              <input type="range" min={12} max={56} value={textSize} onChange={e => setTextSize(+e.target.value)}
                className="flex-1 accent-emerald-500" style={{ height: 3 }} />
              <p className="text-[10px] tabular-nums w-8" style={{ color: "rgba(255,255,255,0.4)" }}>{textSize}px</p>
            </div>

            {/* Active text chips */}
            {textItems.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {textItems.map(t => (
                  <div key={t.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.07)", border: `1px solid ${t.id === selectedText ? "#4CAF7D" : "rgba(255,255,255,0.12)"}` }}>
                    <span className="text-[10px] font-semibold" style={{ color: t.color, maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: t.fontFamily }}>{t.text}</span>
                    <button onClick={() => removeText(t.id)} style={{ color: "rgba(255,255,255,0.35)" }}><X className="w-3 h-3" /></button>
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