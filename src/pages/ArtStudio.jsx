import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil, Square, Circle, Undo2, Redo2, ZoomIn, ZoomOut,
  Trash2, Download, Sparkles, ChevronLeft,
  Eraser, X, Check, Upload, Palette, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const COLORS = [
  "#000000","#FFFFFF","#FF0000","#FF6B6B","#FF8C00","#FFD700",
  "#00C851","#3C6E5A","#00BFFF","#4A7FC1","#9B59B6","#E91E8C",
  "#8B4513","#D98B62","#BF9E79","#808080"
];
const BG_COLORS = ["#FFFFFF","#FFF9F0","#F0F5F0","#F5F0FF","#FFF0F5","#F0F5FF","#1a1a1a","#243D33"];

const CANVAS_W = 800;
const CANVAS_H = 600;

export default function ArtStudio() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  const [user, setUser] = useState(null);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [brushSize, setBrushSize] = useState(6);
  const [opacity, setOpacity] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);

  // History stored as refs to avoid stale closure bugs
  const historyRef = useRef([]);
  const historyIdxRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const lastPos = useRef(null);
  const startPos = useRef(null);
  const snapshotRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Panels
  const [showColorPanel, setShowColorPanel] = useState(true);
  const [showBrushPanel, setShowBrushPanel] = useState(true);
  const [showBgPicker, setShowBgPicker] = useState(false);

  // Modals
  const [showPublish, setShowPublish] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState(null);
  const [enhancedUrl, setEnhancedUrl] = useState(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState(null);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Initialize canvas once it mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    pushHistory();
  }, []);

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    const newHist = historyRef.current.slice(0, historyIdxRef.current + 1);
    newHist.push(data);
    historyRef.current = newHist;
    historyIdxRef.current = newHist.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
  };

  const undo = () => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    loadSnapshot(historyRef.current[historyIdxRef.current]);
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(true);
  };

  const redo = () => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    loadSnapshot(historyRef.current[historyIdxRef.current]);
    setCanUndo(true);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  };

  const loadSnapshot = (dataUrl) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  };

  // Get position relative to canvas
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const touch = e.touches?.[0] || e;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const getCtx = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return null;
    ctx.globalAlpha = opacity / 100;
    return ctx;
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    lastPos.current = pos;
    startPos.current = pos;
    isDrawingRef.current = true;
    setIsDrawing(true);

    const ctx = getCtx();
    if (!ctx) return;

    // For shapes, take a snapshot before drawing
    if (tool === "rect" || tool === "circle") {
      snapshotRef.current = canvasRef.current.toDataURL();
    }
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const pos = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;

    if (tool === "pencil") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    } else if (tool === "eraser") {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = brushSize * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    } else if ((tool === "rect" || tool === "circle") && snapshotRef.current) {
      // Redraw from snapshot then draw the shape preview
      const img = new window.Image();
      img.onload = () => {
        const c = canvasRef.current;
        const cx = c.getContext("2d");
        cx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        cx.drawImage(img, 0, 0);
        cx.globalAlpha = opacity / 100;
        cx.globalCompositeOperation = "source-over";
        cx.strokeStyle = color;
        cx.lineWidth = brushSize;
        cx.lineCap = "round";
        if (tool === "rect") {
          cx.beginPath();
          cx.strokeRect(
            startPos.current.x, startPos.current.y,
            pos.x - startPos.current.x, pos.y - startPos.current.y
          );
        } else {
          const rx = Math.abs(pos.x - startPos.current.x) / 2;
          const ry = Math.abs(pos.y - startPos.current.y) / 2;
          const cxc = startPos.current.x + (pos.x - startPos.current.x) / 2;
          const cyc = startPos.current.y + (pos.y - startPos.current.y) / 2;
          cx.beginPath();
          cx.ellipse(cxc, cyc, Math.max(rx, 1), Math.max(ry, 1), 0, 0, 2 * Math.PI);
          cx.stroke();
        }
      };
      img.src = snapshotRef.current;
    }
  };

  const endDraw = (e) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsDrawing(false);
    pushHistory();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    pushHistory();
  };

  const changeBg = (newBg) => {
    setBgColor(newBg);
    setShowBgPicker(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const snapshot = canvas.toDataURL();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = newBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const img = new window.Image();
    img.onload = () => { ctx.drawImage(img, 0, 0); pushHistory(); };
    img.src = snapshot;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      // Fill background first
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Scale image to fill canvas maintaining aspect ratio
      const scale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      const sx = (CANVAS_W - sw) / 2;
      const sy = (CANVAS_H - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh);
      pushHistory();
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = "";
  };

  const getBlob = (type = "image/png", quality = 1) =>
    new Promise((resolve) => canvasRef.current.toBlob(resolve, type, quality));

  const handleExport = (format, quality = 1) => {
    const canvas = canvasRef.current;
    if (format === "jpg") {
      // For JPG, flatten transparency to white first
      const off = document.createElement("canvas");
      off.width = CANVAS_W; off.height = CANVAS_H;
      const octx = off.getContext("2d");
      octx.fillStyle = "#FFFFFF";
      octx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      octx.drawImage(canvas, 0, 0);
      off.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = `artwork-${Date.now()}.jpg`;
        a.href = url; a.click();
        URL.revokeObjectURL(url);
      }, "image/jpeg", quality);
    } else if (format === "svg") {
      const dataUrl = canvas.toDataURL("image/png");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}">
  <image href="${dataUrl}" width="${CANVAS_W}" height="${CANVAS_H}"/>
</svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `artwork-${Date.now()}.svg`;
      a.href = url; a.click();
      URL.revokeObjectURL(url);
    } else {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = `artwork-${Date.now()}.png`;
        a.href = url; a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    }
    setShowExport(false);
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const blob = await getBlob();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      await base44.entities.Artwork.create({
        user_email: user.email, user_name: user.full_name || "Artist",
        title: title || "Untitled Draft", description, image_url: file_url, status: "draft",
      });
      alert("Draft saved!");
    } finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (!title.trim()) { alert("Please add a title"); return; }
    if (!user) return;
    setPublishing(true);
    try {
      const blob = await getBlob();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      const artwork = await base44.entities.Artwork.create({
        user_email: user.email, user_name: user.full_name || "Artist",
        title: title.trim(), description, image_url: file_url,
        status: "published", like_count: 0, liked_by: [], comment_count: 0,
      });
      setPublishedId(artwork.id);
      setShowPublish(false);
    } finally { setPublishing(false); }
  };

  const handleEnhanceWithAI = async () => {
    setEnhancing(true);
    try {
      setOriginalPreviewUrl(canvasRef.current.toDataURL());
      const blob = await getBlob();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      const result = await base44.integrations.Core.GenerateImage({
        prompt: "Enhance and stylize this artwork with beautiful artistic details, rich colors, and professional finish. Keep the original composition intact.",
        existing_image_urls: [file_url],
      });
      setEnhancedUrl(result.url);
      setShowAIPanel(true);
    } catch {
      alert("AI enhancement failed. Please try again.");
    } finally { setEnhancing(false); }
  };

  const applyEnhanced = () => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      pushHistory();
      setShowAIPanel(false); setEnhancedUrl(null); setOriginalPreviewUrl(null);
    };
    img.onerror = () => alert("Could not load enhanced image.");
    img.src = enhancedUrl;
  };

  const TOOLS = [
    { id: "pencil", icon: Pencil, label: "Pencil" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "rect", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Ellipse" },
  ];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#E6EFEA" }}>
      <div className="text-center p-8">
        <p className="text-4xl mb-2">🎨</p>
        <p className="font-semibold mb-4" style={{ color: "#243D33" }}>Sign in to use Art Studio</p>
        <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}>Sign In</Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col select-none" style={{ backgroundColor: "#1a1e1b" }}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 z-20"
        style={{ backgroundColor: "#243D33", borderBottom: "1px solid #3C6E5A" }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm" style={{ color: "#BF9E79" }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-sm font-bold tracking-wide" style={{ color: "#E6EFEA", fontFamily: "var(--font-serif)" }}>
          🎨 Art Studio
        </span>
        <div className="flex items-center gap-2">
          <button onClick={handleSaveDraft} disabled={saving}
            className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ backgroundColor: "#2D5244", color: "#E6EFEA", border: "1px solid #3C6E5A" }}>
            {saving ? "Saving…" : "💾 Draft"}
          </button>
          <button onClick={() => setShowPublish(true)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ backgroundColor: "#BF9E79", color: "#243D33" }}>
            Publish
          </button>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col gap-3 py-3 px-2 shrink-0 overflow-y-auto scrollbar-hide"
          style={{ backgroundColor: "#1E3028", width: 64, borderRight: "1px solid #2D5244" }}>

          {/* Tools */}
          <div className="flex flex-col gap-1.5">
            {TOOLS.map(t => (
              <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto"
                style={{
                  backgroundColor: tool === t.id ? "#BF9E79" : "#2D5244",
                  color: tool === t.id ? "#243D33" : "#A0B8A8",
                  boxShadow: tool === t.id ? "0 2px 8px rgba(191,158,121,0.4)" : "none"
                }}>
                <t.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="w-8 h-px mx-auto" style={{ backgroundColor: "#3C6E5A" }} />

          {/* Brush sizes */}
          <div className="flex flex-col gap-1 items-center">
            {[2, 4, 8, 14, 22].map(s => (
              <button key={s} onClick={() => setBrushSize(s)}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{ backgroundColor: brushSize === s ? "#2D5244" : "transparent", border: brushSize === s ? "1.5px solid #BF9E79" : "1.5px solid transparent" }}>
                <div className="rounded-full" style={{
                  width: Math.min(s * 1.4, 22), height: Math.min(s * 1.4, 22),
                  backgroundColor: brushSize === s ? "#BF9E79" : "#A0B8A8"
                }} />
              </button>
            ))}
          </div>

          <div className="w-8 h-px mx-auto" style={{ backgroundColor: "#3C6E5A" }} />

          {/* Color swatches */}
          <div className="flex flex-col gap-1 items-center">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  backgroundColor: c,
                  border: color === c ? "2.5px solid #BF9E79" : "2px solid #3C6E5A",
                  transform: color === c ? "scale(1.15)" : "scale(1)",
                  boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px #555" : "none"
                }} />
            ))}
          </div>
        </div>

        {/* ── CANVAS AREA ── */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-auto"
          style={{ backgroundColor: "#2a2e2b" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            {/* Shadow frame */}
            <div style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6)", borderRadius: 4 }}>
              <canvas
                ref={canvasRef}
                style={{
                  display: "block",
                  touchAction: "none",
                  cursor: tool === "eraser" ? "cell" : "crosshair",
                  maxWidth: "calc(100vw - 80px)",
                  maxHeight: "calc(100dvh - 140px)",
                  width: "min(800px, calc(100vw - 80px))",
                  height: "auto",
                }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 shrink-0"
        style={{ backgroundColor: "#243D33", borderTop: "1px solid #2D5244" }}>

        {/* Left: Undo/Redo/Clear */}
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={!canUndo} title="Undo"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor: "#2D5244", color: canUndo ? "#E6EFEA" : "#555" }}>
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={!canRedo} title="Redo"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ backgroundColor: "#2D5244", color: canRedo ? "#E6EFEA" : "#555" }}>
            <Redo2 className="w-4 h-4" />
          </button>
          <button onClick={clearCanvas} title="Clear canvas"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#2D5244", color: "#E07070" }}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Opacity + BG */}
        <div className="flex items-center gap-2">
          {/* Opacity */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold" style={{ color: "#A0B8A8" }}>α</span>
            <input type="range" min={10} max={100} value={opacity} onChange={e => setOpacity(+e.target.value)}
              className="w-16 accent-amber-400" />
            <span className="text-[10px] w-7 text-right" style={{ color: "#BF9E79" }}>{opacity}%</span>
          </div>

          {/* BG color */}
          <button onClick={() => setShowBgPicker(v => !v)} title="Canvas background"
            className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ backgroundColor: "#2D5244", color: "#E6EFEA" }}>
            <Palette className="w-4 h-4" />
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
              style={{ backgroundColor: bgColor, borderColor: "#243D33" }} />
          </button>
        </div>

        {/* Right: Upload, Export, AI */}
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} title="Import image"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#2D5244", color: "#6A9FD8" }}>
            <Upload className="w-4 h-4" />
          </button>
          <button onClick={() => setShowExport(true)} title="Export"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#2D5244", color: "#E6EFEA" }}>
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleEnhanceWithAI} disabled={enhancing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: enhancing ? "#444" : "#BF9E79", color: "#243D33" }}>
            <Sparkles className="w-3.5 h-3.5" />
            {enhancing ? "…" : "AI"}
          </button>
        </div>
      </div>

      {/* BG Color Picker Popup */}
      <AnimatePresence>
        {showBgPicker && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-16 right-32 z-40 p-3 rounded-2xl shadow-xl"
            style={{ backgroundColor: "#243D33", border: "1px solid #3C6E5A" }}>
            <p className="text-[10px] font-semibold mb-2 text-center" style={{ color: "#BF9E79" }}>Background</p>
            <div className="grid grid-cols-4 gap-1.5">
              {BG_COLORS.map(c => (
                <button key={c} onClick={() => changeBg(c)}
                  className="w-8 h-8 rounded-full"
                  style={{
                    backgroundColor: c,
                    border: bgColor === c ? "2.5px solid #BF9E79" : "2px solid #3C6E5A",
                    boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px #555" : "none"
                  }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowExport(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl p-6 space-y-3" style={{ backgroundColor: "#E6EFEA" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>Export Artwork</h2>
                <button onClick={() => setShowExport(false)}><X className="w-5 h-5" style={{ color: "#6B6B6B" }} /></button>
              </div>
              {[
                { fmt: "png", label: "PNG", desc: "Lossless, transparent background" },
                { fmt: "jpg", label: "JPG (High)", desc: "Compressed, white background (90%)" },
                { fmt: "jpg_med", label: "JPG (Medium)", desc: "Smaller file size (70%)" },
                { fmt: "svg", label: "SVG", desc: "Vector wrapper with embedded image" },
              ].map(({ fmt, label, desc }) => (
                <button key={fmt} onClick={() => {
                  if (fmt === "jpg") handleExport("jpg", 0.9);
                  else if (fmt === "jpg_med") handleExport("jpg", 0.7);
                  else handleExport(fmt);
                }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                  style={{ backgroundColor: "#DCCBB8", border: "1px solid #BF9E7960" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#243D33" }}>{label}</p>
                    <p className="text-[11px]" style={{ color: "#6B6B6B" }}>{desc}</p>
                  </div>
                  <Download className="w-4 h-4" style={{ color: "#3C6E5A" }} />
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublish && !publishedId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowPublish(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl p-6 space-y-4" style={{ backgroundColor: "#E6EFEA" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>Publish to Gallery</h2>
                <button onClick={() => setShowPublish(false)}><X className="w-5 h-5" style={{ color: "#6B6B6B" }} /></button>
              </div>
              <Input placeholder="Artwork title *" value={title} onChange={e => setTitle(e.target.value)}
                className="rounded-xl" style={{ backgroundColor: "#DCCBB8", borderColor: "#BF9E79", color: "#243D33" }} />
              <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)}
                className="rounded-xl resize-none" rows={3} style={{ backgroundColor: "#DCCBB8", borderColor: "#BF9E79", color: "#243D33" }} />
              <Button onClick={handlePublish} disabled={publishing || !title.trim()} className="w-full rounded-xl"
                style={{ backgroundColor: "#3C6E5A", color: "#fff" }}>
                {publishing ? "Publishing…" : "🎨 Publish to Gallery"}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {publishedId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="w-full max-w-sm rounded-3xl p-8 text-center space-y-4" style={{ backgroundColor: "#E6EFEA" }}>
              <p className="text-5xl">🎨</p>
              <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>Published!</h2>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>Your artwork is now live in the Gallery</p>
              <Button onClick={() => navigate(createPageUrl("Gallery"))} className="w-full rounded-xl"
                style={{ backgroundColor: "#3C6E5A", color: "#fff" }}>
                View in Gallery
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Enhancement Panel */}
      <AnimatePresence>
        {showAIPanel && enhancedUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl p-6" style={{ backgroundColor: "#243D33" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold" style={{ color: "#E6EFEA", fontFamily: "var(--font-serif)" }}>✨ AI Enhanced</h2>
                <button onClick={() => { setShowAIPanel(false); setEnhancedUrl(null); }}>
                  <X className="w-5 h-5" style={{ color: "#BF9E79" }} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs mb-1 text-center" style={{ color: "#BF9E79" }}>Original</p>
                  {originalPreviewUrl && <img src={originalPreviewUrl} alt="Original" className="w-full rounded-xl object-cover" style={{ aspectRatio: "4/3" }} />}
                </div>
                <div>
                  <p className="text-xs mb-1 text-center" style={{ color: "#BF9E79" }}>Enhanced</p>
                  <img src={enhancedUrl} alt="Enhanced" className="w-full rounded-xl object-cover" style={{ aspectRatio: "4/3" }} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => { setShowAIPanel(false); setEnhancedUrl(null); }} variant="outline" className="flex-1 rounded-xl"
                  style={{ borderColor: "#BF9E79", color: "#BF9E79" }}>
                  Keep Original
                </Button>
                <Button onClick={applyEnhanced} className="flex-1 rounded-xl"
                  style={{ backgroundColor: "#BF9E79", color: "#243D33" }}>
                  <Check className="w-4 h-4 mr-1" /> Apply
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}