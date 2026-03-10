import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare, Heart, Zap } from "lucide-react";

export default function CreatorsTabNew() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: creatorApps = [] } = useQuery({
    queryKey: ["approvedCreators"],
    queryFn: () => base44.entities.CreatorApplication.filter({ status: "approved" }, "-created_date"),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  // Match creators with users
  const creatorsWithUserData = creatorApps.map((app) => ({
    ...app,
    user: users.find((u) => u.email === app.user_email),
  }));

  // Filter by category if selected
  const filteredCreators = selectedCategory
    ? creatorsWithUserData.filter((c) => c.creator_category === selectedCategory)
    : creatorsWithUserData;

  const categories = [
    "musician",
    "designer",
    "freelancer",
    "developer",
    "business_owner",
    "artist",
    "writer",
    "educator",
    "photographer",
  ];

  const categoryEmojis = {
    musician: "🎵",
    designer: "🎨",
    freelancer: "💼",
    developer: "💻",
    business_owner: "📊",
    artist: "🖼️",
    writer: "✍️",
    educator: "📚",
    photographer: "📷",
  };

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Category Filter */}
      <div>
        <p className="text-xs font-semibold mb-3 uppercase" style={{ color: "var(--text-hint)" }}>
          Filter by Category
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              !selectedCategory ? "text-white" : "text-gray-700"
            }`}
            style={{
              backgroundColor: !selectedCategory ? "var(--accent-primary)" : "var(--bg-card)",
              border: !selectedCategory ? "none" : "1px solid var(--border-light)",
            }}
          >
            All Creators
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat ? "text-white" : "text-gray-700"
              }`}
              style={{
                backgroundColor: selectedCategory === cat ? "var(--accent-primary)" : "var(--bg-card)",
                border: selectedCategory === cat ? "none" : "1px solid var(--border-light)",
              }}
            >
              {categoryEmojis[cat]} {cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Creators Grid */}
      {filteredCreators.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: "var(--text-hint)" }}>No creators found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredCreators.map((creator) => (
            <Link
              key={creator.id}
              to={createPageUrl(`CreatorProfile?email=${creator.user_email}`)}
              className="rounded-2xl p-4 text-center transition-all hover:shadow-lg"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-light)",
              }}
            >
              {/* Avatar */}
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-md"
                style={{
                  backgroundColor: "var(--bg-app)",
                  color: "var(--accent-primary)",
                  border: "2px solid var(--accent-primary-light)",
                }}
              >
                {creator.user?.avatar_url ? (
                  <img
                    src={creator.user.avatar_url}
                    alt={creator.user_name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  creator.user_name?.[0]?.toUpperCase()
                )}
              </div>

              {/* Name */}
              <h3 className="font-bold text-sm mb-1 line-clamp-2" style={{ color: "var(--text-primary)" }}>
                {creator.user_name}
              </h3>

              {/* Category */}
              <p className="text-xs mb-2" style={{ color: "var(--accent-primary)" }}>
                {categoryEmojis[creator.creator_category]} {creator.creator_category.replace("_", " ")}
              </p>

              {/* Description Preview */}
              <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: "var(--text-hint)" }}>
                {creator.description}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = createPageUrl(`Messages?email=${creator.user_email}`);
                  }}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: "var(--accent-primary-light)",
                    color: "var(--accent-primary)",
                  }}
                >
                  <MessageSquare className="w-3 h-3 mx-auto" />
                </button>
                <button
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <Heart className="w-3 h-3 mx-auto" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}