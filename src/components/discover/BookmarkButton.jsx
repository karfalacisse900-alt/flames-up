import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bookmark, Plus, X, Check } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function BookmarkButton({ user, itemType, itemId, itemTitle, itemSubtitle, itemImageUrl, size = "sm" }) {
  const [open, setOpen] = useState(false);
  const [newCollName, setNewCollName] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: collections = [] } = useQuery({
    queryKey: ["myCollections", user?.email],
    queryFn: () => base44.entities.UserCollection.filter({ owner_email: user.email }, "-created_date"),
    enabled: !!user?.email && open,
  });

  const { data: savedInCollections = [] } = useQuery({
    queryKey: ["collectionItems", user?.email, itemId],
    queryFn: () => base44.entities.CollectionItem.filter({ owner_email: user.email, item_id: itemId }),
    enabled: !!user?.email,
  });

  const isSaved = savedInCollections.length > 0;

  const handleSave = async (collectionId, collectionName) => {
    if (saving) return;
    const alreadyIn = savedInCollections.find(ci => ci.collection_id === collectionId);
    setSaving(true);
    if (alreadyIn) {
      await base44.entities.CollectionItem.delete(alreadyIn.id);
    } else {
      await base44.entities.CollectionItem.create({
        collection_id: collectionId,
        owner_email: user.email,
        item_type: itemType,
        item_id: itemId,
        item_title: itemTitle,
        item_subtitle: itemSubtitle || "",
        item_image_url: itemImageUrl || "",
      });
    }
    qc.invalidateQueries({ queryKey: ["collectionItems", user?.email, itemId] });
    qc.invalidateQueries({ queryKey: ["collectionAll", user?.email] });
    setSaving(false);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!newCollName.trim()) return;
    setCreating(true);
    const coll = await base44.entities.UserCollection.create({ owner_email: user.email, name: newCollName.trim(), emoji: "📌" });
    await handleSave(coll.id, coll.name);
    setNewCollName("");
    setCreating(false);
  };

  if (!user) return null;

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "p-1.5" : "p-2";

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`${btnSize} rounded-full transition-colors`}
        style={{ backgroundColor: isSaved ? "#EEF3F0" : "rgba(255,255,255,0.85)", color: isSaved ? "#3C6E5A" : "#A8A8A8" }}
        title="Save to collection"
      >
        <Bookmark className={iconSize} fill={isSaved ? "#3C6E5A" : "none"} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              className="absolute right-0 top-8 z-50 w-64 rounded-2xl shadow-xl overflow-hidden"
              style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}
            >
              <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: "#E5DFD0" }}>
                <p className="text-xs font-semibold" style={{ color: "#2F2F2F" }}>Save to collection</p>
                <button onClick={() => setOpen(false)}><X className="w-3.5 h-3.5" style={{ color: "#A8A8A8" }} /></button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {collections.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: "#A8A8A8" }}>No collections yet</p>
                )}
                {collections.map(c => {
                  const inThis = savedInCollections.some(ci => ci.collection_id === c.id);
                  return (
                    <button key={c.id} onClick={() => handleSave(c.id, c.name)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#EEF3F0] transition-colors">
                      <span className="text-base">{c.emoji}</span>
                      <span className="flex-1 text-xs font-medium" style={{ color: "#2F2F2F" }}>{c.name}</span>
                      {inThis && <Check className="w-3.5 h-3.5" style={{ color: "#3C6E5A" }} />}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 border-t" style={{ borderColor: "#E5DFD0" }}>
                <div className="flex gap-1.5">
                  <input
                    value={newCollName}
                    onChange={e => setNewCollName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    placeholder="New collection…"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-xl outline-none"
                    style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }}
                  />
                  <button onClick={handleCreate} disabled={!newCollName.trim() || creating}
                    className="p-1.5 rounded-xl text-white disabled:opacity-40"
                    style={{ backgroundColor: "#3C6E5A" }}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}