import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const LIST_TABS = [
  { key: "watchlist", label: "Watchlist", emoji: "🎬" },
  { key: "reading_list", label: "Reading List", emoji: "📚" },
  { key: "wishlist", label: "Wishlist", emoji: "🎮" },
  { key: "playlist", label: "Playlist", emoji: "🎵" },
];

export default function SavedMediaTab({ user }) {
  const [activeList, setActiveList] = useState("watchlist");
  const qc = useQueryClient();

  const { data: saves = [] } = useQuery({
    queryKey: ["mediaSaves", user?.email],
    queryFn: () => base44.entities.MediaSave.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const removeMut = useMutation({
    mutationFn: (id) => base44.entities.MediaSave.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mediaSaves", user?.email] }),
  });

  const filtered = saves.filter((s) => s.list_name === activeList);

  const TYPE_EMOJI = { movie: "🎬", show: "📺", book: "📚", game: "🎮", music: "🎵" };

  return (
    <div className="pb-4">
      {/* List tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
        {LIST_TABS.map((tab) => {
          const count = saves.filter((s) => s.list_name === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveList(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all active:scale-95 shrink-0"
              style={{
                backgroundColor: activeList === tab.key ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeList === tab.key ? "#fff" : "var(--text-secondary)",
                borderColor: activeList === tab.key ? "var(--accent-primary)" : "var(--border-light)",
              }}
            >
              {tab.emoji} {tab.label}
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-0.5"
                  style={{ backgroundColor: activeList === tab.key ? "rgba(255,255,255,0.25)" : "var(--bg-subtle)", color: activeList === tab.key ? "#fff" : "var(--text-hint)" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Bookmark className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border-medium)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Nothing saved here yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Browse Media in Discover to save items</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: "var(--bg-subtle)" }}>
                {TYPE_EMOJI[item.media_type] || "🎭"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.item_title}</p>
                {item.media_type && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize mt-0.5 inline-block"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                    {item.media_type}
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
      )}
    </div>
  );
}