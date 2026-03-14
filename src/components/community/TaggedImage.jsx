import React, { useState } from "react";
import { MapPin, ShoppingBag, Coffee, Book, Smartphone, Tag as TagIcon, ExternalLink } from "lucide-react";

const TAG_CATEGORIES = [
  { value: "product", icon: ShoppingBag, color: "#4F46E5" },
  { value: "place", icon: MapPin, color: "#2E6B4F" },
  { value: "food", icon: Coffee, color: "#F97316" },
  { value: "book", icon: Book, color: "#7C69C4" },
  { value: "gadget", icon: Smartphone, color: "#2563EB" },
  { value: "brand", icon: TagIcon, color: "#DC2626" },
  { value: "other", icon: TagIcon, color: "#64748B" },
];

export default function TaggedImage({ imageUrl, tags = [], aspectRatio = "4/5" }) {
  const [selectedTag, setSelectedTag] = useState(null);

  if (!tags || tags.length === 0) {
    return (
      <div className="w-full relative overflow-hidden rounded-2xl" style={{ aspectRatio }}>
        <img src={imageUrl} alt="Post" className="w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }

  const getCategoryConfig = (category) => {
    return TAG_CATEGORIES.find(c => c.value === category) || TAG_CATEGORIES[TAG_CATEGORIES.length - 1];
  };

  return (
    <div className="w-full relative overflow-hidden rounded-2xl" style={{ aspectRatio }}>
      <img src={imageUrl} alt="Post" className="w-full h-full object-cover" loading="lazy" />

      {/* Tag markers */}
      {tags.map(tag => {
        const config = getCategoryConfig(tag.category);
        const Icon = config.icon;
        const isSelected = selectedTag?.id === tag.id;

        return (
          <button
            key={tag.id}
            onClick={() => setSelectedTag(isSelected ? null : tag)}
            className="absolute transition-all"
            style={{
              left: `${tag.position.x}%`,
              top: `${tag.position.y}%`,
              transform: isSelected ? "translate(-50%, -50%) scale(1.2)" : "translate(-50%, -50%)",
            }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: config.color,
                border: "2px solid white",
                boxShadow: isSelected ? "0 4px 16px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
              }}>
              <Icon className="w-3.5 h-3.5" style={{ color: "white" }} />
            </div>
          </button>
        );
      })}

      {/* Tag info popup */}
      {selectedTag && (
        <>
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedTag(null)}
          />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 rounded-2xl p-4 z-10"
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>
            <div className="flex items-start gap-3 mb-3">
              {React.createElement(getCategoryConfig(selectedTag.category).icon, {
                className: "w-6 h-6 shrink-0",
                style: { color: getCategoryConfig(selectedTag.category).color }
              })}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>
                  {selectedTag.name}
                </h4>
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                  {TAG_CATEGORIES.find(c => c.value === selectedTag.category)?.value.replace(/_/g, " ").toUpperCase()}
                </p>
              </div>
            </div>

            {selectedTag.description && (
              <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {selectedTag.description}
              </p>
            )}

            <div className="flex gap-2">
              {selectedTag.link && (
                <a
                  href={selectedTag.link.startsWith("http") ? selectedTag.link : `https://www.google.com/search?q=${encodeURIComponent(selectedTag.link)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: getCategoryConfig(selectedTag.category).color,
                    color: "white",
                  }}>
                  <ExternalLink className="w-4 h-4" />
                  Explore
                </a>
              )}
              <button
                onClick={() => setSelectedTag(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--text-primary)",
                }}>
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}