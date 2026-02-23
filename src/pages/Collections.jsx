import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Bookmark, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

function CollectionItemCard({ item, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
      {item.item_image_url ? (
        <img src={item.item_image_url} alt={item.item_title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
          {item.item_title?.[0]?.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.item_title}</p>
        {item.item_subtitle && <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-hint)" }}>{item.item_subtitle}</p>}
        <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block capitalize"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
          {item.item_type === "app" ? "App" : "Service Person"}
        </span>
      </div>
      <button onClick={() => onRemove(item.id)} className="p-1.5 rounded-full transition-colors" style={{ color: "var(--text-hint)" }}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CollectionDetail({ collection, user, onBack, onDelete }) {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["collectionItems", collection.id],
    queryFn: () => base44.entities.CollectionItem.filter({ collection_id: collection.id }, "-created_date"),
  });

  const handleRemoveItem = async (id) => {
    await base44.entities.CollectionItem.delete(id);
    qc.invalidateQueries({ queryKey: ["collectionItems", collection.id] });
  };

  const handleDeleteCollection = async () => {
    for (const item of items) await base44.entities.CollectionItem.delete(item.id);
    await base44.entities.UserCollection.delete(collection.id);
    qc.invalidateQueries({ queryKey: ["myCollections", user?.email] });
    onDelete();
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b" style={{ backgroundColor: "var(--bg-nav)", borderColor: "var(--border-light)" }}>
        <button onClick={onBack} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>
        <span className="text-xl">{collection.emoji}</span>
        <h2 className="font-semibold flex-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{collection.name}</h2>
        <button onClick={handleDeleteCollection} className="p-2 rounded-full transition-colors" style={{ color: "var(--text-hint)" }}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="px-5 mt-4">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border-medium)" }} />
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No items saved yet</p>
          </div>
        ) : (
          <div className="rounded-2xl px-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            {items.map(item => (
              <CollectionItemCard key={item.id} item={item} onRemove={handleRemoveItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Collections() {
  const [user, setUser] = useState(null);
  const [activeCollection, setActiveCollection] = useState(null);
  const [newName, setNewName] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: collections = [] } = useQuery({
    queryKey: ["myCollections", user?.email],
    queryFn: () => base44.entities.UserCollection.filter({ owner_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["collectionAll", user?.email],
    queryFn: () => base44.entities.CollectionItem.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await base44.entities.UserCollection.create({ owner_email: user.email, name: newName.trim(), emoji: "📌" });
    qc.invalidateQueries({ queryKey: ["myCollections", user?.email] });
    setNewName(""); setShowNew(false); setCreating(false);
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3C6E5A", borderTopColor: "transparent" }} />
    </div>
  );

  if (activeCollection) {
    return <CollectionDetail collection={activeCollection} user={user} onBack={() => setActiveCollection(null)} onDelete={() => setActiveCollection(null)} />;
  }

  const getCount = (collId) => allItems.filter(i => i.collection_id === collId).length;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F5F2E8" }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b" style={{ backgroundColor: "#FAF7F0", borderColor: "#E5DFD0" }}>
        <Link to={createPageUrl("Profile")} className="p-2 rounded-full" style={{ backgroundColor: "#EDE9E3" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#6E6E6E" }} />
        </Link>
        <h2 className="font-semibold flex-1" style={{ fontFamily: "var(--font-serif)", color: "#2F2F2F" }}>My Collections</h2>
        <button onClick={() => setShowNew(s => !s)}
          className="p-2 rounded-full text-white"
          style={{ backgroundColor: "#3C6E5A" }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 mt-4 space-y-3">
        {showNew && (
          <div className="rounded-2xl p-3 flex gap-2" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Collection name…"
              autoFocus
              className="flex-1 text-sm px-3 py-1.5 rounded-xl outline-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }}
            />
            <button onClick={handleCreate} disabled={!newName.trim() || creating}
              className="px-4 py-1.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#3C6E5A" }}>
              Create
            </button>
          </div>
        )}

        {collections.length === 0 && !showNew ? (
          <div className="text-center py-16">
            <Bookmark className="w-12 h-12 mx-auto mb-4" style={{ color: "#DAD3C4" }} />
            <p className="text-base font-semibold" style={{ color: "#6E6E6E" }}>No collections yet</p>
            <p className="text-sm mt-1" style={{ color: "#A8A8A8" }}>Tap + to create your first collection</p>
          </div>
        ) : (
          collections.map(c => (
            <button key={c.id} onClick={() => setActiveCollection(c)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:shadow-sm"
              style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "#2F2F2F" }}>{c.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#A8A8A8" }}>{getCount(c.id)} item{getCount(c.id) !== 1 ? "s" : ""}</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "#A8A8A8" }} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}