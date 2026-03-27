import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, X, Heart, Bookmark, Upload, Loader2, ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BG = "#F5F0E8";
const STYLE_CATEGORIES = ["All", "Casual", "Bohemian", "Grunge", "Chic", "Streetwear", "Vintage", "Minimalist", "Sporty", "Glam"];
const MAX_IMAGES = 10;

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ user, onClose, onSuccess }) {
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", style: "Casual", tags: "", shop_link: "" });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    setImageFiles(prev => [...prev, ...toAdd]);
    setPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (imageFiles.length === 0 || !form.title.trim()) return;
    setSaving(true);
    const urls = await Promise.all(imageFiles.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    await base44.entities.FashionPost.create({
      image_url: urls[0],
      image_urls: urls,
      title: form.title.trim(),
      description: form.description.trim(),
      style: form.style,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      shop_link: form.shop_link.trim() || undefined,
      author_email: user.email,
      author_name: user.full_name || user.email,
      author_avatar: user.avatar_url || "",
      like_count: 0,
      liked_by: [],
      save_count: 0,
      saved_by: [],
    });
    setSaving(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: BG }}>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: "#1C1A16", fontFamily: "var(--font-serif)" }}>Share Your Look</h2>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "#E8E2D8" }}>
            <X className="w-4 h-4" style={{ color: "#1C1A16" }} />
          </button>
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {previews.map((src, idx) => (
            <div key={idx} className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "1/1" }}>
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          {imageFiles.length < MAX_IMAGES && (
            <label className="rounded-2xl flex flex-col items-center justify-center cursor-pointer"
              style={{ aspectRatio: "1/1", backgroundColor: "#E8E2D8", border: "2px dashed #BFB49C" }}>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
              <Upload className="w-5 h-5 mb-1" style={{ color: "#A09880" }} />
              <span className="text-[10px]" style={{ color: "#A09880" }}>
                {previews.length === 0 ? "Add Photos" : `+More (${previews.length}/${MAX_IMAGES})`}
              </span>
            </label>
          )}
        </div>
        <p className="text-xs mb-4" style={{ color: "#A09880" }}>Up to {MAX_IMAGES} photos · First photo is the cover</p>

        <div className="space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Outfit title (e.g. Winter Casual Look)"
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", color: "#1C1A16" }} />

          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe your outfit, styling notes…" rows={3}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
            style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", color: "#1C1A16" }} />

          <input value={form.shop_link} onChange={e => setForm(f => ({ ...f, shop_link: e.target.value }))}
            placeholder="Shop link (e.g. https://zara.com/...)"
            type="url"
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", color: "#1C1A16" }} />

          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "#6B6355" }}>Style</p>
            <div className="flex flex-wrap gap-2">
              {STYLE_CATEGORIES.filter(s => s !== "All").map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, style: s }))}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: form.style === s ? "#1C1A16" : "#E8E2D8", color: form.style === s ? "white" : "#6B6355" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="Tags (comma separated): minimalist, neutral, outfit"
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8", color: "#1C1A16" }} />

          <button onClick={handleSubmit} disabled={imageFiles.length === 0 || !form.title.trim() || saving}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#1C1A16" }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading {imageFiles.length} photo{imageFiles.length > 1 ? "s" : ""}…</> : "Post Your Look ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail View ───────────────────────────────────────────────────────────────
function PostDetail({ post, user, onClose, onLike, onSave }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = post.image_urls?.length > 0 ? post.image_urls : [post.image_url];
  const isLiked = post.liked_by?.includes(user?.email);
  const isSaved = post.saved_by?.includes(user?.email);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: BG }}>
      <div className="relative max-w-lg mx-auto w-full">
        {/* Image carousel */}
        <div className="relative" style={{ aspectRatio: "3/4", backgroundColor: "#1C1A16" }}>
          <img src={images[imgIdx]} alt={post.title} className="w-full h-full object-cover" />
          {images.length > 1 && (
            <>
              {imgIdx > 0 && (
                <button onClick={() => setImgIdx(i => i - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
              )}
              {imgIdx < images.length - 1 && (
                <button onClick={() => setImgIdx(i => i + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              )}
              {/* Dots */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ backgroundColor: i === imgIdx ? "white" : "rgba(255,255,255,0.4)" }} />
                ))}
              </div>
            </>
          )}
          <button onClick={onClose}
            className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          {images.length > 1 && (
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              {imgIdx + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-black leading-tight" style={{ color: "#1C1A16", fontFamily: "var(--font-serif)" }}>{post.title}</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block mt-2"
                style={{ backgroundColor: "#E8E2D8", color: "#6B6355" }}>
                {post.style}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => onLike(post)}
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isLiked ? "#FEE2E2" : "#E8E2D8" }}>
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} style={{ color: isLiked ? "#EF4444" : "#A09880" }} />
              </button>
              <button onClick={() => onSave(post)}
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isSaved ? "#D8F3DC" : "#E8E2D8" }}>
                <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} style={{ color: isSaved ? "#2D6A4F" : "#A09880" }} />
              </button>
            </div>
          </div>

          {post.description && (
            <p className="text-sm leading-relaxed" style={{ color: "#4A3F2F" }}>{post.description}</p>
          )}

          {post.shop_link && (
            <a href={post.shop_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold"
              style={{ backgroundColor: "#1C1A16", color: "white" }}>
              <ExternalLink className="w-4 h-4" />
              Shop This Look
            </a>
          )}

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map(t => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "#E8E2D8", color: "#6B6355" }}>#{t}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 pb-4">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: "#E8E2D8", color: "#6B6355" }}>
              {post.author_avatar
                ? <img src={post.author_avatar} className="w-full h-full object-cover" alt="" />
                : post.author_name?.[0]?.toUpperCase()}
            </div>
            <p className="text-sm font-semibold" style={{ color: "#1C1A16" }}>{post.author_name}</p>
            <span className="ml-auto text-xs flex items-center gap-1" style={{ color: "#A09880" }}>
              <Heart className="w-3 h-3" /> {post.like_count || 0}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Grid Card ─────────────────────────────────────────────────────────────────
function FashionCard({ post, onClick }) {
  const coverUrl = post.image_url;
  const extraCount = (post.image_urls?.length || 1) - 1;
  return (
    <div onClick={() => onClick(post)} className="cursor-pointer rounded-2xl overflow-hidden relative"
      style={{ aspectRatio: "2/3", backgroundColor: "#E8E2D8" }}>
      <img src={coverUrl} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-white text-[11px] font-bold leading-tight line-clamp-2">{post.title}</p>
        <p className="text-white/70 text-[10px] mt-0.5">{post.style}</p>
      </div>
      {extraCount > 0 && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          +{extraCount}
        </div>
      )}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <Heart className="w-3 h-3 text-white" />
        <span className="text-white text-[10px] font-semibold">{post.like_count || 0}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FashionFeed() {
  const [user, setUser] = useState(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["fashionPosts"],
    queryFn: () => base44.entities.FashionPost.list("-created_date", 100),
  });

  const filtered = posts.filter(p => {
    const matchCat = category === "All" || p.style === category;
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const likeMut = useMutation({
    mutationFn: (post) => {
      const liked = post.liked_by?.includes(user?.email);
      return base44.entities.FashionPost.update(post.id, {
        like_count: liked ? Math.max(0, (post.like_count || 0) - 1) : (post.like_count || 0) + 1,
        liked_by: liked ? post.liked_by.filter(e => e !== user.email) : [...(post.liked_by || []), user.email],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fashionPosts"] }),
  });

  const saveMut = useMutation({
    mutationFn: (post) => {
      const saved = post.saved_by?.includes(user?.email);
      return base44.entities.FashionPost.update(post.id, {
        save_count: saved ? Math.max(0, (post.save_count || 0) - 1) : (post.save_count || 0) + 1,
        saved_by: saved ? post.saved_by.filter(e => e !== user.email) : [...(post.saved_by || []), user.email],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fashionPosts"] }),
  });

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: BG }}>
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-3xl font-black leading-tight" style={{ color: "#1C1A16", fontFamily: "var(--font-serif)" }}>
          What's Your<br />Favorite Style?
        </h1>
      </div>

      <div className="px-4 mb-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8" }}>
          <Search className="w-4 h-4" style={{ color: "#A09880" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Style"
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#1C1A16" }} />
          {search && <button onClick={() => setSearch("")}><X className="w-4 h-4" style={{ color: "#A09880" }} /></button>}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 px-4 mb-4 scrollbar-hide">
        {STYLE_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{
              backgroundColor: category === cat ? "#1C1A16" : "transparent",
              color: category === cat ? "#fff" : "#6B6355",
            }}>
            {cat}
          </button>
        ))}
      </div>

      <div className="px-4">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#1C1A16" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">👗</div>
            <p className="font-bold text-sm mb-1" style={{ color: "#1C1A16" }}>No looks yet</p>
            <p className="text-xs" style={{ color: "#A09880" }}>Be the first to share your style!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(post => <FashionCard key={post.id} post={post} onClick={setSelectedPost} />)}
          </div>
        )}
      </div>

      {user && (
        <button onClick={() => setShowUpload(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center text-white z-30"
          style={{ backgroundColor: "#1C1A16", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
          <Plus className="w-6 h-6" />
        </button>
      )}

      <AnimatePresence>
        {showUpload && (
          <UploadModal key="upload" user={user} onClose={() => setShowUpload(false)}
            onSuccess={() => { setShowUpload(false); qc.invalidateQueries({ queryKey: ["fashionPosts"] }); }} />
        )}
        {selectedPost && (
          <PostDetail key="detail" post={selectedPost} user={user}
            onClose={() => setSelectedPost(null)}
            onLike={(p) => user && likeMut.mutate(p)}
            onSave={(p) => user && saveMut.mutate(p)} />
        )}
      </AnimatePresence>
    </div>
  );
}