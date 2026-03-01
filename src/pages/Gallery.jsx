import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, X, Send, Flame, Clock, Star, Swords, Upload, Grid, TrendingUp, Award, Tag, Eye, Loader2, Camera, Trophy } from "lucide-react";
import ArtVoiceComment from "@/components/art/ArtVoiceComment";
import ArtVoteArena from "@/components/gallery/ArtVoteArena";
import DailyWinnerBanner from "@/components/gallery/DailyWinnerBanner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SORTS = [
  { key: "newest", label: "New", icon: Clock },
  { key: "liked", label: "Popular", icon: Heart },
  { key: "trending", label: "Hot", icon: Flame },
  { key: "top_rated", label: "Top", icon: Star },
];

const CATEGORIES = ["all", "abstract", "portrait", "landscape", "digital", "illustration", "photography", "other"];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

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
      try {
        await base44.entities.Artwork.update(artwork.id, { comment_count: (artwork.comment_count || 0) + 1 });
      } catch {}
      qc.invalidateQueries({ queryKey: ["artComments", artwork.id] });
      qc.invalidateQueries({ queryKey: ["artworks"] });
    },
  });

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg rounded-t-3xl flex flex-col"
        style={{ height: "92dvh", backgroundColor: "#1a1a1a" }}>

        {/* Full image */}
        <div className="relative shrink-0 bg-black rounded-t-3xl overflow-hidden">
          {!imgLoaded && <div className="aspect-video skeleton" />}
          <img src={artwork.image_url} alt={artwork.title}
            className="w-full max-h-64 object-contain"
            style={{ display: imgLoaded ? "block" : "none" }}
            onLoad={() => setImgLoaded(true)} />
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full p-2">
            <X className="w-4 h-4 text-white" />
          </button>
          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: "linear-gradient(to top, #1a1a1a, transparent)" }} />
        </div>

        {/* Info bar */}
        <div className="px-5 py-3 shrink-0 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>{artwork.title}</h2>
            <p className="text-xs text-white/50 mt-0.5">by {artwork.user_name} · {timeAgo(artwork.created_date)}</p>
            {artwork.description && <p className="text-sm text-white/70 mt-1.5 leading-relaxed">{artwork.description}</p>}
            {artwork.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {artwork.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>#{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-3 shrink-0">
            <button onClick={() => onLike(artwork)} className="flex flex-col items-center gap-0.5">
              <Heart className={`w-6 h-6 transition-all ${isLiked ? "fill-red-400 text-red-400 scale-110" : "text-white/50"}`} />
              <span className="text-[10px] text-white/50">{artwork.like_count || 0}</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 text-white/40"
              onClick={() => navigator.share?.({ title: artwork.title, url: window.location.href }).catch(() => {})}>
              <Share2 className="w-5 h-5" />
              <span className="text-[10px]">Share</span>
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-3">
          <p className="text-xs font-bold text-white/70">💬 Comments ({artwork.comment_count || 0})</p>
          {comments.length === 0 && <p className="text-sm text-center py-4 text-white/30">Be the first to comment</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                style={{ backgroundColor: "#2E6B4F" }}>
                {c.user_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-white/40">{c.user_name}</p>
                {c.audio_url
                  ? <audio src={c.audio_url} controls className="h-8 w-full mt-1" style={{ maxWidth: 220 }} />
                  : <p className="text-sm text-white/80">{c.text}</p>}
              </div>
            </div>
          ))}
        </div>

        {user && (
          <div className="shrink-0 px-4 py-3 flex gap-2 items-center" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", backgroundColor: "#1a1a1a" }}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
              placeholder="Add a comment…" className="flex-1 text-sm px-3 py-2 rounded-xl outline-none bg-white/10 text-white placeholder-white/30 border border-white/10" />
            <button onClick={() => commentText.trim() && commentMut.mutate()}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#2E6B4F" }}>
              <Send className="w-4 h-4 text-white" />
            </button>
            <ArtVoiceComment artworkId={artwork.id} user={user} onSent={() => {}} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Masonry grid card
function ArtCard({ art, user, onSelect, onLike }) {
  const isLiked = art.liked_by?.includes(user?.email);
  return (
    <div className="break-inside-avoid mb-3 rounded-2xl overflow-hidden cursor-pointer group relative"
      style={{ backgroundColor: "#DCCBB8", border: "1px solid #BF9E7950" }}
      onClick={() => onSelect(art)}>
      <div className="relative overflow-hidden">
        <img src={art.image_url} alt={art.title} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {/* hover overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <Eye className="w-8 h-8 text-white" />
        </div>
        {/* Like btn */}
        <button
          onClick={e => { e.stopPropagation(); onLike(art); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <Heart className={`w-4 h-4 transition-all ${isLiked ? "fill-red-400 text-red-400" : "text-white"}`} />
        </button>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-semibold truncate" style={{ color: "#243D33" }}>{art.title}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] truncate" style={{ color: "#6B6B6B" }}>{art.user_name}</p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "#6B6B6B" }}>
              <Heart className="w-2.5 h-2.5" /> {art.like_count || 0}
            </span>
            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "#6B6B6B" }}>
              <MessageCircle className="w-2.5 h-2.5" /> {art.comment_count || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Gallery() {
  const [user, setUser] = useState(null);
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("gallery");
  const [category, setCategory] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: artworks = [], isLoading: loadingArtworks } = useQuery({
    queryKey: ["artworks"],
    queryFn: () => base44.entities.Artwork.filter({ status: "published" }, "-created_date", 80),
  });

  const { data: artPieces = [], isLoading: loadingPieces } = useQuery({
    queryKey: ["artPieces"],
    queryFn: () => base44.entities.ArtPiece.list("-created_date", 80),
  });

  const allArtworks = useMemo(() => [
    ...artworks,
    ...artPieces.map(p => ({
      id: `piece_${p.id}`,
      _raw_id: p.id,
      _type: "ArtPiece",
      title: p.title,
      image_url: p.image_url,
      user_name: p.creator_name || p.owner_name,
      user_email: p.creator_email || p.owner_email,
      like_count: p.like_count || 0,
      liked_by: p.liked_by || [],
      comment_count: 0,
      description: p.description,
      created_date: p.created_date,
      tags: [],
      category: "other",
    }))
  ], [artworks, artPieces]);

  const isLoading = loadingArtworks || loadingPieces;

  const sorted = useMemo(() => {
    let list = allArtworks;
    if (category !== "all") list = list.filter(a => a.category === category);
    return [...list].sort((a, b) => {
      if (sort === "liked") return (b.like_count || 0) - (a.like_count || 0);
      if (sort === "top_rated") return (b.vote_count || b.like_count || 0) - (a.vote_count || a.like_count || 0);
      if (sort === "trending") {
        const cutoff = Date.now() - 86400000;
        const aScore = new Date(a.created_date) > cutoff ? (a.like_count || 0) * 2 : (a.like_count || 0);
        const bScore = new Date(b.created_date) > cutoff ? (b.like_count || 0) * 2 : (b.like_count || 0);
        return bScore - aScore;
      }
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }, [allArtworks, sort, category]);

  // Stats
  const totalLikes = allArtworks.reduce((sum, a) => sum + (a.like_count || 0), 0);
  const topArtist = useMemo(() => {
    const map = {};
    allArtworks.forEach(a => { map[a.user_name] = (map[a.user_name] || 0) + (a.like_count || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [allArtworks]);

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim() || !user) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
      await base44.entities.Artwork.create({
        user_email: user.email,
        user_name: user.full_name || "Artist",
        title: uploadTitle.trim(),
        description: uploadDesc,
        image_url: file_url,
        status: "published",
        like_count: 0,
        liked_by: [],
        comment_count: 0,
        vote_count: 0,
        category: uploadCategory,
        tags: uploadTags.split(",").map(t => t.trim()).filter(Boolean),
      });
      qc.invalidateQueries({ queryKey: ["artworks"] });
      setShowUpload(false);
      setUploadTitle(""); setUploadDesc(""); setUploadTags(""); setUploadFile(null); setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#E6EFEA", overflowX: "hidden", maxWidth: "100%", width: "100%" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 sticky top-0 z-20" style={{ backgroundColor: "#E6EFEA", borderBottom: "1px solid #DCCBB8" }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>Gallery</h1>
          <div className="flex items-center gap-2">
            {allArtworks.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#DCCBB8", color: "#6B6B6B" }}>
                {allArtworks.length} works
              </span>
            )}
            {user && (
              <button onClick={() => setShowUpload(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-semibold"
                style={{ backgroundColor: "#2E6B4F", color: "#fff" }}>
                +
              </button>
            )}
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ backgroundColor: "#DCCBB8" }}>
          <button onClick={() => setTab("gallery")}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: tab === "gallery" ? "#243D33" : "transparent", color: tab === "gallery" ? "#E6EFEA" : "#6B6B6B" }}>
            🖼 Gallery
          </button>
          <button onClick={() => setTab("vote")}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: tab === "vote" ? "#E07070" : "transparent", color: tab === "vote" ? "#fff" : "#6B6B6B" }}>
            <Swords className="w-3 h-3" /> Vote Arena
          </button>
          <Link to={createPageUrl("WeeklyChallenges")}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: "transparent", color: "#6B6B6B" }}>
            <Camera className="w-3 h-3" /> Challenges
          </Link>
          <Link to={createPageUrl("HallOfFame")}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: "transparent", color: "#6B6B6B" }}>
            <Trophy className="w-3 h-3" /> Fame
          </Link>
        </div>

        {tab === "gallery" && (
          <>
            {/* Sort */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-2">
              {SORTS.map(s => (
                <button key={s.key} onClick={() => setSort(s.key)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0"
                  style={{
                    backgroundColor: sort === s.key ? "#243D33" : "#DCCBB8",
                    color: sort === s.key ? "#E6EFEA" : "#6B6B6B",
                  }}>
                  <s.icon className="w-3 h-3" /> {s.label}
                </button>
              ))}
            </div>
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: category === cat ? "#DCCBB8" : "transparent",
                    color: category === cat ? "#243D33" : "#6B6B6B",
                    border: `1px solid ${category === cat ? "#BF9E79" : "#DCCBB860"}`,
                  }}>
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats bar (gallery only) */}
      {tab === "gallery" && !isLoading && allArtworks.length > 0 && (
        <div className="px-5 py-2 flex gap-4 text-xs" style={{ color: "#6B6B6B", borderBottom: "1px solid #DCCBB8" }}>
          <span>❤️ {totalLikes} total likes</span>
          {topArtist && <span>🏆 Top: {topArtist}</span>}
        </div>
      )}

      {/* Daily Winner Banner */}
      {tab === "gallery" && <DailyWinnerBanner />}

      {/* Vote Arena */}
      {tab === "vote" && <div style={{ backgroundColor: "#E6EFEA" }}><ArtVoteArena user={user} /></div>}

      {/* Masonry Grid */}
      {tab === "gallery" && (
        isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#2E6B4F" }} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 px-6">
            <p className="text-5xl mb-3">🎨</p>
            <p className="text-sm" style={{ color: "#6B6B6B" }}>No artworks yet</p>
            {user && <button onClick={() => setShowUpload(true)} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: "#2E6B4F", color: "#fff" }}>Upload First</button>}
          </div>
        ) : (
          <div className="px-4 pt-4" style={{ columns: "2", columnGap: "12px", maxWidth: "100%", overflowX: "hidden", width: "100%" }}>
            {sorted.map(art => (
              <ArtCard key={art.id} art={art} user={user} onSelect={setSelected} onLike={handleLike} />
            ))}
          </div>
        )
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <ArtworkDetailModal artwork={selected} user={user} onClose={() => setSelected(null)} onLike={handleLike} />
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowUpload(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg rounded-t-3xl p-6 space-y-4 overflow-y-auto"
              style={{ backgroundColor: "#E6EFEA", maxHeight: "90dvh" }}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>Upload Artwork</h2>
                <button onClick={() => setShowUpload(false)}><X className="w-5 h-5" style={{ color: "#6B6B6B" }} /></button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setUploadFile(f); setPreviewUrl(URL.createObjectURL(f)); }
                }} />

              <button onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 transition-all overflow-hidden"
                style={{ borderColor: uploadFile ? "#2E6B4F" : "rgba(255,255,255,0.15)", minHeight: previewUrl ? "auto" : 120 }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="w-full max-h-48 object-cover rounded-2xl" />
                ) : (
                  <div className="py-8 flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-white/30" />
                    <span className="text-sm text-white/40">Tap to choose image</span>
                  </div>
                )}
              </button>

              <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                placeholder="Title *" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "#DCCBB8", border: "1px solid #BF9E79", color: "#243D33" }} />

              <textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                placeholder="Description (optional)" rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: "#DCCBB8", border: "1px solid #BF9E79", color: "#243D33" }} />

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "#6B6B6B" }}>Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter(c => c !== "all").map(cat => (
                    <button key={cat} onClick={() => setUploadCategory(cat)}
                      className="px-3 py-1 rounded-full text-xs capitalize transition-all"
                      style={{
                        backgroundColor: uploadCategory === cat ? "#2E6B4F" : "#DCCBB8",
                        color: uploadCategory === cat ? "#fff" : "#6B6B6B",
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs mb-1.5 flex items-center gap-1" style={{ color: "#6B6B6B" }}><Tag className="w-3 h-3" /> Tags (comma separated)</label>
                <input value={uploadTags} onChange={e => setUploadTags(e.target.value)}
                  placeholder="nature, color, minimal…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "#DCCBB8", border: "1px solid #BF9E79", color: "#243D33" }} />
              </div>

              <button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadTitle.trim()}
                className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-40 transition-all"
                style={{ backgroundColor: "#2E6B4F" }}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "🎨 Upload to Gallery"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}