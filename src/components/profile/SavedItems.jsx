import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SavedItems({ user }) {
  const queryClient = useQueryClient();
  const [hoveredId, setHoveredId] = useState(null);

  const { data: savedItems = [] } = useQuery({
    queryKey: ["savedItems", user?.email],
    queryFn: () => base44.entities.SavedItem.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const handleDelete = async (itemId) => {
    if (!window.confirm("Remove this item from saved?")) return;
    await base44.entities.SavedItem.delete(itemId);
    queryClient.invalidateQueries({ queryKey: ["savedItems", user.email] });
  };

  if (savedItems.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-2xl mb-2">📌</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No saved items yet. Discover apps, books, movies, and more!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {savedItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="p-3 rounded-2xl flex gap-3 items-start transition-all"
            style={{
              backgroundColor: hoveredId === item.id ? "var(--bg-subtle)" : "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            {/* Icon/Logo */}
            {item.item_logo_url ? (
              <img
                src={item.item_logo_url}
                alt={item.item_title}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: "var(--bg-app)" }}
              >
                {item.item_category === "productivity" && "📊"}
                {item.item_category === "finance" && "💰"}
                {item.item_category === "learning" && "📚"}
                {item.item_category === "lifestyle" && "🌿"}
                {item.item_category === "entertainment" && "🎮"}
                {item.item_category === "health" && "❤️"}
                {item.item_category === "social" && "👥"}
                {item.item_category === "developer_tools" && "⚙️"}
                {!item.item_category && "✨"}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                {item.item_title}
              </p>
              {item.item_description && (
                <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                  {item.item_description}
                </p>
              )}
              {item.item_category && (
                <span
                  className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-1.5 capitalize"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--text-hint)",
                  }}
                >
                  {item.item_category.replace("_", " ")}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 shrink-0 items-center">
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-lg transition-all"
                style={{
                  color: "var(--text-hint)",
                  backgroundColor: hoveredId === item.id ? "var(--bg-app)" : "transparent",
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}