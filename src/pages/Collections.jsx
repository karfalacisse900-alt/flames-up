import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Bookmark, ChevronRight, Tag, StickyNote, X, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

function CollectionItemCard({ item, onRemove, onUpdate }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const handleSaveNotes = () => {
    onUpdate(item.id, { notes });
    setEditingNotes(false);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const tags = [...(item.tags || []), newTag.trim()];
    onUpdate(item.id, { tags });
    setNewTag("");
    setShowTagInput(false);
  };

  const handleRemoveTag = (tag) => {
    const tags = (item.tags || []).filter(t => t !== tag);
    onUpdate(item.id, { tags });
  };

  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="flex items-start gap-3">
        {item.item_image_url ?
          <img src={item.item_image_url} alt={item.item_title} className="w-10 h-10 rounded-xl object-cover shrink-0" /> :
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
            style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            {item.item_title?.[0]?.toUpperCase()}
          </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.item_title}</p>
          {item.item_subtitle && <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-hint)" }}>{item.item_subtitle}</p>}
          <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block capitalize"
            style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            {item.item_type === "app" ? "App" : "Service Person"}
          </span>

          {/* Tags */}
          {(item.tags?.length > 0 || showTagInput) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(item.tags || []).map(tag => (
                <span key={tag} className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-0.5">
                    <X className="w-2.5 h-2.5" style={{ color: "var(--text-hint)" }} />
                  </button>
                </span>
              ))}
              {showTagInput && (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleAddTag(); if (e.key === "Escape") setShowTagInput(false); }}
                    placeholder="tag…"
                    className="text-[10px] px-2 py-0.5 rounded-full outline-none w-20"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--accent-primary)", color: "var(--text-primary)" }}
                  />
                  <button onClick={handleAddTag} className="p-0.5" style={{ color: "var(--accent-primary)" }}><Check className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {editingNotes ? (
            <div className="mt-2">
              <textarea
                autoFocus
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Add a note…"
                className="w-full text-xs px-2 py-1.5 rounded-lg outline-none resize-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--accent-primary)", color: "var(--text-primary)" }}
              />
              <div className="flex gap-2 mt-1">
                <button onClick={handleSaveNotes} className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "var(--accent-primary)" }}>Save</button>
                <button onClick={() => setEditingNotes(false)} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>Cancel</button>
              </div>
            </div>
          ) : item.notes ? (
            <p className="text-[11px] mt-1.5 italic cursor-pointer" style={{ color: "var(--text-hint)" }} onClick={() => setEditingNotes(true)}>
              📝 {item.notes}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button onClick={() => onRemove(item.id)} className="p-1.5 rounded-full" style={{ color: "var(--text-hint)" }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowTagInput(s => !s)} className="p-1.5 rounded-full" style={{ color: "var(--text-hint)" }}>
            <Tag className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setEditingNotes(s => !s)} className="p-1.5 rounded-full" style={{ color: "var(--text-hint)" }}>
            <StickyNote className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectionDetail({ collection, user, onBack, onDelete }) {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["collectionItems", collection.id],
    queryFn: () => base44.entities.CollectionItem.filter({ collection_id: collection.id }, "-created_date")
  });

  const handleRemoveItem = async (id) => {
    await base44.entities.CollectionItem.delete(id);
    qc.invalidateQueries({ queryKey: ["collectionItems", collection.id] });
  };

  const handleUpdateItem = async (id, data) => {
    await base44.entities.CollectionItem.update(id, data);
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
        {items.length === 0 ?
        <div className="text-center py-16">
            <Bookmark className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border-medium)" }} />
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No items saved yet</p>
          </div> :

        <div className="rounded-2xl px-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            {items.map((item) =>
          <CollectionItemCard key={item.id} item={item} onRemove={handleRemoveItem} />
          )}
          </div>
        }
      </div>
    </div>);

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
    enabled: !!user?.email
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["collectionAll", user?.email],
    queryFn: () => base44.entities.CollectionItem.filter({ owner_email: user.email }),
    enabled: !!user?.email
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await base44.entities.UserCollection.create({ owner_email: user.email, name: newName.trim(), emoji: "📌" });
    qc.invalidateQueries({ queryKey: ["myCollections", user?.email] });
    setNewName("");setShowNew(false);setCreating(false);
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>);


  if (activeCollection) {
    return <CollectionDetail collection={activeCollection} user={user} onBack={() => setActiveCollection(null)} onDelete={() => setActiveCollection(null)} />;
  }

  const getCount = (collId) => allItems.filter((i) => i.collection_id === collId).length;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b" style={{ backgroundColor: "var(--bg-nav)", borderColor: "var(--border-light)" }}>
        <Link to={createPageUrl("Profile")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </Link>
        <h2 className="font-semibold flex-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>My Collections</h2>
        <button onClick={() => setShowNew((s) => !s)}
        className="p-2 rounded-full text-white"
        style={{ backgroundColor: "var(--accent-primary)" }}>
          <Plus className="bg-green-900 lucide lucide-plus w-4 h-4" />
        </button>
      </div>

      <div className="px-5 mt-4 space-y-3">
        {showNew &&
        <div className="rounded-2xl p-3 flex gap-2" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Collection name…"
            autoFocus
            className="flex-1 text-sm px-3 py-1.5 rounded-xl outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

            <button onClick={handleCreate} disabled={!newName.trim() || creating}
          className="px-4 py-1.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-primary)" }}>
              Create
            </button>
          </div>
        }

        {collections.length === 0 && !showNew ?
        <div className="text-center py-16">
            <Bookmark className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--border-medium)" }} />
            <p className="text-base font-semibold" style={{ color: "var(--text-secondary)" }}>No collections yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-hint)" }}>Tap + to create your first collection</p>
          </div> :

        collections.map((c) =>
        <button key={c.id} onClick={() => setActiveCollection(c)}
        className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:shadow-sm"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{getCount(c.id)} item{getCount(c.id) !== 1 ? "s" : ""}</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            </button>
        )
        }
      </div>
    </div>);

}