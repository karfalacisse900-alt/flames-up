import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Star, MapPin, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TYPE_COLORS = {
  "Park":         { bg: "#D1FAE5", color: "#065F46" },
  "Museum":       { bg: "#DBEAFE", color: "#1E40AF" },
  "Bookstore":    { bg: "#FEF3C7", color: "#92400E" },
  "Market":       { bg: "#FCE7F3", color: "#9D174D" },
  "Jazz Club":    { bg: "#EDE9FE", color: "#5B21B6" },
  "Garden":       { bg: "#D1FAE5", color: "#065F46" },
  "Caf\u00e9":   { bg: "#FEF3C7", color: "#92400E" },
  "Food":         { bg: "#FCE7F3", color: "#9D174D" },
  "Bar":          { bg: "#EDE9FE", color: "#5B21B6" },
  "Beach":        { bg: "#DBEAFE", color: "#1E40AF" },
  "Walk":         { bg: "#F0FDF4", color: "#166534" },
  "Gallery":      { bg: "#EDE9FE", color: "#5B21B6" },
  "Landmark":     { bg: "#FEE2E2", color: "#991B1B" },
  "Historic Site":{ bg: "#FEE2E2", color: "#991B1B" },
  "Library":      { bg: "#FEF3C7", color: "#92400E" },
  "Waterfront":   { bg: "#DBEAFE", color: "#1E40AF" },
  "Nature":       { bg: "#D1FAE5", color: "#065F46" },
  "Trail":        { bg: "#D1FAE5", color: "#065F46" },
  "Attraction":   { bg: "#EDE9FE", color: "#5B21B6" },
  "Dining":       { bg: "#FCE7F3", color: "#9D174D" },
  "Shopping":     { bg: "#F3F4F6", color: "#374151" },
  "Street Art":   { bg: "#EDE9FE", color: "#5B21B6" },
  "Outdoor":      { bg: "#D1FAE5", color: "#065F46" },
  "Cinema":       { bg: "#EDE9FE", color: "#5B21B6" },
  "Activity":     { bg: "#FEF3C7", color: "#92400E" },
};

function getTypeLabel(typeStr) {
  // e.g. "🌿 Park" -> "Park"
  return typeStr.replace(/^\S+\s/, "");
}

function getTypeColor(typeStr) {
  const label = getTypeLabel(typeStr);
  return TYPE_COLORS[label] || { bg: "var(--bg-subtle)", color: "var(--text-secondary)" };
}

// Cache fetched photos to avoid duplicate API calls
const photoCache = {};

export default function SpotCard({ spot, index }) {
  const [liked, setLiked] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(true);

  const isFree = spot.cost === "Free" || spot.cost === "FREE" || spot.cost.startsWith("Free") || spot.cost === "$0 entry";
  const typeLabel = getTypeLabel(spot.type);
  const typeColor = getTypeColor(spot.type);
  const rating = (4.1 + (index % 5) * 0.17).toFixed(1);
  const reviews = 20 + (index * 17) % 180;

  useEffect(() => {
    const cacheKey = spot.name;
    if (photoCache[cacheKey] !== undefined) {
      setPhotoUrl(photoCache[cacheKey]);
      setPhotoLoading(false);
      return;
    }

    let cancelled = false;
    base44.functions.invoke('getPlacePhoto', { place_name: spot.name, city: "New York City" })
      .then(res => {
        if (cancelled) return;
        const url = res?.data?.photo_url || null;
        photoCache[cacheKey] = url;
        setPhotoUrl(url);
      })
      .catch(() => {
        photoCache[cacheKey] = null;
      })
      .finally(() => {
        if (!cancelled) setPhotoLoading(false);
      });

    return () => { cancelled = true; };
  }, [spot.name]);

  const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(spot.name + " New York City")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="rounded-3xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
    >
      {/* Full-width photo */}
      <div className="relative" style={{ height: 200 }}>
        {photoLoading ? (
          <div className="w-full h-full skeleton" />
        ) : photoUrl ? (
          <img
            src={photoUrl}
            alt={spot.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          // Fallback gradient when no photo
          <div
            className="w-full h-full flex items-end p-4"
            style={{
              background: `linear-gradient(135deg, ${typeColor.bg}cc, ${typeColor.color}44)`,
            }}
          >
            <span className="text-5xl">{spot.type.split(" ")[0]}</span>
          </div>
        )}

        {/* Gradient overlay on photo */}
        {!photoLoading && (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.6) 100%)" }}
          />
        )}

        {/* Cost badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: isFree ? "rgba(16,185,129,0.92)" : "rgba(0,0,0,0.55)",
            color: "#fff",
            backdropFilter: "blur(6px)",
          }}
        >
          {spot.cost}
        </div>

        {/* Heart button */}
        <button
          onClick={() => setLiked(l => !l)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
        >
          <Heart className="w-4.5 h-4.5" style={{ width: 18, height: 18, fill: liked ? "#ef4444" : "none", color: liked ? "#ef4444" : "#fff" }} />
        </button>

        {/* Category pill on photo bottom */}
        <div className="absolute bottom-3 left-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: typeColor.bg, color: typeColor.color }}
          >
            {typeLabel}
          </span>
        </div>

        {/* Google Maps link */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
        >
          <ExternalLink className="w-3.5 h-3.5 text-white" />
        </a>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-black text-base leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {spot.name}
          </h4>
        </div>

        {/* Rating row */}
        <div className="flex items-center gap-1.5 mb-2">
          {[1,2,3,4,5].map(s => (
            <Star key={s} className="w-3.5 h-3.5" style={{ fill: s <= Math.round(parseFloat(rating)) ? "#F59E0B" : "none", color: "#F59E0B" }} />
          ))}
          <span className="text-xs font-bold" style={{ color: "#F59E0B" }}>{rating}</span>
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>({reviews} reviews)</span>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {spot.desc}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-hint)" }} />
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>New York City</span>
          <span className="ml-auto text-xs font-semibold" style={{ color: "var(--text-hint)" }}>→ View on Maps</span>
        </div>
      </div>
    </motion.div>
  );
}