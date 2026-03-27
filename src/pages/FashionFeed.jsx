import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, X, Heart, Bookmark, Upload, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STYLE_CATEGORIES = ["All", "Casual", "Bohemian", "Grunge", "Chic", "Streetwear", "Vintage", "Minimalist", "Sporty", "Glam"];

// Upload modal
function UploadModal({ user, onClose, onSuccess }) {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", style: "Casual", tags: "" });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!imageFile || !form.title.trim()) return;
    setSaving(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
    await base44.entities.FashionPost.create({
      image_url: file_url,
      title: form.title.trim(),
      description: form.description.trim(),
      style: form.style,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
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
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ backgroundColor: "var(--bg-modal)" }}>
      <div className="max-w-lg mx-auto w-full px-4 pt-6 pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Share Your Look</h2>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image picker */}
        <label className="block w-full rounded-3xl overflow-hidden cursor-pointer mb-4"
          style={{ aspectRatio: "3/4", backgroundColor: "var(--bg-subtle)", border: "2px dashed var(--border-medium)" }}>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {preview ? (
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Upload className="w-8 h-8" style={{ color: "var(--text-hint)" }} />
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>Tap to upload outfit photo</p>
            </div>
          )}
        </label>

        <div className="space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Outfit title (e.g. Winter Casual Look)"
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe your outfit, styling notes…" rows={3}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

          <div className="flex flex-wrap gap-2">
            {STYLE_CATEGORIES.filter(s => s !== "All").map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, style: s }))}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: form.style === s ? "var(--accent-primary)" : "var(--bg-subtle)", color: form.style === s ? "white" : "var(--text-secondary)" }}>
                {s}
              </button>
            ))}
          </div>

          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="Tags (comma separated): minimalist, neutral, outfit"
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

          <button onClick={handleSubmit} disabled={!imageFile || !form.title.trim() || saving}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Post Your Look ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Detail modal
function PostDetail({ post, user, onClose, onLike, onSave }) {
  const isLiked = post.liked_by?.includes(user?.email);
  const isSaved = post.saved_by?.includes(user?.email);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ backgroundColor: "var(--bg-modal)" }}>
      <div className="relative max-w-lg mx-auto w-full">
        {/* Image */}
        <div className="relative" style={{ aspectRatio: "3/4" }}>
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          <button onClick={onClose}
            className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Info */}
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-black leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{post.title}</h2>
              <p className="text-xs mt-0.5 font-semibold px-2.5 py-0.5 rounded-full inline-block mt-2"
                style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                {post.style}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => onLike(post)}
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isLiked ? "#FEE2E2" : "var(--bg-subtle)" }}>
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} style={{ color: isLiked ? "#EF4444" : "var(--text-hint)" }} />
              </button>
              <button onClick={() => onSave(post)}
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isSaved ? "var(--accent-primary-light)" : "var(--bg-subtle)" }}>
                <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} style={{ color: isSaved ? "var(--accent-primary)" : "var(--text-hint)" }} />
              </button>
            </div>
          </div>

          {post.description && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{post.description}</p>
          )}

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map(t => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>#{t}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              {post.author_avatar ? <img src={post.author_avatar} className="w-full h-full object-cover" alt="" /> : post.author_name?.[0]?.toUpperCase()}
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{post.author_name}</p>
            <span className="ml-auto text-xs flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
              <Heart className="w-3 h-3" /> {post.like_count || 0}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Main grid card
function FashionCard({ post, onClick }) {
  return (
    <div onClick={() => onClick(post)} className="cursor-pointer rounded-2xl overflow-hidden relative"
      style={{ aspectRatio: "2/3", backgroundColor: "var(--bg-subtle)" }}>
      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-white text-[11px] font-bold leading-tight line-clamp-2">{post.title}</p>
        <p className="text-white/70 text-[10px] mt-0.5">{post.style}</p>
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <Heart className="w-3 h-3 text-white" />
        <span className="text-white text-[10px] font-semibold">{post.like_count || 0}</span>
      </div>
    </div>
  );
}

export default function FashionFeed() {
  const [user, setUser] = useState(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const qc = useQueryClient();

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

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
        liked_by: liked ? (post.liked_by || []).filter(e => e !== user.email) : [...(post.liked_by || []), user.email],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fashionPosts"] });
    },
  });

  const saveMut = useMutation({
    mutationFn: (post) => {
      const saved = post.saved_by?.includes(user?.email);
      return base44.entities.FashionPost.update(post.id, {
        save_count: saved ? Math.max(0, (post.save_count || 0) - 1) : (post.save_count || 0) + 1,
        saved_by: saved ? (post.saved_by || []).filter(e => e !== user.email) : [...(post.saved_by || []), user.email],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fashionPosts"] }),
  });

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F5F0E8" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-3xl font-black leading-tight mb-1" style={{ color: "#1C1A16", fontFamily: "var(--font-serif)" }}>
          What's Your<br />Favorite Style?
        </h1>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "#fff", border: "1px solid #E8E2D8" }}>
          <Search className="w-4 h-4" style={{ color: "#A09880" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search Style"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#1C1A16" }} />
          {search && <button onClick={() => setSearch("")}><X className="w-4 h-4" style={{ color: "#A09880" }} /></button>}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-4 mb-4 scrollbar-hide">
        {STYLE_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className="shrink-0 px-4 py-2 rounded-full text-xs font-bold"
            style={{
              backgroundColor: category === cat ? "#1C1A16" : "transparent",
              color: category === cat ? "#fff" : "#6B6355",
              borderBottom: category === cat ? "none" : "none",
              textDecoration: category === cat ? "underline" : "none",
              textUnderlineOffset: category !== cat ? undefined : undefined,
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">👗</div>
            <p className="font-bold text-sm mb-1" style={{ color: "#1C1A16" }}>No looks yet</p>
            <p className="text-xs" style={{ color: "#A09880" }}>Be the first to share your style!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(post => (
              <FashionCard key={post.id} post={post} onClick={setSelectedPost} />
            ))}
          </div>
        )}
      </div>

      {/* FAB upload button */}
      {user && (
        <button onClick={() => setShowUpload(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center text-white z-30"
          style={{ backgroundColor: "#1C1A16", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
          <Plus className="w-6 h-6" />
        </button>
      )}

      <AnimatePresence>
        {showUpload && (
          <UploadModal user={user} onClose={() => setShowUpload(false)}
            onSuccess={() => { setShowUpload(false); qc.invalidateQueries({ queryKey: ["fashionPosts"] }); }} />
        )}
        {selectedPost && (
          <PostDetail post={selectedPost} user={user}
            onClose={() => setSelectedPost(null)}
            onLike={(p) => user && likeMut.mutate(p)}
            onSave={(p) => user && saveMut.mutate(p)} />
        )}
      </AnimatePresence>
    </div>
  );
}