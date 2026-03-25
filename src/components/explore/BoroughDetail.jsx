import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MapPin, DollarSign, Star } from "lucide-react";

function SpotCard({ spot }) {
  return (
    <div
      className="p-4 rounded-2xl"
      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0 mt-0.5">{spot.type.split(" ")[0]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
              {spot.name}
            </p>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{
                backgroundColor: spot.cost === "Free" || spot.cost === "FREE" ? "#D1FAE5" : "var(--bg-card)",
                color: spot.cost === "Free" || spot.cost === "FREE" ? "#065F46" : "var(--text-hint)",
                border: "1px solid",
                borderColor: spot.cost === "Free" || spot.cost === "FREE" ? "#6EE7B7" : "var(--border-light)",
              }}
            >
              {spot.cost}
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>
            {spot.type.split(" ").slice(1).join(" ")}
          </p>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {spot.desc}
          </p>
        </div>
      </div>
    </div>
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
      <img
        src={neighborhood.image}
        alt={neighborhood.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%)" }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-xl font-black text-white mb-1" style={{ fontFamily: "var(--font-serif)" }}>
          {neighborhood.name}
        </h3>
        <p className="text-xs leading-snug" style={{ color: "rgba(255,255,255,0.8)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {neighborhood.description}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }}
          >
            {neighborhood.spots?.length || 0} spots to explore →
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function BoroughDetail({ borough, onBack }) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);

  if (selectedNeighborhood) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        {/* Neighborhood header with image */}
        <div className="relative" style={{ height: 240 }}>
          <img
            src={selectedNeighborhood.image}
            alt={selectedNeighborhood.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)" }}
          />

          {/* Back button */}
          <button
            onClick={() => setSelectedNeighborhood(null)}
            className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center z-10"
            style={{
              paddingTop: "max(env(safe-area-inset-top, 0px), 0px)",
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div
            className="absolute bottom-0 left-0 right-0 p-5"
            style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0px)" }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
              {borough.name}
            </p>
            <h2 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "var(--font-serif)" }}>
              {selectedNeighborhood.name}
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
              {selectedNeighborhood.description}
            </p>
          </div>
        </div>

        {/* Spots */}
        <div className="px-4 pt-5 pb-32">
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-hint)" }}>
            Places to Explore
          </p>
          <div className="space-y-3">
            {(selectedNeighborhood.spots || []).map((spot, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <SpotCard spot={spot} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Borough header with image */}
      <div className="relative" style={{ height: 260 }}>
        <img
          src={borough.image}
          alt={borough.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)" }}
        />

        {/* Back */}
        <button
          onClick={onBack}
          className="absolute w-9 h-9 rounded-full flex items-center justify-center z-10"
          style={{
            top: "max(env(safe-area-inset-top, 16px), 16px)",
            left: 16,
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
          }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{borough.emoji}</span>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-serif)" }}>
              {borough.name}
            </h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
            {borough.description}
          </p>
        </div>
      </div>

      {/* Neighborhoods grid */}
      <div className="px-4 pt-5 pb-32">
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-hint)" }}>
          Neighborhoods
        </p>
        <div className="space-y-4">
          {borough.neighborhoods.map((n, i) => (
            <motion.div
              key={n.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <NeighborhoodCard
                neighborhood={n}
                onClick={() => setSelectedNeighborhood(n)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}