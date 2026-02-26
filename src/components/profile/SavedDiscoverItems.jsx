import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Trash2, ExternalLink, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const ITEM_TYPE_LABELS = {
  app: { label: "Apps", emoji: "🛠" },
  service_person: { label: "People", emoji: "👤" },
};

export default function SavedDiscoverItems({ user }) {
  const [activeType, setActiveType] = useState("all");
  const qc = useQueryClient();

  const { data: collections = [], isLoading: loadingCollections } = useQuery({
    queryKey: ["myCollections", user?.email],
    queryFn: () => base44.entities.UserCollection.filter({ owner_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: allItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["collectionAll", user?.email],
    queryFn: () => base44.entities.CollectionItem.filter({ owner_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId) => base44.entities.CollectionItem.delete(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collectionAll", user?.email] });
      qc.invalidateQueries({ queryKey: ["collectionItems", user?.email] });
    },
  });

  const isLoading = loadingCollections || loadingItems;

  const filtered = activeType === "all"
    ? allItems
    : allItems.filter(i => i.item_type === activeType);

  // Group by collection
  const byCollection = {};
  collections.forEach(c => { byCollection[c.id] = { ...c, items: [] }; });
  filtered.forEach(item => {
    if (byCollection[item.collection_id]) {
      byCollection[item.collection_id].items.push(item);
    }
  });
  const collectionsWithItems = Object.values(byCollection).filter(c => c.items.length > 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {[["all", "All", "📌"], ...Object.entries(ITEM_TYPE_LABELS).map(([k, v]) => [k, v.label, v.emoji])].map(([val, label, emoji]) => (
          <button key={val} onClick={() => setActiveType(val)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all"
            style={{
              backgroundColor: activeType === val ? "var(--accent-primary)" : "var(--bg-card)",
              color: activeType === val ? "#fff" : "var(--text-secondary)",
              borderColor: activeType === val ? "var(--accent-primary)" : "var(--border-light)",
            }}>
            {emoji} {label}
          </button>
        ))}
      </div>

      {allItems.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Nothing saved yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Tap the bookmark icon on any app or service in Discover</p>
          <Link to={createPageUrl("Discover")}
            className="inline-block mt-4 px-4 py-2 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            Go to Discover
          </Link>
        </div>
      ) : collectionsWithItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No saved items match this filter</p>
        </div>
      ) : (
        <div className="space-y-5">
          {collectionsWithItems.map(coll => (
            <div key={coll.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{coll.emoji}</span>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{coll.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                  {coll.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {coll.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                    {item.item_image_url ? (
                      <img src={item.item_image_url} alt={item.item_title}
                        className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base"
                        style={{ backgroundColor: "var(--bg-subtle)" }}>
                        {ITEM_TYPE_LABELS[item.item_type]?.emoji || "📌"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.item_title}</p>
                      {item.item_subtitle && (
                        <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{item.item_subtitle}</p>
                      )}
                      {item.notes && (
                        <p className="text-xs mt-0.5 italic truncate" style={{ color: "var(--text-secondary)" }}>"{item.notes}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link to={createPageUrl("Discover")}
                        className="p-1.5 rounded-lg"
                        style={{ color: "var(--text-hint)", backgroundColor: "var(--bg-subtle)" }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => removeMutation.mutate(item.id)}
                        className="p-1.5 rounded-lg"
                        style={{ color: "#E05C7A", backgroundColor: "rgba(224,92,122,0.08)" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link to full collections page */}
      {allItems.length > 0 && (
        <Link to={createPageUrl("Collections")}
          className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium border"
          style={{ color: "var(--accent-primary)", borderColor: "var(--border-light)", backgroundColor: "var(--accent-primary-light)" }}>
          <FolderOpen className="w-4 h-4" />
          Manage All Collections
        </Link>
      )}
    </div>
  );
}