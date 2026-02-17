import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ShoppingBag, Heart, Coins, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function Art() {
  const [user, setUser] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("gallery");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: artPieces = [], isLoading } = useQuery({
    queryKey: ["art"],
    queryFn: () => base44.entities.ArtPiece.list("-created_date", 50),
  });

  const gallery = artPieces;
  const marketplace = artPieces.filter((a) => a.is_for_sale);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    await base44.entities.ArtPiece.create({
      title: title.trim(),
      description: description.trim(),
      image_url: file_url,
      creator_email: user?.email || "",
      creator_name: user?.full_name || "Artist",
      owner_email: user?.email || "",
      owner_name: user?.full_name || "Artist",
      price: parseFloat(price) || 0,
      is_for_sale: parseFloat(price) > 0,
      like_count: 0,
    });
    setTitle("");
    setDescription("");
    setPrice("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowUpload(false);
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["art"] });
  };

  const handleBuy = async (art) => {
    if (!user) return;
    await base44.entities.ArtPiece.update(art.id, {
      owner_email: user.email,
      owner_name: user.full_name,
      is_for_sale: false,
    });
    queryClient.invalidateQueries({ queryKey: ["art"] });
  };

  const ArtCard = ({ art, showPrice }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden border border-[#EDE9E3] hover:shadow-md transition-shadow"
    >
      <div className="aspect-square overflow-hidden">
        <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm text-[#2C2C2C] truncate">{art.title}</h3>
        <p className="text-xs text-[#9B9B9B] mt-0.5">{art.creator_name}</p>
        {showPrice && art.is_for_sale && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-medium text-[#7C8C6E] flex items-center gap-1">
              <Coins className="w-3 h-3" /> {art.price} coins
            </span>
            {art.owner_email !== user?.email && (
              <Button size="sm" onClick={() => handleBuy(art)} className="h-7 text-xs bg-[#7C8C6E] hover:bg-[#6B7B5E] rounded-lg">
                Buy
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>Art</h1>
          <p className="text-xs text-[#9B9B9B] mt-0.5">Create, collect & trade</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="p-2.5 rounded-full bg-[#7C8C6E] text-white shadow-md hover:bg-[#6B7B5E] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-5">
        <TabsList className="bg-[#F5F0EB] rounded-xl w-full">
          <TabsTrigger value="gallery" className="flex-1 rounded-lg data-[state=active]:bg-white">Gallery</TabsTrigger>
          <TabsTrigger value="marketplace" className="flex-1 rounded-lg data-[state=active]:bg-white">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-4 pb-24">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#7C8C6E] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🎨</p>
              <p className="text-sm text-[#9B9B9B]">No art yet. Be the first creator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((art) => <ArtCard key={art.id} art={art} showPrice={false} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="mt-4 pb-24">
          {marketplace.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🛍️</p>
              <p className="text-sm text-[#9B9B9B]">No art for sale yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {marketplace.map((art) => <ArtCard key={art.id} art={art} showPrice={true} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
                <button
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full text-xs"
                >✕</button>
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
            <Input type="number" placeholder="Price in coins (0 = not for sale)" value={price} onChange={(e) => setPrice(e.target.value)} className="border-[#EDE9E3] rounded-xl" />
            <Button onClick={handleUpload} disabled={!selectedFile || !title.trim() || uploading} className="w-full bg-[#7C8C6E] hover:bg-[#6B7B5E] rounded-xl">
              {uploading ? "Uploading..." : "Publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}