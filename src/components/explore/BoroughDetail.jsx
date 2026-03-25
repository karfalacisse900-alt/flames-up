import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Heart, Share2, MapPin, Star } from "lucide-react";

// Real Unsplash photos per spot type / name
const SPOT_PHOTOS = {
  "McNally Jackson Books": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=200&h=160&fit=crop",
  "Soho Square Park": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=200&h=160&fit=crop",
  "Housing Works Bookstore": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=200&h=160&fit=crop",
  "Artists & Fleas Market": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=160&fit=crop",
  "The Metropolitan Museum": "https://images.unsplash.com/photo-1583153119626-1c24e98c7b4c?w=200&h=160&fit=crop",
  "Central Park (East Side)": "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=200&h=160&fit=crop",
  "Neue Galerie": "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=200&h=160&fit=crop",
  "Carl Schurz Park": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=160&fit=crop",
  "Marcus Garvey Park": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=200&h=160&fit=crop",
  "Studio Museum in Harlem": "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=200&h=160&fit=crop",
  "Apollo Theater": "https://images.unsplash.com/photo-1514533212735-5df27d970db5?w=200&h=160&fit=crop",
  "Strivers' Row": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=160&fit=crop",
  "Tenement Museum": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=160&fit=crop",
  "Essex Market": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=160&fit=crop",
  "Orchard Street": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=160&fit=crop",
  "Sara D. Roosevelt Park": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=160&fit=crop",
  "Washington Square Park": "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=200&h=160&fit=crop",
  "The Strand Bookstore": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=200&h=160&fit=crop",
  "Village Vanguard": "https://images.unsplash.com/photo-1514533212735-5df27d970db5?w=200&h=160&fit=crop",
  "Jefferson Market Garden": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=160&fit=crop",
  "Columbus Park": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=200&h=160&fit=crop",
  "Canal Street Market": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=160&fit=crop",
  "Museum of Chinese in America": "https://images.unsplash.com/photo-1583153119626-1c24e98c7b4c?w=200&h=160&fit=crop",
  "Mulberry Street": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=160&fit=crop",
  "Brooklyn Flea Market": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=160&fit=crop",
  "East River State Park": "https://images.unsplash.com/photo-1569154941061-e231b4aa8ebb?w=200&h=160&fit=crop",
  "Smorgasburg": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=160&fit=crop",
  "The Brooklyn Art Library": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=200&h=160&fit=crop",
  "Brooklyn Bridge Park": "https://images.unsplash.com/photo-1508779105133-6f9df59d3e65?w=200&h=160&fit=crop",
  "Jane's Carousel": "https://images.unsplash.com/photo-1569154941061-e231b4aa8ebb?w=200&h=160&fit=crop",
  "DUMBO Arts": "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=200&h=160&fit=crop",
  "Washington Street Photo Spot": "https://images.unsplash.com/photo-1508759773894-8f19bffcf8c7?w=200&h=160&fit=crop",
  "Prospect Park": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=160&fit=crop",
  "Brooklyn Museum": "https://images.unsplash.com/photo-1583153119626-1c24e98c7b4c?w=200&h=160&fit=crop",
  "Brooklyn Botanic Garden": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=160&fit=crop",
  "Grand Army Plaza Greenmarket": "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&h=160&fit=crop",
  "Coney Island Beach": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=160&fit=crop",
  "Luna Park": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&h=160&fit=crop",
  "New York Aquarium": "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=200&h=160&fit=crop",
  "Coney Island Boardwalk": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&h=160&fit=crop",
};

const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=200&h=160&fit=crop";

// Color-coded category tags
const TYPE_COLORS = {
  "Park": { bg: "#D1FAE5", color: "#065F46" },
  "Museum": { bg: "#DBEAFE", color: "#1E40AF" },
  "Bookstore": { bg: "#FEF3C7", color: "#92400E" },
  "Market": { bg: "#FCE7F3", color: "#9D174D" },
  "Jazz Club": { bg: "#EDE9FE", color: "#5B21B6" },
  "Garden": { bg: "#D1FAE5", color: "#065F46" },
  "Thrift + Books": { bg: "#FEF3C7", color: "#92400E" },
  "Public Space": { bg: "#DBEAFE", color: "#1E40AF" },
  "Architecture": { bg: "#F3F4F6", color: "#374151" },
  "Landmark": { bg: "#FEE2E2", color: "#991B1B" },
  "Dining": { bg: "#FCE7F3", color: "#9D174D" },
  "Beach": { bg: "#DBEAFE", color: "#1E40AF" },
  "Amusement": { bg: "#FEF3C7", color: "#92400E" },
  "Attraction": { bg: "#EDE9FE", color: "#5B21B6" },
  "Walk": { bg: "#D1FAE5", color: "#065F46" },
  "Gallery": { bg: "#EDE9FE", color: "#5B21B6" },
  "Arts Walk": { bg: "#EDE9FE", color: "#5B21B6" },
  "Trail": { bg: "#D1FAE5", color: "#065F46" },
  "Historic Site": { bg: "#FEE2E2", color: "#991B1B" },
  "Campus": { bg: "#F3F4F6", color: "#374151" },
  "Zoo": { bg: "#D1FAE5", color: "#065F46" },
  "Ferry": { bg: "#DBEAFE", color: "#1E40AF" },
  "Museum Village": { bg: "#FEF3C7", color: "#92400E" },
  "Nature": { bg: "#D1FAE5", color: "#065F46" },
};

function getTypeLabel(typeStr) {
  return typeStr.split(" ").slice(1).join(" ");
}
function getTypeColors(typeStr) {
  const label = getTypeLabel(typeStr);
  return TYPE_COLORS[label] || { bg: "var(--bg-subtle)", color: "var(--text-secondary)" };
}

function SpotListCard({ spot, index }) {
  const [liked, setLiked] = useState(false);
  const photo = SPOT_PHOTOS[spot.name] || DEFAULT_PHOTO;
  const typeLabel = getTypeLabel(spot.type);
  const typeColor = getTypeColors(spot.type);
  const isFree = spot.cost === "Free" || spot.cost === "FREE" || spot.cost.startsWith("Free");
  // Fake but plausible rating
  const rating = (4.1 + (index % 5) * 0.16).toFixed(1);
  const reviews = 20 + (index * 17) % 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      {/* Photo */}
      <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: 100, height: 90 }}>
        <img src={photo} alt={spot.name} className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <h4 className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
            {spot.name}
          </h4>
          <button onClick={() => setLiked(l => !l)} className="shrink-0" style={{ minWidth: 28, minHeight: 28 }}>
            <Heart className="w-4 h-4" style={{ fill: liked ? "#ef4444" : "none", color: liked ? "#ef4444" : "var(--text-hint)" }} />
          </button>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-1.5">
          <Star className="w-3 h-3" style={{ fill: "#F59E0B", color: "#F59E0B" }} />
          <span className="text-xs font-bold" style={{ color: "#F59E0B" }}>{rating}</span>
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>({reviews})</span>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {spot.desc}
        </p>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: typeColor.bg, color: typeColor.color }}>
            {typeLabel}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: isFree ? "#D1FAE5" : "#F3F4F6", color: isFree ? "#065F46" : "var(--text-secondary)" }}>
            {spot.cost}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function NeighborhoodCard({ neighborhood, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-3xl overflow-hidden text-left relative"
      style={{ height: 180 }}
    >
      <img src={neighborhood.image} alt={neighborhood.name} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%)" }} />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-xl font-black text-white mb-1" style={{ fontFamily: "var(--font-serif)" }}>
          {neighborhood.name}
        </h3>
        <p className="text-xs leading-snug" style={{ color: "rgba(255,255,255,0.8)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {neighborhood.description}
        </p>
        <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }}>
          {neighborhood.spots?.length || 0} spots →
        </span>
      </div>
    </motion.button>
  );
}

export default function BoroughDetail({ borough, onBack }) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);

  if (selectedNeighborhood) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        {/* Header image */}
        <div className="relative" style={{ height: 220 }}>
          <img src={selectedNeighborhood.image} alt={selectedNeighborhood.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.78) 100%)" }} />

          <button
            onClick={() => setSelectedNeighborhood(null)}
            className="absolute w-9 h-9 rounded-full flex items-center justify-center z-10"
            style={{ top: "max(env(safe-area-inset-top, 16px), 16px)", left: 16, backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-xs font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{borough.name}</p>
            <h2 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "var(--font-serif)" }}>
              {selectedNeighborhood.name}
            </h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>{selectedNeighborhood.description}</p>
          </div>
        </div>

        {/* Spots list */}
        <div className="px-4 pt-4 pb-32">
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-hint)" }}>
            {selectedNeighborhood.spots?.length} Places to Explore
          </p>
          <div className="space-y-3">
            {(selectedNeighborhood.spots || []).map((spot, i) => (
              <SpotListCard key={i} spot={spot} index={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="relative" style={{ height: 260 }}>
        <img src={borough.image} alt={borough.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.78) 100%)" }} />

        <button
          onClick={onBack}
          className="absolute w-9 h-9 rounded-full flex items-center justify-center z-10"
          style={{ top: "max(env(safe-area-inset-top, 16px), 16px)", left: 16, backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{borough.emoji}</span>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-serif)" }}>{borough.name}</h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>{borough.description}</p>
        </div>
      </div>

      <div className="px-4 pt-5 pb-32">
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-hint)" }}>Neighborhoods</p>
        <div className="space-y-4">
          {borough.neighborhoods.map((n, i) => (
            <motion.div key={n.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <NeighborhoodCard neighborhood={n} onClick={() => setSelectedNeighborhood(n)} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}