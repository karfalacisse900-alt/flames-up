import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart, Bookmark, MessageCircle, Share2, ShoppingBag, Plus, X,
  ExternalLink, ChevronLeft, ChevronRight, ArrowLeft, Tag, Upload,
  Loader2, Bell
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const COLORS = ["#7C3AED", "#DB2777", "#EA580C", "#059669", "#0284C7", "#D97706"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

// ── Tiny avatar circle for story strip ───────────────────────────────────────
const StoryCircle = memo(({ post, isOwn, onPress }) => {
  const name = getName(post?.author_name, post?.author_email);
  const img = post?.image_urls?.[0];
  return (
    <button onClick={onPress} className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: 68 }}>
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-xl font-bold text-white"
          style={{
            background: img ? "transparent" : `linear-gradient(135deg, ${avatarColor(post?.author_email)}, #4F46E5)`,
            border: "2px solid rgba(255,255,255,0.2)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}>
          {img ? <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" /> : name[0]?.toUpperCase()}
        </div>
        {isOwn && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#4F46E5", border: "2px solid #0B1120" }}>
            <Plus className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <span className="text-[11px] font-semibold text-white/80 truncate max-w-[64px] text-center leading-tight">
        {isOwn ? "Your look" : name.split(" ")[0]}
      </span>
    </button>
  );
});

// ── Full-screen post card (TikTok style) ──────────────────────────────────────
const PostCard = memo(({ post, user, onRefetch }) => {
  const [liked, setLiked] = useState(() => post.liked_by?.includes(user?.email));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [saved, setSaved] = useState(() => post.saved_by?.includes(user?.email));
  const [imgIdx, setImgIdx] = useState(0);
  const [showTags, setShowTags] = useState(false);
  const images = post.image_urls || [];
  const name = getName(post.author_name, post.author_email);
  const tagCount = post.tagged_items?.length || 0;

  const handleLike = useCallback(async () => {
    if (!user?.email) return;
    const nl = !liked, nc = nl ? likeCount + 1 : Math.max(0, likeCount - 1);
    const nb = nl ? [...(post.liked_by || []), user.email] : (post.liked_by || []).filter(e => e !== user.email);
    setLiked(nl); setLikeCount(nc);
    await base44.entities.ShopTheLookPost.update(post.id, { liked_by: nb, like_count: nc });
  }, [liked, likeCount, user?.email, post.id, post.liked_by]);

  const handleSave = useCallback(async () => {
    if (!user?.email) return;
    const ns = !saved;
    const nb = ns ? [...(post.saved_by || []), user.email] : (post.saved_by || []).filter(e => e !== user.email);
    setSaved(ns);
    await base44.entities.ShopTheLookPost.update(post.id, { saved_by: nb, save_count: nb.length });
  }, [saved, user?.email, post.id, post.saved_by]);

  return (
    <div className="relative w-full flex-shrink-0 flex items-end overflow-hidden"
      style={{ height: "100dvh", scrollSnapAlign: "start", background: "#0a0f2e" }}>

      {/* Background image */}
      {images[imgIdx]
        ? <img src={images[imgIdx]} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        : <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${avatarColor(post.author_email)}55 0%, #0a0f2e 100%)` }} />
      }

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)" }} />

      {/* Multi-image dots + nav */}
      {images.length > 1 && (
        <>
          <button onClick={() => setImgIdx(i => Math.max(0, i - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
            className="absolute right-14 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <div key={i} className="rounded-full transition-all"
                style={{ width: i === imgIdx ? 16 : 6, height: 6, backgroundColor: i === imgIdx ? "#fff" : "rgba(255,255,255,0.35)" }} />
            ))}
          </div>
        </>
      )}

      {/* Right action buttons */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            <Heart className="w-5 h-5" style={{ color: liked ? "#ef4444" : "#fff", fill: liked ? "#ef4444" : "none" }} />
          </div>
          <span className="text-white text-[11px] font-bold">{likeCount > 0 ? likeCount : ""}</span>
        </button>
        <button onClick={handleSave} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            <Bookmark className="w-5 h-5" style={{ color: saved ? "#a78bfa" : "#fff", fill: saved ? "#a78bfa" : "none" }} />
          </div>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          {post.comment_count > 0 && <span className="text-white text-[11px] font-bold">{post.comment_count}</span>}
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            <Share2 className="w-5 h-5 text-white" />
          </div>
        </button>
        {tagCount > 0 && (
          <button onClick={() => setShowTags(v => !v)} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C3AED, #DB2777)", boxShadow: "0 4px 16px rgba(124,58,237,0.5)" }}>
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-[11px] font-bold">{tagCount}</span>
          </button>
        )}
      </div>

      {/* Bottom info */}
      <div className="relative z-10 px-4 pb-6 pr-16 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Link to={`/user/${encodeURIComponent(post.author_email)}`}>
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${avatarColor(post.author_email)}, #4F46E5)`, border: "2px solid rgba(255,255,255,0.3)" }}>
              {name[0]?.toUpperCase()}
            </div>
          </Link>
          <span className="text-white font-bold text-sm">@{name.toLowerCase().replace(/\s+/g, "_")}</span>
        </div>
        {post.caption && <p className="text-white/80 text-sm leading-relaxed line-clamp-2">{post.caption}</p>}
        {tagCount > 0 && !showTags && (
          <button onClick={() => setShowTags(true)} className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "#c4b5fd" }}>
            <Tag className="w-3 h-3" /> {tagCount} item{tagCount > 1 ? "s" : ""} tagged — tap to shop
          </button>
        )}
      </div>

      {/* Tags overlay */}
      <AnimatePresence>
        {showTags && (
          <motion.div
            className="absolute inset-x-0 bottom-0 z-20 rounded-t-3xl px-4 pt-4 pb-safe"
            style={{ backgroundColor: "rgba(11,11,20,0.97)", backdropFilter: "blur(20px)", paddingBottom: "max(env(safe-area-inset-bottom,16px),16px)" }}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" style={{ color: "#a78bfa" }} />
                <span className="text-white font-bold">Shop the Look</span>
              </div>
              <button onClick={() => setShowTags(false)}>
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {post.tagged_items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
                  style={{ backgroundColor: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #DB2777)" }}>
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2">
                      {item.brand && <p className="text-white/50 text-[11px]">{item.brand}</p>}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── Create Post Sheet ─────────────────────────────────────────────────────────
const CreatePostModal = memo(({ user, onClose, onCreated }) => {
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
    if (images.length === 0 || saving) return;
    setSaving(true);
    await base44.entities.ShopTheLookPost.create({
      author_email: user.email,
      author_name: user.full_name || user.email,
      caption,
      image_urls: images,
      tagged_items: taggedItems.filter(t => t.name.trim()),
      like_count: 0, liked_by: [], save_count: 0, saved_by: [], comment_count: 0,
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative w-full max-w-lg rounded-t-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "#0f0f18", maxHeight: "92dvh" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <button onClick={onClose}><X className="w-5 h-5 text-white/60" /></button>
          <h2 className="text-white font-bold">New Look</h2>
          <button onClick={handleSubmit} disabled={images.length === 0 || saving}
            className="px-4 py-1.5 rounded-full text-sm font-bold"
            style={{ background: images.length > 0 ? "linear-gradient(135deg,#7C3AED,#DB2777)" : "rgba(255,255,255,0.1)", color: "#fff" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Image upload */}
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Photos</p>
            <div className="flex gap-3 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-white/20">
                {uploading ? <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                  : <><Upload className="w-5 h-5 text-white/40" /><span className="text-white/40 text-[10px]">Add photo</span></>}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => e.target.files?.length && handleFiles(Array.from(e.target.files))} />
          </div>

          {/* Caption */}
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Caption</p>
            <textarea value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Describe your look…" rows={2}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>

          {/* Tagged items */}
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Tag Items</p>
            {taggedItems.map((item, i) => (
              <div key={i} className="rounded-2xl p-4 mb-3 space-y-2"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/50 text-xs font-semibold">Item {i + 1}</span>
                  {taggedItems.length > 1 && <button onClick={() => removeTag(i)}><X className="w-4 h-4 text-white/40" /></button>}
                </div>
                {[{ f: "name", p: "Item name (e.g. Silk Dress)" }, { f: "brand", p: "Brand / Designer" }, { f: "link", p: "Shop link (URL)" }, { f: "price", p: "Price (e.g. $129)" }].map(({ f, p }) => (
                  <input key={f} value={item[f]} onChange={e => updateTag(i, f, e.target.value)} placeholder={p}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }} />
                ))}
              </div>
            ))}
            <button onClick={addTag}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-2xl w-full justify-center"
              style={{ backgroundColor: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}>
              <Plus className="w-4 h-4" /> Add another item
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StoryFeed() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ["shopTheLookPosts"],
    queryFn: () => base44.entities.ShopTheLookPost.list("-created_date", 20),
    staleTime: 30000,
  });

  const handleRefetch = useCallback(() => queryClient.invalidateQueries({ queryKey: ["shopTheLookPosts"] }), [queryClient]);

  // Unique authors for story strip
  const storyStrip = [];
  const seen = new Set();
  posts.forEach(p => { if (!seen.has(p.author_email)) { seen.add(p.author_email); storyStrip.push(p); } });

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: "#0B1120" }}>

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 z-30 relative"
        style={{ paddingTop: "max(env(safe-area-inset-top, 20px), 20px)", paddingBottom: 12 }}>
        <button className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }} onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" style={{ color: "#a78bfa" }} />
          <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-serif)" }}>ShopTheLook</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <Bell className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => setShowCreate(true)} className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C3AED, #DB2777)" }}>
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Story strip */}
      {storyStrip.length > 0 && (
        <div className="shrink-0 px-4 pb-3 z-20">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
            {/* Own post button */}
            <button onClick={() => setShowCreate(true)} className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: 68 }}>
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${avatarColor(user?.email || "a")}, #4F46E5)`, border: "2px solid rgba(255,255,255,0.2)" }}>
                  <span className="text-white text-xl font-bold">{user?.full_name?.[0]?.toUpperCase() || "+"}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#4F46E5", border: "2px solid #0B1120" }}>
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-white/80 truncate max-w-[64px] text-center">Your look</span>
            </button>
            {storyStrip.map(p => (
              <StoryCircle key={p.author_email} post={p} isOwn={p.author_email === user?.email} onPress={() => {}} />
            ))}
          </div>
        </div>
      )}

      {/* Vertical snap feed */}
      <div className="flex-1 overflow-y-auto" style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
              <ShoppingBag className="w-9 h-9" style={{ color: "#a78bfa" }} />
            </div>
            <h3 className="text-white font-bold text-xl" style={{ fontFamily: "var(--font-serif)" }}>No looks yet</h3>
            <p className="text-white/40 text-sm">Be the first to share your outfit!</p>
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

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && user && (
          <CreatePostModal user={user} onClose={() => setShowCreate(false)} onCreated={handleRefetch} />
        )}
      </AnimatePresence>
    </div>
  );
}