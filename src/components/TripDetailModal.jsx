import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, DollarSign, Calendar, Zap, Navigation } from "lucide-react";

export default function TripDetailModal({ destination, onClose, onBook }) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const handleImageNext = () => {
    setCurrentImageIdx((i) => (i + 1) % destination.images.length);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-end justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-3xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        >
          {/* Image carousel */}
          <div
            className="relative overflow-hidden"
            style={{ height: 240, backgroundColor: "#000" }}
            onTouchEnd={handleImageNext}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIdx}
                src={destination.images[currentImageIdx]}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Image counter */}
            <div
              className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}
            >
              {currentImageIdx + 1} / {destination.images.length}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Title & tagline */}
            <div className="mb-4">
              <h2
                className="text-2xl font-black mb-1 leading-tight"
                style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}
              >
                {destination.name}
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {destination.tagline}
              </p>
            </div>

            {/* Price */}
            <div className="mb-4 flex items-baseline gap-2">
              <span
                className="text-3xl font-black"
                style={{ fontFamily: "var(--font-serif)", color: "var(--accent-primary)" }}
              >
                ${destination.budgetStart}
              </span>
              <span className="text-sm" style={{ color: "var(--text-hint)" }}>
                per person
              </span>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div
                className="px-3 py-3 rounded-2xl text-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-hint)" }}>
                  Duration
                </p>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {destination.duration} {destination.duration === 1 ? "day" : "days"}
                </p>
              </div>
              <div
                className="px-3 py-3 rounded-2xl text-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-hint)" }}>
                  Activity Level
                </p>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {destination.activityLevel}
                </p>
              </div>
              <div
                className="px-3 py-3 rounded-2xl text-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-hint)" }}>
                  Accommodation
                </p>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {destination.accommodation}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {destination.fullDescription}
              </p>
            </div>

            {/* Highlights */}
            {destination.highlights?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>
                  What to Expect
                </p>
                <div className="space-y-2">
                  {destination.highlights.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-lg mt-0.5">🎯</span>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best time */}
            {destination.bestTime && (
              <div
                className="p-3 rounded-2xl mb-5"
                style={{ backgroundColor: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.15)" }}
              >
                <p className="text-xs font-bold mb-1" style={{ color: "var(--accent-primary)" }}>
                  💡 Best Time to Visit
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {destination.bestTime}
                </p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="px-5 pb-5">
            <button
              onClick={onBook}
              className="w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                color: "#fff",
                boxShadow: "0 8px 24px rgba(79,70,229,0.35)",
              }}
            >
              <Navigation className="w-5 h-5" /> Explore & Plan
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}