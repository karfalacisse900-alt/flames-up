import React from "react";
import { Users } from "lucide-react";

const CATEGORY_GRADIENTS = {
  fitness: ["#0d9488","#16a34a"], food: ["#ea580c","#d97706"],
  travel:  ["#0284c7","#6d28d9"], tech: ["#0284c7","#0369a1"],
  art:     ["#7c3aed","#a21caf"], music: ["#db2777","#be185d"],
  gaming:  ["#16a34a","#15803d"], movies: ["#7c3aed","#4338ca"],
  sports:  ["#ea580c","#dc2626"], general: ["#64748b","#475569"],
  fitness: ["#0d9488","#16a34a"],
};

function getGrad(cat) {
  const [a, b] = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

// Derive hashtag-style tags from category and name
function getTags(group) {
  const tags = [];
  if (group.category) tags.push(group.category);
  if (group.group_type === "realworld" && group.location_city) {
    tags.push(group.location_city.toLowerCase().replace(/\s/g, ""));
  }
  // Extract keywords from name
  const words = (group.name || "").toLowerCase().split(/\s+/).filter(w => w.length > 3);
  words.slice(0, 2).forEach(w => { if (!tags.includes(w)) tags.push(w); });
  return tags.slice(0, 4);
}

export default function GroupGridCard({ group, onClick }) {
  const tags = getTags(group);

  return (
    <button
      onClick={onClick}
      className="text-left w-full"
      style={{ background: "transparent", border: "none", padding: 0 }}
    >
      {/* Cover image */}
      <div className="relative rounded-2xl overflow-hidden mb-2" style={{ aspectRatio: "4/3" }}>
        {group.cover_url ? (
          <img src={group.cover_url} alt={group.name} className="w-full h-full object-cover" />
        ) : group.logo_url ? (
          <img src={group.logo_url} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl"
            style={{ background: getGrad(group.category) }}>
            {group.emoji || "💬"}
          </div>
        )}

        {/* Member count badge */}
        {group.member_count > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}>
            <Users className="w-3 h-3" style={{ color: "#0F172A" }} />
            <span className="text-xs font-bold" style={{ color: "#0F172A" }}>
              {group.member_count > 999 ? `${(group.member_count / 1000).toFixed(1)}k` : group.member_count}
            </span>
          </div>
        )}
      </div>

      {/* Name */}
      <p className="font-bold text-sm mb-1 leading-tight truncate"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        {group.name}
      </p>

      {/* Tags */}
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-hint)" }}>
        {tags.map(t => `#${t}`).join(" ")}
      </p>
    </button>
  );
}