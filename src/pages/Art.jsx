import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, TrendingUp, TrendingDown, X } from "lucide-react";
import ArtVoiceSection from "../components/art/ArtVoiceSection";
import { addCoins, getBalance } from "../components/coins/coinsHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

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

function ArtDetailModal({ art, user, onClose, onBuy, onSell, onList }) {
  const [sellPrice, setSellPrice] = useState(art.price?.toString() || "");
  const [showSellInput, setShowSellInput] = useState(false);
  const history = useMemo(() => getPriceHistory(art), [art.id, art.price]);
  const prevPrice = history[history.length - 2] || art.price;
  const change = art.price > 0 ? ((art.price - prevPrice) / prevPrice * 100).toFixed(1) : 0;
  const positive = parseFloat(change) >= 0;
  const isOwner = art.owner_email === user?.email;
  const isCreator = art.creator_email === user?.email;

  const { data: trades = [] } = useQuery({
    queryKey: ["artTrades", art.id],
    queryFn: () => base44.entities.ArtTrade.filter({ art_id: art.id }, "-created_date", 10),
    enabled: !!art.id,
  });

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
              <h2 className="text-xl font-semibold text-[#2C2C2C]" style={{ fontFamily: "var(--font-serif)" }}>{art.title}</h2>
              <p className="text-xs text-[#9B9B9B] mt-0.5">by {art.creator_name}</p>
            </div>
            {art.price > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-[#2C2C2C]">⬡ {art.price}</p>
                <span className={`text-xs font-semibold flex items-center gap-0.5 justify-end ${positive ? "text-[#7C8C6E]" : "text-rose-500"}`}>
                  {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(change)}% 24h
                </span>
              </div>
            )}
          </div>

          {/* Price chart */}
          {art.price > 0 && (
            <div className="mt-4 p-4 bg-[#FAF8F5] rounded-2xl">
              <p className="text-xs text-[#9B9B9B] mb-3">Price history</p>
              <div className="flex items-end justify-between h-12 gap-1">
                {history.map((p, i) => {
                  const max = Math.max(...history);
                  const pct = (p / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: i === history.length - 1 ? (positive ? "#7C8C6E" : "#E07B6A") : "#EDE9E3",
                          minHeight: "4px",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-[#9B9B9B]">7d ago</span>
                <span className="text-[10px] text-[#9B9B9B]">Now</span>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1 bg-[#FAF8F5] rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-[#2C2C2C]">{trades.length}</p>
              <p className="text-[10px] text-[#9B9B9B]">Trades</p>
            </div>
            <div className="flex-1 bg-[#FAF8F5] rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-[#2C2C2C]">{art.like_count || 0}</p>
              <p className="text-[10px] text-[#9B9B9B]">Likes</p>
            </div>
            <div className="flex-1 bg-[#FAF8F5] rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-[#2C2C2C] truncate">{isOwner ? "You" : art.owner_name}</p>
              <p className="text-[10px] text-[#9B9B9B]">Owner</p>
            </div>
          </div>

          {/* Recent activity */}
          {trades.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[#9B9B9B] mb-2">Recent Activity</p>
              <div className="space-y-1.5">
                {trades.slice(0, 3).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <span className="text-[#6B6B6B] capitalize">{t.trade_type}</span>
                    <span className="font-medium text-[#2C2C2C]">⬡ {t.price}</span>
                    <span className="text-[#9B9B9B]">{new Date(t.created_date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 space-y-2">
            {!isOwner && art.is_for_sale && (
              <Button onClick={() => onBuy(art)} className="w-full rounded-xl h-12 text-base text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
                Buy for ⬡ {art.price}
              </Button>
            )}
            {isOwner && !art.is_for_sale && (
              showSellInput ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Set price"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="rounded-xl"
                    style={{ borderColor: "var(--border-light)" }}
                  />
                  <Button onClick={() => onList(art, parseFloat(sellPrice))} className="rounded-xl px-5 text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
                    List
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowSellInput(true)} variant="outline" className="w-full rounded-xl h-12" style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)" }}>
                  List for Sale
                </Button>
              )
            )}
            {isOwner && art.is_for_sale && (
              <Button onClick={() => onSell(art)} variant="outline" className="w-full rounded-xl h-12 border-rose-300 text-rose-600">
                Remove Listing
              </Button>
            )}
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
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("market");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: artPieces = [], isLoading } = useQuery({
    queryKey: ["art"],
    queryFn: () => base44.entities.ArtPiece.list("-created_date", 50),
  });

  const marketplace = artPieces.filter((a) => a.is_for_sale || (a.price > 0));
  const gallery = artPieces;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    await base44.entities.ArtPiece.create({
      title: title.trim(), description: description.trim(), image_url: file_url,
      creator_email: user?.email || "", creator_name: user?.full_name || "Artist",
      owner_email: user?.email || "", owner_name: user?.full_name || "Artist",
      price: parseFloat(price) || 0, is_for_sale: parseFloat(price) > 0, like_count: 0,
    });
    setTitle(""); setDescription(""); setPrice(""); setSelectedFile(null); setPreviewUrl(null);
    setShowUpload(false); setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["art"] });
  };

  const handleBuy = async (art) => {
    if (!user) return;
    const balance = await getBalance(user.email);
    if (balance < art.price) { alert(`Not enough coins! You have ⬡${balance}, need ⬡${art.price}`); return; }
    await base44.entities.ArtPiece.update(art.id, {
      owner_email: user.email, owner_name: user.full_name || user.email, is_for_sale: false,
    });
    await base44.entities.ArtTrade.create({
      art_id: art.id, buyer_email: user.email, seller_email: art.owner_email, price: art.price, trade_type: "buy",
    });
    // Deduct from buyer, credit seller
    await addCoins(user.email, -art.price, "art_purchase", `Bought "${art.title}"`, art.id);
    if (art.owner_email) await addCoins(art.owner_email, art.price, "art_sale", `Sold "${art.title}"`, art.id);
    setSelectedArt(null);
    queryClient.invalidateQueries({ queryKey: ["art"] });
  };

  const handleList = async (art, price) => {
    await base44.entities.ArtPiece.update(art.id, { price, is_for_sale: true });
    await base44.entities.ArtTrade.create({ art_id: art.id, seller_email: user.email, price, trade_type: "list" });
    setSelectedArt(null);
    queryClient.invalidateQueries({ queryKey: ["art"] });
  };

  const handleDelist = async (art) => {
    await base44.entities.ArtPiece.update(art.id, { is_for_sale: false });
    setSelectedArt(null);
    queryClient.invalidateQueries({ queryKey: ["art"] });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Art Market</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Trade digital art with coins</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="p-2.5 rounded-full text-white shadow-sm" style={{ backgroundColor: "var(--accent-primary)" }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-5 mt-4">
        <TabsList className="rounded-xl w-full" style={{ backgroundColor: "var(--bg-card)" }}>
          <TabsTrigger value="market" className="flex-1 rounded-lg data-[state=active]:bg-white text-sm">Market</TabsTrigger>
          <TabsTrigger value="gallery" className="flex-1 rounded-lg data-[state=active]:bg-white text-sm">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="mt-4 pb-24">
          {isLoading ? (
            <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[#7C8C6E] border-t-transparent rounded-full animate-spin" /></div>
          ) : marketplace.length === 0 ? (
            <div className="text-center py-16"><p className="text-4xl mb-3">📈</p><p className="text-sm text-[#9B9B9B]">No art listed yet. Upload and set a price.</p></div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {marketplace.map((art) => (
                <ArtTradingCard key={art.id} art={art} user={user} onClick={() => setSelectedArt(art)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="mt-4 pb-24">
          {isLoading ? (
            <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[#7C8C6E] border-t-transparent rounded-full animate-spin" /></div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-16"><p className="text-4xl mb-3">🎨</p><p className="text-sm text-[#9B9B9B]">No art yet.</p></div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((art) => (
                <ArtTradingCard key={art.id} art={art} user={user} onClick={() => setSelectedArt(art)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Art detail modal */}
      <AnimatePresence>
        {selectedArt && (
          <ArtDetailModal
            art={selectedArt}
            user={user}
            onClose={() => setSelectedArt(null)}
            onBuy={handleBuy}
            onSell={handleDelist}
            onList={handleList}
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
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#EDE9E3] rounded-xl cursor-pointer hover:border-[#7C8C6E] transition-colors">
                <Upload className="w-8 h-8 text-[#9B9B9B] mb-2" />
                <span className="text-sm text-[#9B9B9B]">Tap to upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
            )}
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border-[#EDE9E3] rounded-xl" />
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="border-[#EDE9E3] rounded-xl resize-none" />
            <Input type="number" placeholder="Starting price in coins (0 = not for sale)" value={price} onChange={(e) => setPrice(e.target.value)} className="border-[#EDE9E3] rounded-xl" />
            <Button onClick={handleUpload} disabled={!selectedFile || !title.trim() || uploading} className="w-full bg-[#7C8C6E] hover:bg-[#6B7B5E] rounded-xl">
              {uploading ? "Uploading..." : "Publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}