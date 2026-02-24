import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, UserPlus, UserCheck, X, Send, Flame, Sparkles, TrendingUp } from "lucide-react";
import ArtVoiceComment from "@/components/art/ArtVoiceComment";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function ArtCard({ art, user, onLike, onSelect, followedEmails, onFollow }) {
  const isLiked     = art.liked_by?.includes(user?.email);
  const isOwnArt    = art.user_email === user?.email;
  const isFollowing = followedEmails.has(art.user_email);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#DCCBB8", border: "1px solid #BF9E7950" }}>
      <div className="relative cursor-pointer" onClick={() => onSelect(art)}>
        <img src={art.image_url} alt={art.title} className="w-full aspect-square object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-xs font-bold truncate drop-shadow">{art.title}</p>
        </div>
      </div>
      <div className="px-2.5 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ backgroundColor: "#3C6E5A", color: "#fff" }}>
              {art.user_name?.[0]?.toUpperCase() || "?"}
            </div>
            <p className="text-[10px] truncate" style={{ color: "#6B6B6B" }}>{art.user_name}</p>
            {!isOwnArt && (
              <button onClick={() => onFollow(art.user_email, art.user_name)}
                className="shrink-0 p-0.5"
                style={{ color: isFollowing ? "#3C6E5A" : "#A8A8A8" }}>
                {isFollowing
                  ? <UserCheck className="w-3 h-3" />
                  : <UserPlus  className="w-3 h-3" />}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => onLike(art)} className="flex items-center gap-0.5 text-[10px]"
              style={{ color: isLiked ? "#E07070" : "#A8A8A8" }}>
              <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
              <span>{art.like_count || 0}</span>
            </button>
            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "#A8A8A8" }}>
              <MessageCircle className="w-3 h-3" />
              {art.comment_count || 0}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ArtDetailModal({ art, user, onClose, onLike, followedEmails, onFollow }) {
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const isLiked     = art.liked_by?.includes(user?.email);
  const isOwnArt    = art.user_email === user?.email;
  const isFollowing = followedEmails.has(art.user_email);

  const { data: comments = [] } = useQuery({
    queryKey: ["artComments", art.id],
    queryFn: () => base44.entities.ArtComment.filter({ artwork_id: art.id }, "-created_date", 30),
  });

  const commentMut = useMutation({
    mutationFn: () => base44.entities.ArtComment.create({
      artwork_id: art.id,
      user_email: user?.email || "",
      user_name: user?.full_name || "Artist",
      text: commentText.trim(),
    }),
    onSuccess: async () => {
      setCommentText("");
      await base44.entities.Artwork.update(art.id, { comment_count: (art.comment_count || 0) + 1 });
      qc.invalidateQueries({ queryKey: ["artComments", art.id] });
      qc.invalidateQueries({ queryKey: ["exploreArtworks"] });
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
        
        <div className="relative shrink-0">
          <img src={art.image_url} alt={art.title} className="w-full aspect-video object-cover rounded-t-3xl" />
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/50 rounded-full p-2">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-5 py-3 shrink-0 flex items-center justify-between" style={{ borderBottom: "1px solid #DCCBB8" }}>
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>{art.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs" style={{ color: "#6B6B6B" }}>by {art.user_name} · {timeAgo(art.created_date)}</p>
              {!isOwnArt && user && (
                <button onClick={() => onFollow(art.user_email, art.user_name)}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: isFollowing ? "#EEF3F0" : "#3C6E5A", color: isFollowing ? "#3C6E5A" : "#fff", border: isFollowing ? "1px solid #3C6E5A" : "none" }}>
                  {isFollowing ? <><UserCheck className="w-3 h-3" /> Following</> : <><UserPlus className="w-3 h-3" /> Follow</>}
                </button>
              )}
            </div>
          </div>
          <button onClick={() => onLike(art)} className="flex flex-col items-center gap-0.5 shrink-0 ml-3"
            style={{ color: isLiked ? "#E07070" : "#6B6B6B" }}>
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            <span className="text-[10px] font-semibold">{art.like_count || 0}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {art.description && <p className="text-sm leading-relaxed" style={{ color: "#4A4A4A" }}>{art.description}</p>}
          <p className="text-xs font-bold" style={{ color: "#243D33" }}>💬 Comments</p>
          {comments.length === 0 && <p className="text-sm text-center py-3" style={{ color: "#A8A8A8" }}>No comments yet</p>}
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
                  : <p className="text-sm" style={{ color: "#2F2F2F" }}>{c.text}</p>}
              </div>
            </div>
          ))}
        </div>

        {user && (
          <div className="px-4 py-3 flex gap-2 items-center" style={{ borderTop: "1px solid #DCCBB8", paddingBottom: "calc(12px + env(safe-area-inset-bottom,0px))", backgroundColor: "#E6EFEA" }}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
              placeholder="Add a comment…" className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
              style={{ backgroundColor: "#DCCBB8", border: "1px solid #BF9E79", color: "#243D33" }} />
            <button onClick={() => commentText.trim() && commentMut.mutate()}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#3C6E5A", color: "#fff" }}>
              <Send className="w-4 h-4" />
            </button>
            <ArtVoiceComment artworkId={art.id} user={user} onSent={() => qc.invalidateQueries({ queryKey: ["artComments", art.id] })} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const TABS = [
  { key: "trending", label: "Trending", icon: Flame },
  { key: "newest",   label: "New",      icon: Sparkles },
  { key: "following",label: "Following", icon: UserCheck },
];

export default function Explore() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("trending");
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: artworks = [], isLoading } = useQuery({
    queryKey: ["exploreArtworks"],
    queryFn: () => base44.entities.Artwork.filter({ status: "published" }, "-created_date", 100),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["myFollows", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }, "-created_date", 200),
    enabled: !!user?.email,
  });

  const followedEmails = new Set(follows.map(f => f.following_email));

  const handleFollow = async (targetEmail, targetName) => {
    if (!user) return;
    if (followedEmails.has(targetEmail)) {
      // Unfollow
      const existing = follows.find(f => f.following_email === targetEmail);
      if (existing) {
        await base44.entities.Follow.delete(existing.id);
        qc.invalidateQueries({ queryKey: ["myFollows", user.email] });
      }
    } else {
      // Follow
      await base44.entities.Follow.create({
        follower_email: user.email,
        follower_name: user.full_name || "Artist",
        following_email: targetEmail,
        following_name: targetName || "",
      });
      qc.invalidateQueries({ queryKey: ["myFollows", user.email] });
    }
  };

  const handleLike = async (art) => {
    if (!user?.email || art.liked_by?.includes(user.email)) return;
    const updated = { like_count: (art.like_count || 0) + 1, liked_by: [...(art.liked_by || []), user.email] };
    await base44.entities.Artwork.update(art.id, updated);
    qc.invalidateQueries({ queryKey: ["exploreArtworks"] });
    if (selected?.id === art.id) setSelected({ ...selected, ...updated });
  };

  const sorted = [...artworks].sort((a, b) => {
    if (tab === "newest") return new Date(b.created_date) - new Date(a.created_date);
    if (tab === "trending") {
      const score = x => (x.like_count || 0) * 2 + (x.comment_count || 0);
      return score(b) - score(a);
    }
    return 0;
  }).filter(a => {
    if (tab === "following") return followedEmails.has(a.user_email);
    return true;
  });

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#E6EFEA" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 sticky top-0 z-20" style={{ backgroundColor: "#E6EFEA", borderBottom: "1px solid #DCCBB8" }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "#243D33" }}>Explore Art</h1>
          <button onClick={() => navigate(createPageUrl("ArtStudio"))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "#3C6E5A", color: "#E6EFEA" }}>
            🎨 Create
          </button>
        </div>
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ backgroundColor: tab === t.key ? "#243D33" : "#DCCBB8", color: tab === t.key ? "#E6EFEA" : "#6B6B6B" }}>
              <t.icon className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#3C6E5A", borderTopColor: "transparent" }} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 px-8">
          <p className="text-4xl mb-3">{tab === "following" ? "👥" : "🎨"}</p>
          <p className="text-sm" style={{ color: "#6B6B6B" }}>
            {tab === "following" ? "Follow artists to see their work here" : "No artworks yet. Be the first to create!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {sorted.map(art => (
            <ArtCard key={art.id} art={art} user={user}
              onLike={handleLike} onSelect={setSelected}
              followedEmails={followedEmails} onFollow={handleFollow} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <ArtDetailModal art={selected} user={user}
            onClose={() => setSelected(null)}
            onLike={handleLike}
            followedEmails={followedEmails}
            onFollow={handleFollow} />
        )}
      </AnimatePresence>
    </div>
  );
}