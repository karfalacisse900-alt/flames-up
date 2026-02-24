import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil, Square, Circle, Undo2, Redo2,
  Trash2, Download, Sparkles, ChevronLeft,
  Eraser, X, Check, Upload, Palette, Mic, MicOff, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const COLORS = [
  "#000000","#FFFFFF","#FF3B3B","#FF8C00","#FFD600",
  "#00C851","#3C6E5A","#0099FF","#9B59B6","#E91E8C",
  "#D98B62","#BF9E79","#808080","#4A4A4A",
];
const BG_COLORS = ["#FFFFFF","#FFF9F0","#F0F8F0","#1a1a1a","#243D33","#0a0a2a"];
const BRUSHES   = [2, 5, 10, 18, 28];

export default function ArtStudio() {
  const navigate   = useNavigate();
  const canvasRef  = useRef(null);
  const fileRef    = useRef(null);

  // Canvas logical size — always 800×600, display scales via CSS
  const CW = 800, CH = 600;

  const [user, setUser]     = useState(null);
  const [tool, setTool]     = useState("pencil");
  const [color, setColor]   = useState("#000000");
  const [bg, setBg]         = useState("#FFFFFF");
  const [size, setSize]     = useState(5);
  const [alpha, setAlpha]   = useState(100);

  // Use refs for all drawing state to avoid stale-closure bugs
  const drawing   = useRef(false);
  const lastP     = useRef(null);
  const startP    = useRef(null);
  const snap      = useRef(null);

  const histArr   = useRef([]);
  const histIdx   = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // UI state
  const [showBg,      setShowBg]      = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showExport,  setShowExport]  = useState(false);
  const [showAI,      setShowAI]      = useState(false);
  const [title,       setTitle]       = useState("");
  const [desc,        setDesc]        = useState("");
  const [saving,      setSaving]      = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [published,   setPublished]   = useState(false);
  const [enhancedUrl, setEnhancedUrl] = useState(null);
  const [origUrl,     setOrigUrl]     = useState(null);
  const [enhancing,   setEnhancing]   = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // Init canvas
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width  = CW;
    c.height = CH;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CW, CH);
    saveSnap();
  }, []); // eslint-disable-line

  const saveSnap = () => {
    const c = canvasRef.current;
    if (!c) return;
    const d = c.toDataURL();
    const h = histArr.current.slice(0, histIdx.current + 1);
    h.push(d);
    histArr.current = h;
    histIdx.current = h.length - 1;
    setCanUndo(histIdx.current > 0);
    setCanRedo(false);
  };

  const applySnap = (url) => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    const img = new Image();
    img.onload = () => { ctx.clearRect(0,0,CW,CH); ctx.drawImage(img,0,0); };
    img.src = url;
  };

  const undo = () => {
    if (histIdx.current <= 0) return;
    histIdx.current--;
    applySnap(histArr.current[histIdx.current]);
    setCanUndo(histIdx.current > 0);
    setCanRedo(true);
  };
  const redo = () => {
    if (histIdx.current >= histArr.current.length - 1) return;
    histIdx.current++;
    applySnap(histArr.current[histIdx.current]);
    setCanUndo(true);
    setCanRedo(histIdx.current < histArr.current.length - 1);
  };

  // Convert pointer event → canvas coords (accounts for CSS scaling)
  const getPos = (e) => {
    const c    = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const pt   = e.touches?.[0] ?? e;
    return {
      x: ((pt.clientX - rect.left) / rect.width)  * CW,
      y: ((pt.clientY - rect.top)  / rect.height) * CH,
    };
  };

  const onDown = (e) => {
    e.preventDefault();
    const p = getPos(e);
    lastP.current  = p;
    startP.current = p;
    drawing.current = true;
    if (tool === "rect" || tool === "circle") {
      snap.current = canvasRef.current.toDataURL();
    }
  };

  const onMove = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const p   = getPos(e);
    const c   = canvasRef.current;
    const ctx = c.getContext("2d");
    ctx.globalAlpha = alpha / 100;

    if (tool === "pencil") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth   = size;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      ctx.beginPath();
      ctx.moveTo(lastP.current.x, lastP.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastP.current = p;

    } else if (tool === "eraser") {
      ctx.globalAlpha              = 1;
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = size * 2.5;
      ctx.lineCap   = "round";
      ctx.lineJoin  = "round";
      ctx.beginPath();
      ctx.moveTo(lastP.current.x, lastP.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastP.current = p;

    } else if (snap.current) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, CW, CH);
        ctx.drawImage(img, 0, 0);
        ctx.globalAlpha              = alpha / 100;
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.lineWidth   = size;
        ctx.lineCap     = "round";
        if (tool === "rect") {
          ctx.beginPath();
          ctx.strokeRect(
            startP.current.x, startP.current.y,
            p.x - startP.current.x, p.y - startP.current.y
          );
        } else {
          const rx = Math.abs(p.x - startP.current.x) / 2;
          const ry = Math.abs(p.y - startP.current.y) / 2;
          const cx = startP.current.x + (p.x - startP.current.x) / 2;
          const cy = startP.current.y + (p.y - startP.current.y) / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.max(rx,1), Math.max(ry,1), 0, 0, 2*Math.PI);
          ctx.stroke();
        }
      };
      img.src = snap.current;
    }
  };

  const onUp = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    const ctx = canvasRef.current.getContext("2d");
    ctx.globalAlpha              = 1;
    ctx.globalCompositeOperation = "source-over";
    saveSnap();
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.globalAlpha              = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);
    saveSnap();
  };

  const changeBg = (newBg) => {
    setBg(newBg); setShowBg(false);
    const c   = canvasRef.current;
    const ctx = c.getContext("2d");
    const d   = c.toDataURL();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = newBg;
    ctx.fillRect(0, 0, CW, CH);
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0); saveSnap(); };
    img.src = d;
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c   = canvasRef.current;
      const ctx = c.getContext("2d");
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CW, CH);
      const s  = Math.min(CW / img.naturalWidth, CH / img.naturalHeight);
      const sw = img.naturalWidth  * s;
      const sh = img.naturalHeight * s;
      ctx.drawImage(img, (CW-sw)/2, (CH-sh)/2, sw, sh);
      saveSnap();
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = "";
  };

  const getBlob = (type = "image/png", q = 1) =>
    new Promise(res => canvasRef.current.toBlob(blob => {
      const ext = type.includes("jpeg") ? "jpg" : "png";
      res(new File([blob], `artwork.${ext}`, { type }));
    }, type, q));

  const doExport = (fmt, q = 1) => {
    const c = canvasRef.current;
    const dl = (blob, ext) => {
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), { href: url, download: `artwork-${Date.now()}.${ext}` }).click();
      URL.revokeObjectURL(url);
    };
    if (fmt === "svg") {
      const d = c.toDataURL("image/png");
      dl(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}"><image href="${d}" width="${CW}" height="${CH}"/></svg>`], { type: "image/svg+xml" }), "svg");
    } else if (fmt === "jpg") {
      const off = Object.assign(document.createElement("canvas"), { width: CW, height: CH });
      const ox  = off.getContext("2d");
      ox.fillStyle = "#fff"; ox.fillRect(0,0,CW,CH); ox.drawImage(c,0,0);
      off.toBlob(b => dl(b,"jpg"), "image/jpeg", q);
    } else {
      c.toBlob(b => dl(b,"png"), "image/png");
    }
    setShowExport(false);
  };

  const saveDraft = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const blob = await getBlob();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      await base44.entities.Artwork.create({ user_email: user.email, user_name: user.full_name || "Artist", title: title || "Untitled Draft", description: desc, image_url: file_url, status: "draft" });
      alert("Draft saved!");
    } finally { setSaving(false); }
  };

  const publish = async () => {
    if (!title.trim()) { alert("Add a title first"); return; }
    if (!user) return;
    setPublishing(true);
    try {
      const blob = await getBlob();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      await base44.entities.Artwork.create({ user_email: user.email, user_name: user.full_name || "Artist", title: title.trim(), description: desc, image_url: file_url, status: "published", like_count: 0, liked_by: [], comment_count: 0 });
      setPublished(true); setShowPublish(false);
    } finally { setPublishing(false); }
  };

  const enhanceAI = async () => {
    setEnhancing(true);
    try {
      setOrigUrl(canvasRef.current.toDataURL());
      const blob = await getBlob();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      const r = await base44.integrations.Core.GenerateImage({
        prompt: "Enhance and stylize this artwork with beautiful artistic details, rich colors, and professional finish. Preserve the original composition.",
        existing_image_urls: [file_url],
      });
      setEnhancedUrl(r.url); setShowAI(true);
    } catch { alert("AI enhancement failed. Try again."); }
    finally { setEnhancing(false); }
  };

  const applyAI = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0,0,CW,CH); ctx.drawImage(img,0,0,CW,CH);
      saveSnap(); setShowAI(false); setEnhancedUrl(null); setOrigUrl(null);
    };
    img.onerror = () => alert("Couldn't apply enhanced image.");
    img.src = enhancedUrl;
  };

  const TOOLS = [
    { id: "pencil", icon: Pencil, label: "Pencil" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "rect",   icon: Square, label: "Rectangle" },
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
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#1a1e1b", userSelect: "none" }}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImport} />

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ backgroundColor: "#243D33", borderBottom: "1px solid #3C6E5A", height: 48 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm" style={{ color: "#BF9E79" }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-sm font-bold" style={{ color: "#E6EFEA", fontFamily: "var(--font-serif)" }}>🎨 Art Studio</span>
        <div className="flex gap-2">
          <button onClick={saveDraft} disabled={saving} className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: "#2D5244", color: "#E6EFEA", border: "1px solid #3C6E5A" }}>
            {saving ? "…" : "💾 Draft"}
          </button>
          <button onClick={() => setShowPublish(true)} className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: "#BF9E79", color: "#243D33" }}>
            Publish
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div className="flex flex-col items-center gap-2 py-3 shrink-0 overflow-y-auto" style={{ width: 58, backgroundColor: "#1E3028", borderRight: "1px solid #2D5244" }}>
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: tool === t.id ? "#BF9E79" : "#2D5244", color: tool === t.id ? "#243D33" : "#A0B8A8", transition: "all .15s" }}>
              <t.icon className="w-[18px] h-[18px]" />
            </button>
          ))}

          <div className="w-8 h-px my-0.5" style={{ backgroundColor: "#3C6E5A" }} />

          {BRUSHES.map(s => (
            <button key={s} onClick={() => setSize(s)}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ border: size === s ? "1.5px solid #BF9E79" : "1.5px solid transparent", backgroundColor: size === s ? "#2D5244" : "transparent" }}>
              <div className="rounded-full" style={{ width: Math.min(s * 1.3, 24), height: Math.min(s * 1.3, 24), backgroundColor: size === s ? "#BF9E79" : "#A0B8A8" }} />
            </button>
          ))}

          <div className="w-8 h-px my-0.5" style={{ backgroundColor: "#3C6E5A" }} />

          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: c, border: color === c ? "2.5px solid #BF9E79" : "2px solid #3C6E5A", transform: color === c ? "scale(1.18)" : "scale(1)", transition: "transform .15s", boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px #666" : "none" }} />
          ))}
        </div>

        {/* CANVAS */}
        <div className="flex-1 flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#2a2e2b" }}>
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              touchAction: "none",
              cursor: tool === "eraser" ? "cell" : "crosshair",
              /* Fit within container keeping 4:3 ratio */
              width:  "min(calc((100dvh - 120px) * 4/3), calc(100% - 16px))",
              height: "min(calc(100dvh - 120px), calc((100% - 16px) * 3/4))",
              boxShadow: "0 6px 32px rgba(0,0,0,0.6)",
              borderRadius: 2,
            }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          />
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0 gap-2" style={{ backgroundColor: "#243D33", borderTop: "1px solid #2D5244", height: 52 }}>
        <div className="flex gap-1.5">
          <button onClick={undo} disabled={!canUndo} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: canUndo ? "#E6EFEA" : "#444" }}><Undo2 className="w-4 h-4" /></button>
          <button onClick={redo} disabled={!canRedo} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: canRedo ? "#E6EFEA" : "#444" }}><Redo2 className="w-4 h-4" /></button>
          <button onClick={clearCanvas} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: "#E07070" }}><Trash2 className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: "#A0B8A8" }}>α</span>
          <input type="range" min={10} max={100} value={alpha} onChange={e => setAlpha(+e.target.value)} className="w-14" style={{ accentColor: "#BF9E79" }} />
          <span className="text-[10px] w-6" style={{ color: "#BF9E79" }}>{alpha}%</span>

          <button onClick={() => setShowBg(v => !v)} className="w-9 h-9 rounded-xl flex items-center justify-center relative" style={{ backgroundColor: "#2D5244", color: "#E6EFEA" }}>
            <Palette className="w-4 h-4" />
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2" style={{ backgroundColor: bg, borderColor: "#243D33" }} />
          </button>
        </div>

        <div className="flex gap-1.5">
          <button onClick={() => fileRef.current?.click()} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: "#6A9FD8" }}><Upload className="w-4 h-4" /></button>
          <button onClick={() => setShowExport(true)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2D5244", color: "#E6EFEA" }}><Download className="w-4 h-4" /></button>
          <button onClick={enhanceAI} disabled={enhancing} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: enhancing ? "#333" : "#BF9E79", color: "#243D33" }}>
            <Sparkles className="w-3.5 h-3.5" />{enhancing ? "…" : "AI"}
          </button>
        </div>
      </div>

      {/* BG picker popup */}
      <AnimatePresence>
        {showBg && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
            className="fixed bottom-14 right-24 z-40 p-3 rounded-2xl shadow-xl"
            style={{ backgroundColor: "#243D33", border: "1px solid #3C6E5A" }}>
            <p className="text-[10px] font-semibold mb-2 text-center" style={{ color: "#BF9E79" }}>Background</p>
            <div className="grid grid-cols-3 gap-2">
              {BG_COLORS.map(c => (
                <button key={c} onClick={() => changeBg(c)} className="w-9 h-9 rounded-full"
                  style={{ backgroundColor: c, border: bg === c ? "2.5px solid #BF9E79" : "2px solid #3C6E5A", boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px #555" : "none" }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export sheet */}
      <AnimatePresence>
        {showExport && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,.6)" }}
            onClick={() => setShowExport(false)}>
            <motion.div initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }} transition={{ type:"spring", damping:28, stiffness:300 }}
              className="w-full max-w-lg rounded-t-3xl p-6 space-y-3" style={{ backgroundColor: "#E6EFEA" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-1">
                <h2 className="text-lg font-bold" style={{ fontFamily:"var(--font-serif)", color:"#243D33" }}>Export</h2>
                <button onClick={() => setShowExport(false)}><X className="w-5 h-5" style={{ color:"#6B6B6B" }} /></button>
              </div>
              {[{ f:"png",label:"PNG",desc:"Lossless · transparent background" },{ f:"jpg",label:"JPG High",desc:"90% quality · white bg" },{ f:"jpg_med",label:"JPG Medium",desc:"70% quality · smaller file" },{ f:"svg",label:"SVG",desc:"Vector wrapper + embedded image" }].map(({ f,label,desc }) => (
                <button key={f} onClick={() => f === "jpg" ? doExport("jpg",.9) : f === "jpg_med" ? doExport("jpg",.7) : doExport(f)}
                  className="w-full flex justify-between items-center px-4 py-3 rounded-xl text-left"
                  style={{ backgroundColor:"#DCCBB8", border:"1px solid #BF9E7960" }}>
                  <div><p className="text-sm font-semibold" style={{ color:"#243D33" }}>{label}</p><p className="text-[11px]" style={{ color:"#6B6B6B" }}>{desc}</p></div>
                  <Download className="w-4 h-4" style={{ color:"#3C6E5A" }} />
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish sheet */}
      <AnimatePresence>
        {showPublish && !published && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor:"rgba(0,0,0,.6)" }}
            onClick={() => setShowPublish(false)}>
            <motion.div initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }} transition={{ type:"spring", damping:28, stiffness:300 }}
              className="w-full max-w-lg rounded-t-3xl p-6 space-y-4" style={{ backgroundColor:"#E6EFEA" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between">
                <h2 className="text-lg font-bold" style={{ fontFamily:"var(--font-serif)", color:"#243D33" }}>Publish to Gallery</h2>
                <button onClick={() => setShowPublish(false)}><X className="w-5 h-5" style={{ color:"#6B6B6B" }} /></button>
              </div>
              <Input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl" style={{ backgroundColor:"#DCCBB8", borderColor:"#BF9E79", color:"#243D33" }} />
              <Textarea placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="rounded-xl resize-none" style={{ backgroundColor:"#DCCBB8", borderColor:"#BF9E79", color:"#243D33" }} />
              <Button onClick={publish} disabled={publishing || !title.trim()} className="w-full rounded-xl" style={{ backgroundColor:"#3C6E5A", color:"#fff" }}>
                {publishing ? "Publishing…" : "🎨 Publish to Gallery"}
              </Button>
            </motion.div>
          </motion.div>
        )}
        {published && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor:"rgba(0,0,0,.7)" }}>
            <motion.div initial={{ scale:.8 }} animate={{ scale:1 }}
              className="w-full max-w-sm rounded-3xl p-8 text-center space-y-4" style={{ backgroundColor:"#E6EFEA" }}>
              <p className="text-5xl">🎨</p>
              <h2 className="text-xl font-bold" style={{ fontFamily:"var(--font-serif)", color:"#243D33" }}>Published!</h2>
              <p className="text-sm" style={{ color:"#6B6B6B" }}>Your artwork is live in the Gallery</p>
              <Button onClick={() => navigate(createPageUrl("Gallery"))} className="w-full rounded-xl" style={{ backgroundColor:"#3C6E5A", color:"#fff" }}>View in Gallery</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI panel */}
      <AnimatePresence>
        {showAI && enhancedUrl && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor:"rgba(0,0,0,.85)" }}>
            <motion.div initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }} transition={{ type:"spring", damping:28, stiffness:300 }}
              className="w-full max-w-lg rounded-t-3xl p-6" style={{ backgroundColor:"#243D33" }}>
              <div className="flex justify-between mb-4">
                <h2 className="font-bold" style={{ color:"#E6EFEA", fontFamily:"var(--font-serif)" }}>✨ AI Enhanced</h2>
                <button onClick={() => { setShowAI(false); setEnhancedUrl(null); }}><X className="w-5 h-5" style={{ color:"#BF9E79" }} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><p className="text-xs mb-1 text-center" style={{ color:"#BF9E79" }}>Original</p>{origUrl && <img src={origUrl} alt="Original" className="w-full rounded-xl" style={{ aspectRatio:"4/3", objectFit:"cover" }} />}</div>
                <div><p className="text-xs mb-1 text-center" style={{ color:"#BF9E79" }}>Enhanced</p><img src={enhancedUrl} alt="Enhanced" className="w-full rounded-xl" style={{ aspectRatio:"4/3", objectFit:"cover" }} /></div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => { setShowAI(false); setEnhancedUrl(null); }} variant="outline" className="flex-1 rounded-xl" style={{ borderColor:"#BF9E79", color:"#BF9E79" }}>Keep Original</Button>
                <Button onClick={applyAI} className="flex-1 rounded-xl" style={{ backgroundColor:"#BF9E79", color:"#243D33" }}><Check className="w-4 h-4 mr-1" />Apply</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}