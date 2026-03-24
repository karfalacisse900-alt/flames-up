import React from "react";
import { motion } from "framer-motion";
import { MapPin, DollarSign, Calendar, Zap } from "lucide-react";

export default function TripDestinationCard({ destination, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-3xl overflow-hidden text-left transition-all"
      style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 70%)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
        minHeight: 320,
        position: "relative",
      }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('${destination.image}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
        }}
      />

      {/* Special badge */}
      {destination.special && (
        <div
          className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", color: "#0F172A" }}
        >
          ✨ Special
        </div>
      )}

      {/* Content at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3
          className="text-2xl font-black mb-2 leading-tight"
          style={{ fontFamily: "var(--font-serif)", color: "#fff" }}
        >
          {destination.name}
        </h3>

        {/* Description */}
        <p className="text-sm mb-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          {destination.description}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <DollarSign className="w-3.5 h-3.5" style={{ color: "#fff" }} />
            <span style={{ color: "#fff" }}>from ${destination.budgetStart}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: "#fff" }} />
            <span style={{ color: "#fff" }}>{destination.duration} {destination.duration === 1 ? "day" : "days"}</span>
          </div>
        </div>

        {/* Activity level */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: "#FCD34D" }} />
          <span className="text-xs font-semibold" style={{ color: "#FCD34D" }}>
            {destination.activityLevel}
          </span>
        </div>
      </div>
    </motion.button>
  );
}