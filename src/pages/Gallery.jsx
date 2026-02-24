import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, X, Send, Flame, Clock } from "lucide-react";
import ArtVoiceComment from "@/components/art/ArtVoiceComment";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const SORTS = [
  { key: "newest", label: "Newest", icon: Clock },
  { key: "liked", label: "Most Liked", icon: Heart },
  { key: "trending", label: "Trending", icon: Flame },
];

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
      await base44.entities.Artwork.update(artwork.id, { comment_count: (artwork.comment_count || 0) + 1 });
      qc.invalidateQueries({ queryKey: ["artComments", artwork.id] });
      qc.invalidateQueries({ queryKey: ["artworks"] });
    },
  });

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg rounded-t-3xl flex flex-col"
        style={{ maxHeight: "92dvh", backgroundColor: "#E6EFEA" }}>
        
        {/* Image */}
        <div className="relative shrink-0">
          <img src={artwork.image_url} alt={artwork.title} className="w-full aspect-video object-cover rounded-t-3xl" />
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/50 rounded-full p-2">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Info */}
        <div className="px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #DCCBB8" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>{artwork.title}</h2>
              <p className="text-xs mt-0.5" style={{ color: "#6B6B6B" }}>by {artwork.user_name} · {timeAgo(artwork.created_date)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => onLike(artwork)}
                className="flex flex-col items-center gap-0.5"
                style={{ color: isLiked ? "#E07070" : "#6B6B6B" }}>
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="text-[10px] font-semibold">{artwork.like_count || 0}</span>
              </button>
              <button className="flex flex-col items-center gap-0.5" style={{ color: "#6B6B6B" }}
                onClick={() => navigator.share?.({ title: artwork.title, url: window.location.href }).catch(() => {})}>
                <Share2 className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Share</span>
              </button>
            </div>
          </div>
          {artwork.description && (
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "#4A4A4A" }}>{artwork.description}</p>
          )}
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          <p className="text-xs font-bold" style={{ color: "#243D33" }}>💬 Comments ({artwork.comment_count || 0})</p>
          {comments.length === 0 && <p className="text-sm text-center py-4" style={{ color: "#A8A8A8" }}>No comments yet</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: "#DCCBB8", color: "#243D33" }}>
                {c.user_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold" style={{ color: "#6B6B6B" }}>{c.user_name}</p>
                {c.audio_url
                  ? <audio src={c.audio_url} controls className="h-8 w-full mt-1" style={{ maxWidth: 220 }} />
                  : <p className="text-sm" style={{ color: "#2F2F2F" }}>{c.text}</p>
                }
              </div>
            </div>
          ))}
        </div>

        {user && (
          <div className="px-4 py-3 flex gap-2 items-center" style={{ borderTop: "1px solid #DCCBB8", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", backgroundColor: "#E6EFEA" }}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
              placeholder="Add a comment…" className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
              style={{ backgroundColor: "#DCCBB8", border: "1px solid #BF9E79", color: "#243D33" }} />
            <button onClick={() => commentText.trim() && commentMut.mutate()}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#3C6E5A", color: "#fff" }}>
              <Send className="w-4 h-4" />
            </button>
            <ArtVoiceComment artworkId={artwork.id} user={user} onSent={() => { }} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Gallery() {
  const [user, setUser] = useState(null);
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: artworks = [], isLoading: loadingArtworks } = useQuery({
    queryKey: ["artworks"],
    queryFn: () => base44.entities.Artwork.filter({ status: "published" }, "-created_date", 60),
  });

  // Also load legacy ArtPiece records
  const { data: artPieces = [], isLoading: loadingPieces } = useQuery({
    queryKey: ["artPieces"],
    queryFn: () => base44.entities.ArtPiece.list("-created_date", 60),
  });

  // Merge both into a unified list
  const allArtworks = [
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
    }))
  ];

  const isLoading = loadingArtworks || loadingPieces;

  const sorted = [...allArtworks].sort((a, b) => {
    if (sort === "liked") return (b.like_count || 0) - (a.like_count || 0);
    if (sort === "trending") {
      const cutoff = Date.now() - 86400000;
      const aRecent = new Date(a.created_date) > cutoff ? (a.like_count || 0) : 0;
      const bRecent = new Date(b.created_date) > cutoff ? (b.like_count || 0) : 0;
      return bRecent - aRecent;
    }
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const handleLike = async (art) => {
    if (!user?.email) return;
    if (art.liked_by?.includes(user.email)) return;
    const updated = { like_count: (art.like_count || 0) + 1, liked_by: [...(art.liked_by || []), user.email] };
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#E6EFEA" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 sticky top-0 z-20" style={{ backgroundColor: "#E6EFEA", borderBottom: "1px solid #DCCBB8" }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>Gallery</h1>
          <button onClick={() => navigate(createPageUrl("ArtStudio"))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "#3C6E5A", color: "#E6EFEA" }}>
            🎨 Create
          </button>
        </div>

        {/* Sort pills */}
        <div className="flex gap-2">
          {SORTS.map(s => (
            <button key={s.key} onClick={() => setSort(s.key)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: sort === s.key ? "#243D33" : "#DCCBB8",
                color: sort === s.key ? "#E6EFEA" : "#6B6B6B",
              }}>
              <s.icon className="w-3 h-3" /> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#3C6E5A", borderTopColor: "transparent" }} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">🎨</p>
          <p className="text-sm mb-4" style={{ color: "#6B6B6B" }}>No artworks yet. Be the first!</p>
          <button onClick={() => navigate(createPageUrl("ArtStudio"))}
            className="px-5 py-2.5 rounded-full font-semibold text-sm"
            style={{ backgroundColor: "#3C6E5A", color: "#E6EFEA" }}>
            Open Art Studio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {sorted.map(art => {
            const isLiked = art.liked_by?.includes(user?.email);
            return (
              <motion.div key={art.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden cursor-pointer"
                style={{ backgroundColor: "#DCCBB8", border: "1px solid #BF9E7950" }}
                onClick={() => setSelected(art)}>
                <div className="aspect-square overflow-hidden">
                  <img src={art.image_url} alt={art.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold truncate" style={{ color: "#243D33" }}>{art.title}</p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: "#6B6B6B" }}>{art.user_name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={e => { e.stopPropagation(); handleLike(art); }}
                      className="flex items-center gap-1 text-xs transition-colors"
                      style={{ color: isLiked ? "#E07070" : "#6B6B6B" }}>
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                      <span>{art.like_count || 0}</span>
                    </button>
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: "#A8A8A8" }}>
                      <MessageCircle className="w-3 h-3" /> {art.comment_count || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <ArtworkDetailModal
            artwork={selected}
            user={user}
            onClose={() => setSelected(null)}
            onLike={handleLike}
          />
        )}
      </AnimatePresence>
    </div>
  );
}