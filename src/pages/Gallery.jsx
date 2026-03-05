import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, X, Send, Flame, Clock, Star, Search,
  Sparkles, Upload, Eye, Loader2, Camera, Trophy, Grid3X3,
  MapPin, ExternalLink, Tag, ChevronDown, ChevronUp,
} from "lucide-react";
import ArtVoiceComment from "@/components/art/ArtVoiceComment";
import ArtVoteArena from "@/components/gallery/ArtVoteArena";
import DailyWinnerBanner from "@/components/gallery/DailyWinnerBanner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PhotoEditor from "@/components/editor/PhotoEditor";

// ── Categories ────────────────────────────────────────────────────────────────
const GALLERY_CATEGORIES = [
  { id: "all",          label: "All",         emoji: "✨" },
  { id: "art",          label: "Art",          emoji: "🎨" },
  { id: "photography",  label: "Photography",  emoji: "📷" },
  { id: "design",       label: "Design",       emoji: "🖌️" },
  { id: "ai",           label: "AI Art",       emoji: "🤖" },
  { id: "nature",       label: "Nature",       emoji: "🌿" },
  { id: "abstract",     label: "Abstract",     emoji: "🌀" },
  { id: "portrait",     label: "Portrait",     emoji: "👤" },
  { id: "landscape",    label: "Landscape",    emoji: "🏔️" },
  { id: "illustration", label: "Illustration", emoji: "✏️" },
  { id: "digital",      label: "Digital",      emoji: "💻" },
  { id: "other",        label: "Other",        emoji: "🖼️" },
];

const UPLOAD_CATEGORIES = GALLERY_CATEGORIES.filter(c => c.id !== "all");

const SORTS = [
  { key: "newest",   label: "New",     icon: Clock },
  { key: "liked",    label: "Popular", icon: Heart },
  { key: "trending", label: "Hot",     icon: Flame },
  { key: "top",      label: "Top",     icon: Star },
];

const TABS = [
  { id: "gallery",    label: "Gallery",      icon: Grid3X3 },
  { id: "spotlight",  label: "Spotlight",    icon: Sparkles },
  { id: "challenges", label: "Challenges",   icon: Camera,  link: "WeeklyChallenges" },
  { id: "fame",       label: "Hall of Fame", icon: Trophy,  link: "HallOfFame" },
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function openGoogleMaps(lat, lng, name) {
  const q = name ? encodeURIComponent(name) : `${lat},${lng}`;
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
}

// ── Location Input ─────────────────────────────────────────────────────────────
function LocationInput({ value, onChange }) {
  const [query, setQuery] = useState(value?.name || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debRef = useRef(null);

  const doSearch = (q) => {
    if (debRef.current) clearTimeout(debRef.current);
    if (!q || q.length < 3) { setSuggestions([]); return; }
    debRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        setSuggestions(data);
      } catch {}
      setLoading(false);
    }, 400);
  };

  const pick = (item) => {
    const name = item.display_name;
    setQuery(name.split(",").slice(0, 2).join(","));
    setSuggestions([]);
    onChange({ name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
        <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
        <input value={query} onChange={e => { setQuery(e.target.value); doSearch(e.target.value); }}
          placeholder="Add location…" className="flex-1 text-sm bg-transparent outline-none" style={{ color: "var(--text-primary)" }} />
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--text-hint)" }} />}
        {value && <button onClick={() => { setQuery(""); onChange(null); }}><X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} /></button>}
      </div>
      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl shadow-lg overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {suggestions.map(f => (
            <button key={f.place_id} onClick={() => pick(f)}
              className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--bg-subtle)] flex items-start gap-2"
              style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}>
              <MapPin className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
              <span className="line-clamp-2">{f.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Artwork Detail Modal ───────────────────────────────────────────────────────
function ArtworkDetailModal({ artwork, user, onClose, onLike }) {
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [imgLoaded, setImgLoaded] = useState(false);
  const isLiked = artwork.liked_by?.includes(user?.email);

  const { data: comments = [] } = useQuery({
    queryKey: ["artComments", artwork.id],
    queryFn: () => base44.entities.ArtComment.filter({ artwork_id: artwork.id }, "-created_date", 30),
  });

  const commentMut = useMutation({
    mutationFn: () => base44.entities.ArtComment.create({
      artwork_id: artwork.id,
      user_email: user?.email || "",
      user_name: user?.full_name || "Artist",
      text: commentText.trim(),
    }),
    onSuccess: async () => {
      setCommentText("");
      try { await base44.entities.Artwork.update(artwork.id, { comment_count: (artwork.comment_count || 0) + 1 }); } catch {}
      qc.invalidateQueries({ queryKey: ["artComments", artwork.id] });
      qc.invalidateQueries({ queryKey: ["artworks"] });
    },
  });

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full flex flex-col rounded-3xl overflow-hidden"
        style={{ height: "92dvh", maxWidth: 920, backgroundColor: "#0F0F0F", margin: "0 16px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

        <div className="flex flex-col md:flex-row h-full">
          {/* Image pane */}
          <div className="relative flex-shrink-0 flex items-center justify-center md:w-[60%] h-52 md:h-full" style={{ background: "#000" }}>
            {!imgLoaded && <div className="absolute inset-0" style={{ background: "#111" }} />}
            <img src={artwork.image_url} alt={artwork.title}
              className="w-full h-full object-contain"
              style={{ display: imgLoaded ? "block" : "none" }}
              onLoad={() => setImgLoaded(true)} />
            <button onClick={onClose}
              className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-full p-2.5 z-10 transition-transform hover:scale-110"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
              <X className="w-4 h-4 text-white" />
            </button>
            {/* Bottom gradient overlay for location */}
            <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
              {artwork.location_name && (
                <button
                  onClick={() => openGoogleMaps(artwork.location_lat, artwork.location_lng, artwork.location_name)}
                  className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 transition-all"
                  style={{ backgroundColor: "rgba(66,133,244,0.85)", color: "#fff", backdropFilter: "blur(8px)" }}>
                  <MapPin className="w-3 h-3" />
                  {artwork.location_name.split(",").slice(0, 2).join(",")}
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </button>
              )}
            </div>
          </div>

          {/* Info + comments */}
          <div className="flex flex-col flex-1 min-h-0" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Header */}
            <div className="px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>{artwork.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: "#2E6B4F" }}>{artwork.user_name?.[0]?.toUpperCase() || "A"}</div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {artwork.user_name} · {timeAgo(artwork.created_date)} ago
                    </p>
                  </div>
                  {artwork.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {artwork.tags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(46,107,79,0.25)", color: "#4CAF7D" }}>#{t}</span>
                      ))}
                    </div>
                  )}
                  {artwork.description && <p className="text-sm mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{artwork.description}</p>}
                </div>
                <button onClick={() => onLike(artwork)}
                  className="flex flex-col items-center gap-1 shrink-0 p-2 rounded-2xl transition-all"
                  style={{ backgroundColor: isLiked ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.07)" }}>
                  <Heart className={`w-5 h-5 transition-all ${isLiked ? "fill-red-400 text-red-400" : "text-white/50"}`} />
                  <span className="text-[10px] font-bold" style={{ color: isLiked ? "#f87171" : "rgba(255,255,255,0.3)" }}>{artwork.like_count || 0}</span>
                </button>
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-3">
              <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>Comments ({artwork.comment_count || 0})</p>
              {comments.length === 0 && <p className="text-sm text-center py-6" style={{ color: "rgba(255,255,255,0.2)" }}>Be the first to comment ✨</p>}
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white" style={{ backgroundColor: "#2E6B4F" }}>
                    {c.user_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{c.user_name}</p>
                    {c.audio_url
                      ? <audio src={c.audio_url} controls className="h-8 w-full" style={{ maxWidth: 220 }} />
                      : <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{c.text}</p>}
                  </div>
                </div>
              ))}
            </div>

            {user && (
              <div className="shrink-0 px-4 py-3 flex gap-2 items-center"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingBottom: "calc(12px + env(safe-area-inset-bottom,0px))", backgroundColor: "#0F0F0F" }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
                  placeholder="Add a comment…"
                  className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }} />
                <button onClick={() => commentText.trim() && commentMut.mutate()}
                  disabled={!commentText.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40"
                  style={{ backgroundColor: "#2E6B4F" }}>
                  <Send className="w-4 h-4 text-white" />
                </button>
                <ArtVoiceComment artworkId={artwork.id} user={user} onSent={() => {}} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Premium Art Card ───────────────────────────────────────────────────────────
function ArtCard({ art, user, onSelect, onLike }) {
  const isLiked = art.liked_by?.includes(user?.email);
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="break-inside-avoid mb-2 md:mb-3 rounded-2xl overflow-hidden cursor-pointer group relative"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", contain: "layout style paint", transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease", transform: hovered ? "translateY(-2px)" : "translateY(0)", boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.18)" : "0 2px 12px rgba(0,0,0,0.08)" }}
      onClick={() => onSelect(art)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        {!loaded && (
          <div className="w-full skeleton" style={{ paddingBottom: "75%", borderRadius: 0 }} />
        )}
        <img src={art.image_url} alt={art.title}
          className="w-full object-cover"
          loading="lazy"
          style={{ display: loaded ? "block" : "none", transition: "transform 0.5s ease" }}
          onLoad={() => setLoaded(true)} />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)", opacity: hovered ? 1 : 0.4 }}
        />

        {/* Top actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={e => { e.stopPropagation(); onLike(art); }}
            className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all"
            style={{ background: isLiked ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-white text-white" : "text-white"}`} />
          </button>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-white text-xs font-bold truncate" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{art.title}</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.7)", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{art.user_name}</p>
            <div className="flex items-center gap-2">
              {art.location_name && (
                <button
                  onClick={e => { e.stopPropagation(); openGoogleMaps(art.location_lat, art.location_lng, art.location_name); }}
                  className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-white text-[9px] font-semibold backdrop-blur-md"
                  style={{ backgroundColor: "rgba(66,133,244,0.8)" }}>
                  <MapPin className="w-2.5 h-2.5" />
                  {art.location_name.split(",")[0].substring(0, 12)}
                </button>
              )}
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                <Heart className={`w-2.5 h-2.5 ${isLiked ? "fill-red-400 text-red-400" : ""}`} />{art.like_count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ───────────────────────────────────────────────────────────────
function UploadModal({ user, onClose, qc }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [category, setUploadCategory] = useState("other");
  const [location, setLocation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const handleFile = (f) => { setFile(f); setPreviewUrl(URL.createObjectURL(f)); setEditingFile(f); };
  const handleEditorDone = (ef, eu) => { setFile(ef); setPreviewUrl(eu); setEditingFile(null); };

  const handleSubmit = async () => {
    if (!file || !title.trim() || !user) return;
    setUploading(true);
    let uploadFile = file;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      try {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        canvas.getContext("2d").drawImage(bitmap, 0, 0);
        const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.92));
        uploadFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
      } catch {}
    }
    const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
    await base44.entities.Artwork.create({
      user_email: user.email, user_name: user.full_name || "Artist",
      title: title.trim(), description: desc, image_url: file_url,
      status: "published", like_count: 0, liked_by: [], comment_count: 0, vote_count: 0,
      category, tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      ...(location ? { location_name: location.name, location_lat: location.lat, location_lng: location.lng } : {}),
    });
    qc.invalidateQueries({ queryKey: ["artworks"] });
    setUploading(false);
    onClose();
  };

  if (editingFile) return <PhotoEditor file={editingFile} onDone={handleEditorDone} onCancel={() => setEditingFile(null)} />;

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 space-y-4 overflow-y-auto"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "92dvh", border: "1px solid var(--border-light)" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-8 h-1 rounded-full mx-auto md:hidden mb-1" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Upload Artwork</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <button onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all"
          style={{ borderColor: previewUrl ? "var(--accent-primary)" : "var(--border-medium)", minHeight: 120 }}>
          {previewUrl ? <img src={previewUrl} alt="preview" className="w-full max-h-52 object-cover" />
            : <div className="py-10 flex flex-col items-center gap-2"><Upload className="w-8 h-8" style={{ color: "var(--text-hint)" }} /><p className="text-sm" style={{ color: "var(--text-hint)" }}>Tap to choose image</p></div>}
        </button>
        {previewUrl && (
          <button onClick={() => setEditingFile(file)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>
            ✨ Edit / Apply Filters
          </button>
        )}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" rows={2}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        <LocationInput value={location} onChange={setLocation} />
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "var(--text-hint)" }}>Category</label>
          <div className="flex flex-wrap gap-1.5">
            {UPLOAD_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setUploadCategory(cat.id)}
                className="px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1"
                style={{ backgroundColor: category === cat.id ? "var(--accent-primary)" : "var(--bg-subtle)", color: category === cat.id ? "#fff" : "var(--text-secondary)" }}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags: nature, color, minimal…"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        <button onClick={handleSubmit} disabled={uploading || !file || !title.trim()}
          className="w-full py-3 rounded-2xl font-bold text-white disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "🎨 Upload to Gallery"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Masonry Grid ───────────────────────────────────────────────────────────────
function MasonryGrid({ items, user, onSelect, onLike }) {
  if (items.length === 0) return null;
  return (
    <div className="masonry-responsive">
      <style>{`
        .masonry-responsive { columns: 2; column-gap: 8px; }
        @media (min-width: 640px)  { .masonry-responsive { columns: 3; column-gap: 10px; } }
        @media (min-width: 1024px) { .masonry-responsive { columns: 4; column-gap: 12px; } }
        @media (min-width: 1280px) { .masonry-responsive { columns: 5; column-gap: 14px; } }
        @media (min-width: 1600px) { .masonry-responsive { columns: 6; column-gap: 16px; } }
      `}</style>
      {items.map(art => (
        <ArtCard key={art.id} art={art} user={user} onSelect={onSelect} onLike={onLike} />
      ))}
    </div>
  );
}

// ── Main Gallery Page ──────────────────────────────────────────────────────────
export default function Gallery() {
  const [user, setUser] = useState(null);
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("gallery");
  const [category, setCategory] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: artworks = [], isLoading: loadingArtworks } = useQuery({
    queryKey: ["artworks"],
    queryFn: () => base44.entities.Artwork.filter({ status: "published" }, "-created_date", 100),
  });

  const { data: artPieces = [], isLoading: loadingPieces } = useQuery({
    queryKey: ["artPieces"],
    queryFn: () => base44.entities.ArtPiece.list("-created_date", 80),
  });

  const allArtworks = useMemo(() => [
    ...artworks,
    ...artPieces.map(p => ({
      id: `piece_${p.id}`, _raw_id: p.id, _type: "ArtPiece",
      title: p.title, image_url: p.image_url,
      user_name: p.creator_name || p.owner_name,
      user_email: p.creator_email || p.owner_email,
      like_count: p.like_count || 0, liked_by: p.liked_by || [],
      comment_count: 0, description: p.description,
      created_date: p.created_date, tags: [], category: "other",
    }))
  ], [artworks, artPieces]);

  const isLoading = loadingArtworks || loadingPieces;

  const filtered = useMemo(() => {
    let list = allArtworks;
    if (category !== "all") list = list.filter(a => a.category === category);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q)) ||
        a.user_name?.toLowerCase().includes(q) ||
        a.location_name?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "liked") return (b.like_count || 0) - (a.like_count || 0);
      if (sort === "top") return (b.vote_count || b.like_count || 0) - (a.vote_count || a.like_count || 0);
      if (sort === "trending") {
        const cut = Date.now() - 86400000;
        const aS = new Date(a.created_date) > cut ? (a.like_count || 0) * 2 : (a.like_count || 0);
        const bS = new Date(b.created_date) > cut ? (b.like_count || 0) * 2 : (b.like_count || 0);
        return bS - aS;
      }
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }, [allArtworks, category, searchQuery, sort]);

  const handleLike = async (art) => {
    if (!user?.email) return;
    const alreadyLiked = art.liked_by?.includes(user.email);
    const updated = alreadyLiked
      ? { like_count: Math.max(0, (art.like_count || 0) - 1), liked_by: (art.liked_by || []).filter(e => e !== user.email) }
      : { like_count: (art.like_count || 0) + 1, liked_by: [...(art.liked_by || []), user.email] };
    if (art._type === "ArtPiece") {
      await base44.entities.ArtPiece.update(art._raw_id, updated);
      qc.invalidateQueries({ queryKey: ["artPieces"] });
    } else {
      await base44.entities.Artwork.update(art.id, updated);
      qc.invalidateQueries({ queryKey: ["artworks"] });
    }
    if (selected?.id === art.id) setSelected({ ...selected, ...updated });
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)", overflowX: "hidden" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 pt-4 pb-2 px-3 md:px-4" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-full max-w-screen-xl mx-auto">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Gallery</h1>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>{allArtworks.length} artworks</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSearch(s => !s)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ backgroundColor: showSearch ? "var(--accent-primary)" : "var(--bg-card)", border: "1px solid var(--border-light)", color: showSearch ? "#fff" : "var(--text-secondary)" }}>
                <Search className="w-4 h-4" />
              </button>
              {user && (
                <button onClick={() => setShowUpload(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#243D33,#2E6B4F)" }}>
                  <Upload className="w-4 h-4" /> Upload
                </button>
              )}
            </div>
          </div>

          {/* Search input */}
          <AnimatePresence>
            {showSearch && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-2 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
                  <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search artworks, artists, tags…"
                    className="flex-1 text-sm bg-transparent outline-none" style={{ color: "var(--text-primary)" }} />
                  {searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} /></button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return t.link ? (
                <Link key={t.id} to={createPageUrl(t.link)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap shrink-0"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </Link>
              ) : (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
                  style={{ backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)", color: isActive ? "#fff" : "var(--text-secondary)", border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}` }}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === "gallery" && (
            <>
              {/* Sort row */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
                {SORTS.map(s => (
                  <button key={s.key} onClick={() => setSort(s.key)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all"
                    style={{ backgroundColor: sort === s.key ? "var(--text-primary)" : "var(--bg-card)", color: sort === s.key ? "var(--bg-app)" : "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                    <s.icon className="w-3 h-3" /> {s.label}
                  </button>
                ))}
              </div>

              {/* Category filters — premium pill style */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
                {GALLERY_CATEGORIES.map(cat => {
                  const active = category === cat.id;
                  return (
                    <button key={cat.id} onClick={() => setCategory(cat.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
                      style={{
                        backgroundColor: active ? "var(--accent-primary)" : "var(--bg-card)",
                        color: active ? "#fff" : "var(--text-secondary)",
                        border: `1.5px solid ${active ? "var(--accent-primary)" : "var(--border-light)"}`,
                        boxShadow: active ? "0 2px 12px rgba(46,107,79,0.3)" : "none",
                        fontWeight: active ? 700 : 400,
                      }}>
                      {cat.emoji} {cat.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ height: 1, backgroundColor: "var(--border-light)", marginTop: 4 }} />
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-screen-xl mx-auto px-2 md:px-4">
        {tab === "spotlight" && <div className="pt-4"><ArtVoteArena user={user} /></div>}

        {tab === "gallery" && (
          <>
            <div className="pt-3"><DailyWinnerBanner /></div>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 px-6">
                <p className="text-5xl mb-3">🎨</p>
                <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  {searchQuery ? `No results for "${searchQuery}"` : "No artworks in this category"}
                </p>
                {user && (
                  <button onClick={() => setShowUpload(true)}
                    className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#243D33,#2E6B4F)" }}>
                    Upload First 🎨
                  </button>
                )}
              </div>
            ) : (
              <div className="pt-3">
                <MasonryGrid items={filtered} user={user} onSelect={setSelected} onLike={handleLike} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selected && <ArtworkDetailModal artwork={selected} user={user} onClose={() => setSelected(null)} onLike={handleLike} />}
      </AnimatePresence>
      <AnimatePresence>
        {showUpload && <UploadModal user={user} onClose={() => setShowUpload(false)} qc={qc} />}
      </AnimatePresence>
    </div>
  );
}