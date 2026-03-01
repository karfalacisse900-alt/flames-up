import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, X, Send, Flame, Clock, Star, Search, Filter,
  Sparkles, Upload, Eye, Loader2, Camera, Trophy, Grid3X3, MapPin, Navigation, ExternalLink, CalendarDays, Tag, ChevronDown, ChevronUp,
} from "lucide-react";
import ArtVoiceComment from "@/components/art/ArtVoiceComment";
import ArtVoteArena from "@/components/gallery/ArtVoteArena";
import DailyWinnerBanner from "@/components/gallery/DailyWinnerBanner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PhotoEditor from "@/components/editor/PhotoEditor";

const CATEGORIES = ["all", "abstract", "portrait", "landscape", "digital", "illustration", "photography", "other"];

const DATE_RANGES = [
  { key: "all",   label: "All time" },
  { key: "today", label: "Today" },
  { key: "week",  label: "This week" },
  { key: "month", label: "This month" },
  { key: "year",  label: "This year" },
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function openGoogleMaps(lat, lng, name) {
  const q = name ? encodeURIComponent(name) : `${lat},${lng}`;
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=`, "_blank");
}

function matchesDateRange(dateStr, range) {
  if (range === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (range === "today") return d.toDateString() === now.toDateString();
  if (range === "week") {
    const start = new Date(now); start.setDate(now.getDate() - 7);
    return d >= start;
  }
  if (range === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (range === "year") return d.getFullYear() === now.getFullYear();
  return true;
}

// ── Google Maps Location Picker (no API key needed for basic input) ────────────
function LocationInput({ value, onChange }) {
  const [query, setQuery] = useState(value?.name || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  const search = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 3) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch { setSuggestions([]); }
      setLoading(false);
    }, 400);
  };

  const pick = (item) => {
    const name = item.display_name;
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setQuery(name.split(",").slice(0, 2).join(","));
    setSuggestions([]); setOpen(false);
    onChange({ name, lat, lng });
  };

  const clear = () => { setQuery(""); setSuggestions([]); onChange(null); };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
        <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
        <input value={query} onChange={e => { setQuery(e.target.value); search(e.target.value); }}
          placeholder="Add location…" className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: "var(--text-primary)" }} />
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: "var(--text-hint)" }} />}
        {value && !loading && <button onClick={clear}><X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} /></button>}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-lg"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {suggestions.map(f => (
            <button key={f.place_id} onClick={() => pick(f)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-subtle)] transition-colors flex items-start gap-2"
              style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}>
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
              <span className="line-clamp-2">{f.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Artwork Detail Modal ──────────────────────────────────────────────────────
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full flex flex-col rounded-2xl overflow-hidden"
        style={{ height: "92dvh", maxWidth: 860, backgroundColor: "#111", margin: "0 16px" }}>

        <div className="flex flex-col md:flex-row h-full">
          {/* Image pane */}
          <div className="relative flex-shrink-0 flex items-center justify-center bg-black md:w-[55%] h-52 md:h-full">
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img src={artwork.image_url} alt={artwork.title}
              className="w-full h-full object-contain"
              style={{ display: imgLoaded ? "block" : "none" }}
              onLoad={() => setImgLoaded(true)} />
            <button onClick={onClose} className="absolute top-3 right-3 bg-black/60 rounded-full p-2 z-10">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Info + comments pane */}
          <div className="flex flex-col flex-1 min-h-0 md:border-l" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white truncate" style={{ fontFamily: "var(--font-serif)" }}>{artwork.title}</h2>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    by {artwork.user_name} · {timeAgo(artwork.created_date)} ago
                  </p>

                  {/* Location button → opens Google Maps */}
                  {artwork.location_name && (
                    <button
                      onClick={() => openGoogleMaps(artwork.location_lat, artwork.location_lng, artwork.location_name)}
                      className="flex items-center gap-1.5 mt-2 text-xs font-semibold rounded-full px-3 py-1 transition-all hover:opacity-80"
                      style={{ backgroundColor: "rgba(66,133,244,0.2)", color: "#4285F4", border: "1px solid rgba(66,133,244,0.3)" }}>
                      <MapPin className="w-3 h-3" />
                      {artwork.location_name.split(",").slice(0, 2).join(",")}
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      <span className="text-[9px] opacity-60">Google Maps</span>
                    </button>
                  )}

                  {/* Tags */}
                  {artwork.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {artwork.tags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(46,107,79,0.2)", color: "#4CAF7D" }}>#{t}</span>
                      ))}
                    </div>
                  )}

                  {artwork.description && <p className="text-sm mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{artwork.description}</p>}
                </div>
                <button onClick={() => onLike(artwork)} className="flex flex-col items-center gap-0.5 shrink-0">
                  <Heart className={`w-6 h-6 transition-all ${isLiked ? "fill-red-400 text-red-400 scale-110" : "text-white/40"}`} />
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{artwork.like_count || 0}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-3">
              <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>💬 Comments ({artwork.comment_count || 0})</p>
              {comments.length === 0 && <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.25)" }}>Be the first to comment</p>}
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                    style={{ backgroundColor: "#2E6B4F" }}>{c.user_name?.[0]?.toUpperCase() || "?"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>{c.user_name}</p>
                    {c.audio_url
                      ? <audio src={c.audio_url} controls className="h-8 w-full mt-1" style={{ maxWidth: 220 }} />
                      : <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{c.text}</p>}
                  </div>
                </div>
              ))}
            </div>

            {user && (
              <div className="shrink-0 px-4 py-3 flex gap-2 items-center"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingBottom: "calc(12px + env(safe-area-inset-bottom,0px))", backgroundColor: "#111" }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
                  placeholder="Add a comment…"
                  className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }} />
                <button onClick={() => commentText.trim() && commentMut.mutate()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#2E6B4F" }}>
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

// ── Art card (masonry) ────────────────────────────────────────────────────────
function ArtCard({ art, user, onSelect, onLike }) {
  const isLiked = art.liked_by?.includes(user?.email);
  return (
    <div className="break-inside-avoid mb-2 md:mb-3 rounded-xl overflow-hidden cursor-pointer group"
      style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid var(--border-light)" }}
      onClick={() => onSelect(art)}>
      <div className="relative overflow-hidden">
        <img src={art.image_url} alt={art.title}
          className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy" />
        {/* Hover overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-2"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }}>
          <div className="flex flex-col gap-1">
            {art.location_name && (
              <button
                onClick={e => { e.stopPropagation(); openGoogleMaps(art.location_lat, art.location_lng, art.location_name); }}
                className="flex items-center gap-1 text-[10px] text-white rounded-full px-2 py-0.5 transition-all hover:opacity-80"
                style={{ backgroundColor: "rgba(66,133,244,0.75)", backdropFilter: "blur(4px)" }}>
                <MapPin className="w-2.5 h-2.5" />
                {art.location_name.split(",")[0]}
                <ExternalLink className="w-2 h-2 ml-0.5" />
              </button>
            )}
          </div>
          <Eye className="w-4 h-4 text-white/80" />
        </div>
        {/* Always visible location badge on mobile */}
        {art.location_name && (
          <button
            onClick={e => { e.stopPropagation(); openGoogleMaps(art.location_lat, art.location_lng, art.location_name); }}
            className="absolute bottom-2 left-2 md:hidden flex items-center gap-1 text-[9px] text-white rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: "rgba(66,133,244,0.8)", backdropFilter: "blur(4px)" }}>
            <MapPin className="w-2.5 h-2.5" />
            {art.location_name.split(",")[0]}
          </button>
        )}
        {/* Like button */}
        <button onClick={e => { e.stopPropagation(); onLike(art); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <Heart className={`w-3.5 h-3.5 transition-all ${isLiked ? "fill-red-400 text-red-400" : "text-white"}`} />
        </button>
      </div>
      <div className="px-2 py-1.5">
        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{art.title}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[10px] truncate" style={{ color: "var(--text-hint)" }}>{art.user_name}</p>
          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--text-hint)" }}>
            <Heart className="w-2.5 h-2.5" />{art.like_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
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

  const handleFile = (f) => { setFile(f); setPreviewUrl(URL.createObjectURL(f)); setEditingFile(f); };
  const handleEditorDone = (editedFile, editedUrl) => { setFile(editedFile); setPreviewUrl(editedUrl); setEditingFile(null); };

  const handleSubmit = async () => {
    if (!file || !title.trim() || !user) return;
    setUploading(true);
    // Convert to jpeg blob to ensure compatibility
    let uploadFile = file;
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      try {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
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
        className="relative w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 space-y-4 overflow-y-auto"
        style={{ backgroundColor: "var(--bg-app)", maxHeight: "92dvh" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-8 h-1 rounded-full mx-auto md:hidden" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Upload Artwork</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <button onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center"
          style={{ borderColor: previewUrl ? "var(--accent-primary)" : "var(--border-medium)", minHeight: 120 }}>
          {previewUrl
            ? <img src={previewUrl} alt="preview" className="w-full max-h-52 object-cover" />
            : <div className="py-10 flex flex-col items-center gap-2">
                <Upload className="w-8 h-8" style={{ color: "var(--text-hint)" }} />
                <p className="text-sm" style={{ color: "var(--text-hint)" }}>Tap to choose image</p>
              </div>}
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
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter(c => c !== "all").map(cat => (
              <button key={cat} onClick={() => setUploadCategory(cat)}
                className="px-3 py-1 rounded-full text-xs capitalize transition-all"
                style={{ backgroundColor: category === cat ? "var(--accent-primary)" : "var(--bg-subtle)", color: category === cat ? "#fff" : "var(--text-secondary)" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags: nature, color, minimal…"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        <button onClick={handleSubmit} disabled={uploading || !file || !title.trim()}
          className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "🎨 Upload to Gallery"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Responsive Masonry Grid ───────────────────────────────────────────────────
function MasonryGrid({ items, user, onSelect, onLike }) {
  if (items.length === 0) return null;
  return (
    <div style={{
      columnCount: "var(--masonry-cols, 2)",
      columnGap: "8px",
    }}>
      <style>{`
        @media (min-width: 480px)  { :root { --masonry-cols: 2; } }
        @media (min-width: 640px)  { :root { --masonry-cols: 3; } }
        @media (min-width: 1024px) { :root { --masonry-cols: 4; } }
        @media (min-width: 1280px) { :root { --masonry-cols: 5; } }
        @media (min-width: 1600px) { :root { --masonry-cols: 6; } }
      `}</style>
      {items.map(art => (
        <ArtCard key={art.id} art={art} user={user} onSelect={onSelect} onLike={onLike} />
      ))}
    </div>
  );
}

// ── Search & Filter Panel ─────────────────────────────────────────────────────
function SearchFilterBar({ searchQuery, setSearchQuery, category, setCategory, dateRange, setDateRange, locationFilter, setLocationFilter, locations, resultCount }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by title, description, tags, or location…"
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}><X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} /></button>
        )}
        <button onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
          style={{ backgroundColor: expanded ? "var(--accent-primary)" : "var(--bg-subtle)", color: expanded ? "#fff" : "var(--text-secondary)" }}>
          <Filter className="w-3 h-3" />
          Filters
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl p-3 space-y-3"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>

            {/* Category */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-hint)" }}>Category</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className="px-3 py-1 rounded-full text-xs capitalize"
                    style={{ backgroundColor: category === cat ? "var(--accent-primary)" : "var(--bg-subtle)", color: category === cat ? "#fff" : "var(--text-secondary)", fontWeight: category === cat ? 700 : 400 }}>
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
                <CalendarDays className="w-3 h-3" /> Date Range
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DATE_RANGES.map(dr => (
                  <button key={dr.key} onClick={() => setDateRange(dr.key)}
                    className="px-3 py-1 rounded-full text-xs"
                    style={{ backgroundColor: dateRange === dr.key ? "var(--text-primary)" : "var(--bg-subtle)", color: dateRange === dr.key ? "var(--bg-app)" : "var(--text-secondary)", fontWeight: dateRange === dr.key ? 700 : 400 }}>
                    {dr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location filter */}
            {locations.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
                  <MapPin className="w-3 h-3" /> Location
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setLocationFilter(null)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                    style={{ backgroundColor: !locationFilter ? "var(--accent-primary)" : "var(--bg-subtle)", color: !locationFilter ? "#fff" : "var(--text-secondary)" }}>
                    🌍 All
                  </button>
                  {locations.map(loc => (
                    <button key={loc} onClick={() => setLocationFilter(locationFilter === loc ? null : loc)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap"
                      style={{ backgroundColor: locationFilter === loc ? "#4285F4" : "var(--bg-subtle)", color: locationFilter === loc ? "#fff" : "var(--text-secondary)" }}>
                      <MapPin className="w-2.5 h-2.5" /> {loc}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result count + active filters summary */}
      {(searchQuery || category !== "all" || dateRange !== "all" || locationFilter) && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>{resultCount}</span> result{resultCount !== 1 ? "s" : ""}
          </p>
          <button onClick={() => { setSearchQuery(""); setCategory("all"); setDateRange("all"); setLocationFilter(null); }}
            className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab / Sort config ─────────────────────────────────────────────────────────
const TABS = [
  { id: "gallery",   label: "Gallery",      icon: Grid3X3 },
  { id: "spotlight", label: "Spotlight",    icon: Sparkles },
  { id: "challenges",label: "Challenges",   icon: Camera,  link: "WeeklyChallenges" },
  { id: "fame",      label: "Hall of Fame", icon: Trophy,  link: "HallOfFame" },
];
const SORTS = [
  { key: "newest",    label: "New",     icon: Clock },
  { key: "liked",     label: "Popular", icon: Heart },
  { key: "trending",  label: "Hot",     icon: Flame },
  { key: "top_rated", label: "Top",     icon: Star },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Gallery() {
  const [user, setUser] = useState(null);
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("gallery");
  const [category, setCategory] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [locationFilter, setLocationFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");
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

  const locations = useMemo(() => {
    const seen = new Set();
    const locs = [];
    allArtworks.forEach(a => {
      if (a.location_name) {
        const city = a.location_name.split(",")[0].trim();
        if (!seen.has(city)) { seen.add(city); locs.push(city); }
      }
    });
    return locs.slice(0, 10);
  }, [allArtworks]);

  const filtered = useMemo(() => {
    let list = allArtworks;

    // Search: title, description, tags, location
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q)) ||
        a.location_name?.toLowerCase().includes(q) ||
        a.user_name?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (category !== "all") list = list.filter(a => a.category === category);

    // Location filter
    if (locationFilter) list = list.filter(a => a.location_name?.toLowerCase().includes(locationFilter.toLowerCase()));

    // Date range
    if (dateRange !== "all") list = list.filter(a => matchesDateRange(a.created_date, dateRange));

    // Sort
    return [...list].sort((a, b) => {
      if (sort === "liked") return (b.like_count || 0) - (a.like_count || 0);
      if (sort === "top_rated") return (b.vote_count || b.like_count || 0) - (a.vote_count || a.like_count || 0);
      if (sort === "trending") {
        const cutoff = Date.now() - 86400000;
        const aS = new Date(a.created_date) > cutoff ? (a.like_count || 0) * 2 : (a.like_count || 0);
        const bS = new Date(b.created_date) > cutoff ? (b.like_count || 0) * 2 : (b.like_count || 0);
        return bS - aS;
      }
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }, [allArtworks, searchQuery, category, locationFilter, dateRange, sort]);

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
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Gallery</h1>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>{allArtworks.length} artworks</p>
            </div>
            {user && (
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#243D33,#2E6B4F)" }}>
                <Upload className="w-4 h-4" /> Upload
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return t.link ? (
                <Link key={t.id} to={createPageUrl(t.link)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </Link>
              ) : (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
                  style={{
                    backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
                  }}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Sort row (gallery only) */}
          {tab === "gallery" && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
              {SORTS.map(s => (
                <button key={s.key} onClick={() => setSort(s.key)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all"
                  style={{
                    backgroundColor: sort === s.key ? "var(--text-primary)" : "var(--bg-card)",
                    color: sort === s.key ? "var(--bg-app)" : "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}>
                  <s.icon className="w-3 h-3" /> {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Search + filters (gallery only) */}
          {tab === "gallery" && (
            <SearchFilterBar
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              category={category} setCategory={setCategory}
              dateRange={dateRange} setDateRange={setDateRange}
              locationFilter={locationFilter} setLocationFilter={setLocationFilter}
              locations={locations}
              resultCount={filtered.length}
            />
          )}

          <div className="mt-2" style={{ height: 1, backgroundColor: "var(--border-light)" }} />
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
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {searchQuery ? `No results for "${searchQuery}"` : "No artworks in this category"}
                </p>
                {user && !searchQuery && (
                  <button onClick={() => setShowUpload(true)}
                    className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#243D33,#2E6B4F)" }}>
                    Upload First
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