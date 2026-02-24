import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Pencil, Square, Circle, Type, Undo2, Redo2, ZoomIn, ZoomOut, 
  Trash2, Download, Save, Image, X, Check, Sparkles, ChevronLeft,
  Minus, Plus, Eraser, Move
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const COLORS = ["#1C1C1C","#FFFFFF","#3C6E5A","#D98B62","#BF9E79","#E07070","#6A9FD8","#9B8EC4","#D4A017","#4A7FC1","#7C8C6E","#C86B6B"];
const BRUSH_SIZES = [2, 4, 8, 14, 22];

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function ArtStudio() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [user, setUser] = useState(null);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#1C1C1C");
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [showPublish, setShowPublish] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState(null);
  const [enhancedUrl, setEnhancedUrl] = useState(null);
  const [enhancing, setEnhancing] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const lastPos = useRef(null);
  const startPos = useRef(null);
  const snapshotRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
  }, []);

  const getCtx = () => canvasRef.current?.getContext("2d");

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setHistory(prev => {
      const newHist = prev.slice(0, historyIndex + 1);
      newHist.push(data);
      return newHist;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    restoreSnapshot(history[newIdx]);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    restoreSnapshot(history[newIdx]);
  };

  const restoreSnapshot = (dataUrl) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!ctx || !canvas) return;
    const img = new window.Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
    img.src = dataUrl;
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return {
      x: (touch.clientX - rect.left) / zoom,
      y: (touch.clientY - rect.top) / zoom,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    lastPos.current = pos;
    startPos.current = pos;
    const ctx = getCtx();
    if (!ctx) return;

    if (tool === "fill") {
      // Simple flood fill not needed for MVP; just draw a filled rect
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveSnapshot();
      return;
    }

    snapshotRef.current = canvasRef.current.toDataURL();
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;

    if (tool === "pencil" || tool === "eraser") {
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    } else if (tool === "rect" || tool === "circle") {
      // Restore snapshot then draw shape
      if (snapshotRef.current) {
        const img = new window.Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0);
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = color;
          ctx.lineWidth = brushSize;
          if (tool === "rect") {
            ctx.strokeRect(startPos.current.x, startPos.current.y, pos.x - startPos.current.x, pos.y - startPos.current.y);
          } else {
            const rx = Math.abs(pos.x - startPos.current.x) / 2;
            const ry = Math.abs(pos.y - startPos.current.y) / 2;
            const cx = startPos.current.x + (pos.x - startPos.current.x) / 2;
            const cy = startPos.current.y + (pos.y - startPos.current.y) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
            ctx.stroke();
          }
        };
        img.src = snapshotRef.current;
      }
    }
  };

  const endDraw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSnapshot();
  };

  const clearCanvas = () => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
  };

  const exportPNG = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `artwork-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const canvasToBlob = () => new Promise((resolve) => {
    canvasRef.current.toBlob(resolve, "image/png", 1.0);
  });

  const handleSaveDraft = async () => {
    if (!user) return;
    setSaving(true);
    const blob = await canvasToBlob();
    const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
    await base44.entities.Artwork.create({
      user_email: user.email,
      user_name: user.full_name || "Artist",
      title: title || "Untitled Draft",
      description,
      image_url: file_url,
      status: "draft",
    });
    setSaving(false);
    alert("Draft saved!");
  };

  const handlePublish = async () => {
    if (!title.trim()) { alert("Please add a title"); return; }
    if (!user) return;
    setPublishing(true);
    const blob = await canvasToBlob();
    const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
    const artwork = await base44.entities.Artwork.create({
      user_email: user.email,
      user_name: user.full_name || "Artist",
      title: title.trim(),
      description,
      image_url: file_url,
      status: "published",
      like_count: 0,
      liked_by: [],
      comment_count: 0,
    });
    setPublishing(false);
    setPublishedId(artwork.id);
  };

  const handleEnhanceWithAI = async () => {
    setEnhancing(true);
    const blob = await canvasToBlob();
    const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
    const result = await base44.integrations.Core.GenerateImage({
      prompt: "Enhance and stylize this artwork with beautiful artistic details, rich colors, and professional finish. Keep the original composition.",
      existing_image_urls: [file_url],
    });
    setEnhancedUrl(result.url);
    setEnhancing(false);
    setShowAIPanel(true);
  };

  const applyEnhanced = async () => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = getCtx();
      const canvas = canvasRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveSnapshot();
      setShowAIPanel(false);
      setEnhancedUrl(null);
    };
    img.src = enhancedUrl;
  };

  const TOOLS = [
    { id: "pencil", icon: Pencil, label: "Pencil" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "rect", icon: Square, label: "Rect" },
    { id: "circle", icon: Circle, label: "Circle" },
  ];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#E6EFEA" }}>
      <div className="text-center p-8">
        <p className="text-2xl mb-2">🎨</p>
        <p className="font-semibold mb-4" style={{ color: "#243D33" }}>Sign in to use Art Studio</p>
        <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}>Sign In</Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#1a1a1a" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 z-20 shrink-0" style={{ backgroundColor: "#243D33", borderBottom: "1px solid #2D5244" }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm" style={{ color: "#BF9E79" }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-sm font-bold tracking-wide" style={{ color: "#E6EFEA", fontFamily: "var(--font-serif)" }}>Art Studio</span>
        <div className="flex gap-2">
          <button onClick={handleSaveDraft} disabled={saving}
            className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
            style={{ backgroundColor: "#2D5244", color: "#E6EFEA", border: "1px solid #3C6E5A" }}>
            {saving ? "…" : "💾 Draft"}
          </button>
          <button onClick={() => setShowPublish(true)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ backgroundColor: "#BF9E79", color: "#243D33" }}>
            🎨 Publish
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="flex flex-col items-center gap-2 py-3 px-2 shrink-0 overflow-y-auto" style={{ backgroundColor: "#243D33", width: toolbarOpen ? 56 : 0, transition: "width 0.2s" }}>
          {toolbarOpen && <>
            {/* Tools */}
            {TOOLS.map(t => (
              <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{ backgroundColor: tool === t.id ? "#BF9E79" : "#2D5244", color: tool === t.id ? "#243D33" : "#E6EFEA" }}>
                <t.icon className="w-4 h-4" />
              </button>
            ))}

            <div className="w-8 h-px my-1" style={{ backgroundColor: "#3C6E5A" }} />

            {/* Brush sizes */}
            {BRUSH_SIZES.map(s => (
              <button key={s} onClick={() => setBrushSize(s)}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{ backgroundColor: brushSize === s ? "#BF9E79" : "transparent" }}>
                <div className="rounded-full" style={{ width: Math.min(s * 1.5, 20), height: Math.min(s * 1.5, 20), backgroundColor: brushSize === s ? "#243D33" : "#E6EFEA" }} />
              </button>
            ))}

            <div className="w-8 h-px my-1" style={{ backgroundColor: "#3C6E5A" }} />

            {/* Colors */}
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-all"
                style={{ backgroundColor: c, border: color === c ? "2px solid #BF9E79" : "2px solid transparent", boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px #555" : "none" }} />
            ))}
          </>}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: "#2a2a2a" }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: "none", cursor: tool === "eraser" ? "cell" : "crosshair", transform: `scale(${zoom})`, transformOrigin: "center center" }}
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

      {/* Bottom actions bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 shrink-0" style={{ backgroundColor: "#243D33", borderTop: "1px solid #2D5244" }}>
        <button onClick={undo} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: "#E6EFEA" }} title="Undo">
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={redo} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: "#E6EFEA" }} title="Redo">
          <Redo2 className="w-4 h-4" />
        </button>
        <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: "#E6EFEA" }}>
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: "#E6EFEA" }}>
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={clearCanvas} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: "#E07070" }} title="Clear">
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={exportPNG} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: "#E6EFEA" }} title="Export PNG">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={handleEnhanceWithAI} disabled={enhancing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ backgroundColor: enhancing ? "#444" : "#BF9E79", color: "#243D33" }}>
          <Sparkles className="w-3.5 h-3.5" />
          {enhancing ? "Enhancing…" : "AI Enhance"}
        </button>
      </div>

      {/* Publish modal */}
      <AnimatePresence>
        {showPublish && !publishedId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl p-6 space-y-4" style={{ backgroundColor: "#E6EFEA" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>Publish to Gallery</h2>
                <button onClick={() => setShowPublish(false)}><X className="w-5 h-5" style={{ color: "#6B6B6B" }} /></button>
              </div>
              <Input placeholder="Artwork title *" value={title} onChange={e => setTitle(e.target.value)}
                className="rounded-xl" style={{ backgroundColor: "#DCCBB8", borderColor: "#BF9E79", color: "#243D33" }} />
              <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)}
                className="rounded-xl resize-none" rows={3} style={{ backgroundColor: "#DCCBB8", borderColor: "#BF9E79", color: "#243D33" }} />
              <Button onClick={handlePublish} disabled={publishing || !title.trim()} className="w-full rounded-xl text-white"
                style={{ backgroundColor: "#3C6E5A" }}>
                {publishing ? "Publishing…" : "🎨 Publish to Gallery"}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Success modal */}
        {publishedId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm rounded-3xl p-8 text-center space-y-4" style={{ backgroundColor: "#E6EFEA" }}>
              <p className="text-5xl">🎨</p>
              <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>Artwork Published!</h2>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>Your artwork is now live in the Gallery</p>
              <Button onClick={() => navigate(createPageUrl("Art"))} className="w-full rounded-xl" style={{ backgroundColor: "#3C6E5A", color: "#fff" }}>
                View in Gallery
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Enhancement panel */}
      <AnimatePresence>
        {showAIPanel && enhancedUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl p-6" style={{ backgroundColor: "#243D33" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold" style={{ color: "#E6EFEA", fontFamily: "var(--font-serif)" }}>✨ AI Enhanced Version</h2>
                <button onClick={() => setShowAIPanel(false)}><X className="w-5 h-5" style={{ color: "#BF9E79" }} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs mb-1 text-center" style={{ color: "#BF9E79" }}>Original</p>
                  <canvas ref={canvasRef} className="w-full rounded-xl aspect-square object-cover" style={{ pointerEvents: "none" }} />
                </div>
                <div>
                  <p className="text-xs mb-1 text-center" style={{ color: "#BF9E79" }}>Enhanced</p>
                  <img src={enhancedUrl} alt="Enhanced" className="w-full rounded-xl aspect-square object-cover" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowAIPanel(false)} variant="outline" className="flex-1 rounded-xl" style={{ borderColor: "#BF9E79", color: "#BF9E79" }}>
                  Cancel
                </Button>
                <Button onClick={applyEnhanced} className="flex-1 rounded-xl" style={{ backgroundColor: "#BF9E79", color: "#243D33" }}>
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