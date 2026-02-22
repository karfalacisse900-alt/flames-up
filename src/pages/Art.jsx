import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePullToRefresh } from "../components/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, TrendingUp, TrendingDown, X, Swords } from "lucide-react";
import ArtVoiceSection from "../components/art/ArtVoiceSection";
import { addCoins, getBalance } from "../components/coins/coinsHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import ArtFightArena from "../components/art/ArtFightArena";
import ArtFightLeaderboard from "../components/art/ArtFightLeaderboard";
import ArtFightUpload from "../components/art/ArtFightUpload";
import ArtFightAdmin from "../components/art/ArtFightAdmin";
import MyArtFightEntries from "../components/art/MyArtFightEntries";

// Simulated price history per art (seeded by art id)
function getPriceHistory(art) {
  const seed = art.id?.charCodeAt(0) || 50;
  const base = art.price || 30;
  const points = [];
  let cur = base * 0.7;
  for (let i = 0; i < 8; i++) {
    cur = Math.max(5, cur + (Math.sin(seed + i) * base * 0.15));
    points.push(Math.round(cur));
  }
  points.push(base); // current price
  return points;
}

function Sparkline({ points, positive }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 60, h = 24;
  const pts = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={positive ? "#7C8C6E" : "#E07B6A"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArtTradingCard({ art, user, onClick }) {
  const history = useMemo(() => getPriceHistory(art), [art.id, art.price]);
  const prevPrice = history[history.length - 2] || art.price;
  const change = art.price > 0 ? ((art.price - prevPrice) / prevPrice * 100).toFixed(1) : 0;
  const positive = parseFloat(change) >= 0;

  return (
    <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    style={{ backgroundColor: "var(--bg-nav)", border: "1px solid var(--border-light)" }}
    >
      <div className="aspect-square overflow-hidden relative">
        <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" />
        {art.is_for_sale && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-xl px-2 py-1">
            <span className="text-[10px] font-semibold" style={{ color: "var(--accent-primary)" }}>FOR SALE</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{art.title}</p>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-hint)" }}>{art.creator_name}</p>
        {art.price > 0 && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>⬡ {art.price}</span>
            <div className="flex items-center gap-1.5">
              <Sparkline points={history} positive={positive} />
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${positive ? "" : "text-rose-500"}`} style={positive ? { color: "var(--accent-primary)" } : {}}>
                {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function GalleryCard({ art, user, onClick, onLike }) {
  const likedBy = art.liked_by || [];
  const isLiked = user?.email && likedBy.includes(user.email);
  return (
    <div className="rounded-2xl overflow-hidden cursor-pointer" style={{ backgroundColor: "var(--bg-nav)", border: "1px solid var(--border-light)" }}>
      <div className="aspect-square overflow-hidden relative" onClick={onClick}>
        <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{art.title}</p>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-hint)" }}>{art.creator_name}</p>
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(art); }}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: isLiked ? "#E07070" : "var(--text-hint)" }}
          >
            <span>{isLiked ? "♥" : "♡"}</span>
            <span>{art.like_count || 0}</span>
          </button>
          <button
            onClick={onClick}
            className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
            style={{ backgroundColor: "var(--bg-app)", color: "var(--text-hint)" }}
          >
            💬 Comment
          </button>
        </div>
      </div>
    </div>
  );
}

function ArtDetailModal({ art, user, onClose }) {
  const isCreator = art.creator_email === user?.email;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg rounded-t-3xl"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        style={{ maxHeight: "90dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", backgroundColor: "var(--bg-nav)" }}
      >
        {/* Image */}
        <div className="relative">
          <img src={art.image_url} alt={art.title} className="w-full aspect-video object-cover" />
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{art.title}</h2>
               <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>by {art.creator_name}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--bg-card)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{art.like_count || 0}</p>
              <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Likes</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--bg-card)" }}>
              <p className="text-[10px] font-semibold" style={{ color: "var(--accent-primary)" }}>Earns {Math.floor((art.like_count || 0) / 10) * 2} ⬡</p>
              <p className="text-[9px] text-[#9B9B9B]">per 10 likes</p>
            </div>
          </div>

          {/* Voice comments */}
          <ArtVoiceSection artId={art.id} user={user} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Art() {
  const [user, setUser] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedArt, setSelectedArt] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("gallery");
  const [showFightUpload, setShowFightUpload] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: artPieces = [], isLoading } = useQuery({
    queryKey: ["art"],
    queryFn: () => base44.entities.ArtPiece.list("-created_date", 50),
  });

  const gallery = artPieces;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    
    const art = await base44.entities.ArtPiece.create({
      title: title.trim(), description: description.trim(), image_url: file_url,
      creator_email: user?.email || "", creator_name: user?.full_name || "Artist",
      owner_email: user?.email || "", owner_name: user?.full_name || "Artist",
      like_count: 0,
    });
    
    setTitle(""); setDescription(""); setSelectedFile(null); setPreviewUrl(null);
    setShowUpload(false); setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["art"] });
  };



  const handleLikeArt = async (art) => {
    if (!user?.email) return;
    const likedBy = art.liked_by || [];
    if (likedBy.includes(user.email)) return;
    
    const newLikeCount = (art.like_count || 0) + 1;
    const coinsReward = newLikeCount % 10 === 0 ? 2 : 0;
    
    await base44.entities.ArtPiece.update(art.id, {
      like_count: newLikeCount,
      liked_by: [...likedBy, user.email],
    });
    
    if (coinsReward > 0 && art.creator_email) {
      await addCoins(art.creator_email, coinsReward, "post_liked", `Your art received 10 likes!`, art.id);
    }
    
    queryClient.invalidateQueries({ queryKey: ["art"] });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Art</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Gallery · Fight</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "fight" && (
            <button onClick={() => setShowFightUpload(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-white text-xs font-semibold shadow-md" style={{ backgroundColor: "var(--accent-secondary)" }}>
              <Swords className="w-3.5 h-3.5" /> Submit
            </button>
          )}
          {activeTab !== "fight" && (
            <button onClick={() => setShowUpload(true)} className="p-2.5 rounded-full text-white shadow-sm" style={{ backgroundColor: "var(--accent-primary)" }}>
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-5 mt-4">
        <TabsList className="rounded-xl w-full" style={{ backgroundColor: "var(--bg-card)" }}>
          <TabsTrigger value="gallery" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] text-sm">Gallery</TabsTrigger>
          <TabsTrigger value="fight" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] text-sm">⚔️ Fight</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-4 pb-24">
          {isLoading ? (
            <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} /></div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-16"><p className="text-4xl mb-3">🎨</p><p className="text-sm" style={{ color: "var(--text-hint)" }}>No art yet.</p></div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((art) => (
                <GalleryCard key={art.id} art={art} user={user} onClick={() => setSelectedArt(art)} onLike={handleLikeArt} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="fight" className="mt-4">
          <Tabs defaultValue="arena">
            <TabsList className="rounded-xl w-full mb-1" style={{ backgroundColor: "var(--bg-card)" }}>
              <TabsTrigger value="arena" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] text-xs">⚔️ Arena</TabsTrigger>
              <TabsTrigger value="top" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] text-xs">🏆 Top Art</TabsTrigger>
              <TabsTrigger value="mine" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] text-xs">My Art</TabsTrigger>
              {user?.role === "admin" && (
                <TabsTrigger value="admin" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] text-xs">🛡 Review</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="arena">
              <ArtFightArena user={user} />
            </TabsContent>
            <TabsContent value="top">
              <ArtFightLeaderboard />
            </TabsContent>
            <TabsContent value="mine">
              <MyArtFightEntries user={user} />
            </TabsContent>
            {user?.role === "admin" && (
              <TabsContent value="admin">
                <ArtFightAdmin user={user} />
              </TabsContent>
            )}
          </Tabs>
        </TabsContent>
      </Tabs>

      <ArtFightUpload
        user={user}
        open={showFightUpload}
        onClose={() => setShowFightUpload(false)}
        onUploaded={() => {}}
      />

      {/* Art detail modal */}
      <AnimatePresence>
        {selectedArt && (
          <ArtDetailModal
            art={selectedArt}
            user={user}
            onClose={() => setSelectedArt(null)}
          />
        )}
      </AnimatePresence>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Upload Art</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-square">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full">✕</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors" style={{ borderColor: "var(--border-light)" }}>
                <Upload className="w-8 h-8 mb-2" style={{ color: "var(--text-hint)" }} />
                <span className="text-sm" style={{ color: "var(--text-hint)" }}>Tap to upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
            )}
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" style={{ borderColor: "var(--border-light)" }} />
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl resize-none" style={{ borderColor: "var(--border-light)" }} />
            <Button onClick={handleUpload} disabled={!selectedFile || !title.trim() || uploading} className="w-full rounded-xl text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
              {uploading ? "Uploading..." : "Publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}