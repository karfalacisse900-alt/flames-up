import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Bookmark, MessageCircle, Share2, ShoppingBag, Plus, X,
  ExternalLink, ChevronLeft, ChevronRight, ArrowLeft, Tag, Upload, Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const COLORS = ["#7C3AED", "#DB2777", "#EA580C", "#059669", "#0284C7", "#D97706"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

// ── Create Post Modal ──────────────────────────────────────────────────────────
function CreatePostModal({ user, onClose, onCreated }) {
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState("");
  const [taggedItems, setTaggedItems] = useState([{ name: "", brand: "", link: "", price: "" }]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleFiles = async (files) => {
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push(file_url);
    }
    setImages(prev => [...prev, ...uploaded]);
    setUploading(false);
  };

  const addTag = () => setTaggedItems(prev => [...prev, { name: "", brand: "", link: "", price: "" }]);
  const removeTag = (i) => setTaggedItems(prev => prev.filter((_, idx) => idx !== i));
  const updateTag = (i, field, val) => setTaggedItems(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));

  const handleSubmit = async () => {
    if (images.length === 0) return;
    setSaving(true);
    await base44.entities.ShopTheLookPost.create({
      author_email: user.email,
      author_name: user.full_name || user.email,
      author_avatar: user.avatar_url || null,
      caption,
      image_urls: images,
      tagged_items: taggedItems.filter(t => t.name.trim()),
      like_count: 0,
      liked_by: [],
      save_count: 0,
      saved_by: [],
      comment_count: 0,
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg rounded-t-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "#0f0f14", maxHeight: "92dvh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <button onClick={onClose}><X className="w-5 h-5 text-white/60" /></button>
          <h2 className="text-white font-bold text-base">New ShopTheLook Post</h2>
          <button
            onClick={handleSubmit}
            disabled={images.length === 0 || saving}
            className="px-4 py-1.5 rounded-full text-sm font-bold"
            style={{ background: images.length > 0 ? "linear-gradient(135deg, #7C3AED, #DB2777)" : "rgba(255,255,255,0.1)", color: "#fff" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Image upload */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Photos</p>
            <div className="flex gap-3 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-white/20"
              >
                {uploading
                  ? <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                  : <><Upload className="w-5 h-5 text-white/40" /><span className="text-white/40 text-[10px]">Add photo</span></>
                }
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => e.target.files?.length && handleFiles(Array.from(e.target.files))}
            />
          </div>

          {/* Caption */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Caption</p>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Describe your look…"
              rows={2}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {/* Tagged items */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Tag Items</p>
            {taggedItems.map((item, i) => (
              <div key={i} className="relative rounded-2xl p-4 mb-3 space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/50 text-xs font-semibold">Item {i + 1}</span>
                  {taggedItems.length > 1 && (
                    <button onClick={() => removeTag(i)}><X className="w-4 h-4 text-white/40" /></button>
                  )}
                </div>
                {[
                  { field: "name", placeholder: "Item name (e.g. Silk Dress)" },
                  { field: "brand", placeholder: "Brand / Designer" },
                  { field: "link", placeholder: "Shop link (URL)" },
                  { field: "price", placeholder: "Price (e.g. $129)" },
                ].map(({ field, placeholder }) => (
                  <input
                    key={field}
                    value={item[field]}
                    onChange={e => updateTag(i, field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                ))}
              </div>
            ))}
            <button
              onClick={addTag}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-2xl w-full justify-center"
              style={{ backgroundColor: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
            >
              <Plus className="w-4 h-4" /> Add another item
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────────────
function PostCard({ post, user, onRefetch }) {
  const [liked, setLiked] = useState(post.liked_by?.includes(user?.email));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [saved, setSaved] = useState(post.saved_by?.includes(user?.email));
  const [imgIdx, setImgIdx] = useState(0);
  const [activeTag, setActiveTag] = useState(null);
  const images = post.image_urls || [];
  const name = getName(post.author_name, post.author_email);

  const handleLike = async () => {
    if (!user?.email) return;
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    const newLikedBy = newLiked
      ? [...(post.liked_by || []), user.email]
      : (post.liked_by || []).filter(e => e !== user.email);
    setLiked(newLiked);
    setLikeCount(newCount);
    await base44.entities.ShopTheLookPost.update(post.id, { liked_by: newLikedBy, like_count: newCount });
  };

  const handleSave = async () => {
    if (!user?.email) return;
    const newSaved = !saved;
    const newSavedBy = newSaved
      ? [...(post.saved_by || []), user.email]
      : (post.saved_by || []).filter(e => e !== user.email);
    setSaved(newSaved);
    await base44.entities.ShopTheLookPost.update(post.id, { saved_by: newSavedBy, save_count: newSavedBy.length });
  };

  return (
    <div className="mb-6 rounded-3xl overflow-hidden" style={{ backgroundColor: "#16161d" }}>
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <Link to={`/user/${encodeURIComponent(post.author_email)}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-white shrink-0"
            style={{ background: post.author_avatar ? "transparent" : `linear-gradient(135deg, ${avatarColor(post.author_email)}, #4F46E5)` }}>
            {post.author_avatar ? <img src={post.author_avatar} alt="" className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">{name}</p>
          <p className="text-white/40 text-[11px]">{new Date(post.created_date).toLocaleDateString([], { month: "short", day: "numeric" })}</p>
        </div>
        <ShoppingBag className="w-5 h-5" style={{ color: "#a78bfa" }} />
      </div>

      {/* Image carousel */}
      <div className="relative aspect-[4/5] bg-black overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={imgIdx}
            src={images[imgIdx]}
            alt=""
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(22,22,29,0.9) 0%, transparent 100%)" }} />

        {/* Multi-image nav */}
        {images.length > 1 && (
          <>
            <button onClick={() => setImgIdx(i => Math.max(0, i - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <div key={i} className="rounded-full transition-all" style={{ width: i === imgIdx ? 16 : 6, height: 6, backgroundColor: i === imgIdx ? "#fff" : "rgba(255,255,255,0.4)" }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button onClick={handleLike} className="flex items-center gap-1.5">
          <Heart className="w-6 h-6" style={{ color: liked ? "#ef4444" : "rgba(255,255,255,0.5)", fill: liked ? "#ef4444" : "none" }} />
          {likeCount > 0 && <span className="text-white/60 text-sm">{likeCount}</span>}
        </button>
        <button className="flex items-center gap-1.5">
          <MessageCircle className="w-6 h-6 text-white/50" />
          {post.comment_count > 0 && <span className="text-white/60 text-sm">{post.comment_count}</span>}
        </button>
        <button className="flex items-center gap-1.5">
          <Share2 className="w-6 h-6 text-white/50" />
        </button>
        <button onClick={handleSave} className="ml-auto">
          <Bookmark className="w-6 h-6" style={{ color: saved ? "#a78bfa" : "rgba(255,255,255,0.5)", fill: saved ? "#a78bfa" : "none" }} />
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-white/80 text-sm leading-relaxed">
            <span className="font-bold text-white">{name}</span>{" "}{post.caption}
          </p>
        </div>
      )}

      {/* Tagged items */}
      {post.tagged_items?.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Tag className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>Shop the Look</span>
          </div>
          <div className="space-y-2">
            {post.tagged_items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
                style={{ backgroundColor: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #DB2777)" }}>
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                  <div className="flex items-center gap-2">
                    {item.brand && <p className="text-white/50 text-[11px] truncate">{item.brand}</p>}
                    {item.price && <p className="text-[11px] font-bold" style={{ color: "#a78bfa" }}>{item.price}</p>}
                  </div>
                </div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #DB2777)", color: "#fff" }}>
                    Shop <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function StoryFeed() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["shopTheLookPosts"],
    queryFn: () => base44.entities.ShopTheLookPost.list("-created_date", 30),
  });

  const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ["shopTheLookPosts"] });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0b0b10" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-5"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 16px), 16px)",
          paddingBottom: 14,
          backgroundColor: "rgba(11,11,16,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)"
        }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <ShoppingBag className="w-5 h-5" style={{ color: "#a78bfa" }} />
            <h1 className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>ShopTheLook</h1>
          </div>
          <p className="text-white/40 text-[11px]">Discover & shop fashion</p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #7C3AED, #DB2777)" }}>
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Feed */}
      <div className="px-4 pt-4 max-w-lg mx-auto pb-24">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => (
              <div key={i} className="rounded-3xl overflow-hidden animate-pulse" style={{ backgroundColor: "#16161d", height: 480 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: "linear-gradient(135deg, #7C3AED22, #DB277722)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <ShoppingBag className="w-9 h-9" style={{ color: "#a78bfa" }} />
            </div>
            <h3 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "var(--font-serif)" }}>No posts yet</h3>
            <p className="text-white/40 text-sm mb-6">Be the first to share your look!</p>
            <button onClick={() => setShowCreate(true)}
              className="px-6 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg, #7C3AED, #DB2777)" }}>
              Post Your Look
            </button>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} user={user} onRefetch={handleRefetch} />)
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreate && user && (
          <CreatePostModal user={user} onClose={() => setShowCreate(false)} onCreated={handleRefetch} />
        )}
      </AnimatePresence>
    </div>
  );
}