import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Star, Filter, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const CATEGORIES = [
  { id: null, label: "All Creators", emoji: "⭐" },
  { id: "musician", label: "Musicians", emoji: "🎵" },
  { id: "designer", label: "Designers", emoji: "🎨" },
  { id: "freelancer", label: "Freelancers", emoji: "💼" },
  { id: "developer", label: "Developers", emoji: "💻" },
  { id: "business_owner", label: "Business Owners", emoji: "🏪" },
  { id: "artist", label: "Artists", emoji: "🖼️" },
  { id: "writer", label: "Writers", emoji: "✍️" },
  { id: "educator", label: "Educators", emoji: "📚" },
  { id: "photographer", label: "Photographers", emoji: "📸" },
];

export default function CreatorsTab() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["creators"],
    queryFn: () => base44.entities.User.filter({ is_creator: true }, "-created_date", 100),
  });

  const filtered = useMemo(() => {
    return selectedCategory ? users.filter((u) => u.creator_category === selectedCategory) : users;
  }, [users, selectedCategory]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading creators...</div>;
  }

  return (
    <div className="pb-20">
      {/* Category Filter */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={String(cat.id)}
              onClick={() => setSelectedCategory(cat.id)}
              className="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap"
              style={{
                backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          );
        })}
      </div>

      {/* Creators Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-3xl mb-3">🌟</p>
          <p style={{ color: "var(--text-hint)" }}>No creators in this category yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
          {filtered.map((creator) => (
            <Link
              key={creator.id}
              to={createPageUrl(`UserProfile?email=${creator.email}`)}
              className="rounded-2xl p-4 border cursor-pointer transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
            >
              <div className="flex items-start gap-3">
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt={creator.full_name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
                  >
                    {creator.full_name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-bold truncate" style={{ color: "var(--text-primary)" }}>
                      {creator.full_name}
                    </p>
                    <span style={{ fontSize: "14px" }}>⭐</span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                    {CATEGORIES.find((c) => c.id === creator.creator_category)?.label || creator.creator_category}
                  </p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {creator.creator_bio}
                  </p>
                  {creator.creator_links && Object.keys(creator.creator_links).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {Object.keys(creator.creator_links)
                        .slice(0, 2)
                        .map((platform) => (
                          <span key={platform} className="text-[9px] px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                            {platform}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}