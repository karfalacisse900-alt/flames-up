import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Film, BookOpen, Music, ShoppingBag, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LISTS = [
  { key: "watchlist",    label: "Watchlist",     icon: Film,       color: "#3C6E5A", bg: "#E8F2EC" },
  { key: "reading_list", label: "Reading List",  icon: BookOpen,   color: "#7C69C4", bg: "#F0EEF8" },
  { key: "playlist",     label: "Playlist",      icon: Music,      color: "#4A7FC1", bg: "#F0F5FE" },
  { key: "wishlist",     label: "Wishlist",      icon: ShoppingBag, color: "#D98B62", bg: "#FFF3E8" },
];

const MEDIA_TYPE_EMOJI = { movie: "🎬", show: "📺", book: "📚", game: "🎮", music: "🎵" };

export default function SavedMediaLists({ user }) {
  const [activeList, setActiveList] = useState("watchlist");
  const qc = useQueryClient();

  const { data: allSaves = [], isLoading } = useQuery({
    queryKey: ["mediaSaves", user?.email],
    queryFn: () => base44.entities.MediaSave.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const removeMut = useMutation({
    mutationFn: (id) => base44.entities.MediaSave.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mediaSaves", user?.email] }),
  });

  const activeListConfig = LISTS.find(l => l.key === activeList);
  const items = allSaves.filter(s => s.list_name === activeList);

  return (
    <div>
      {/* List tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
        {LISTS.map(list => {
          const Icon = list.icon;
          const count = allSaves.filter(s => s.list_name === list.key).length;
          return (
            <button
              key={list.key}
              onClick={() => setActiveList(list.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border"
              style={{
                backgroundColor: activeList === list.key ? list.color : "var(--bg-card)",
                color: activeList === list.key ? "#fff" : "var(--text-secondary)",
                borderColor: activeList === list.key ? list.color : "var(--border-light)",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {list.label}
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: activeList === list.key ? "rgba(255,255,255,0.25)" : "var(--bg-subtle)", color: activeList === list.key ? "#fff" : "var(--text-hint)" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl skeleton" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          {activeListConfig && <activeListConfig.icon className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border-medium)" }} />}
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>Nothing saved to {activeListConfig?.label} yet</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {items.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: activeListConfig?.bg }}>
                  {MEDIA_TYPE_EMOJI[item.media_type] || "🎭"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.item_title}</p>
                  {item.media_type && (
                    <span className="text-[10px] capitalize" style={{ color: "var(--text-hint)" }}>
                      {item.media_type === "show" ? "TV Show" : item.media_type}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeMut.mutate(item.id)}
                  className="p-1.5 rounded-full transition-colors shrink-0"
                  style={{ color: "var(--text-hint)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}