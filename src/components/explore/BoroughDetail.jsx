import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import SpotCard from "./SpotCard";

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
          <div className="space-y-5">
            {(selectedNeighborhood.spots || []).map((spot, i) => (
              <SpotCard key={i} spot={spot} index={i} />
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