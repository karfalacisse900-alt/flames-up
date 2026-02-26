import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";

const CATEGORY_ICONS = {
  perfume: "🌸", laptop: "💻", earbuds: "🎧", phone: "📱",
  skincare: "✨", tech_accessories: "🔌", fitness: "🏋️", travel: "✈️",
};

const PLATFORM_LABELS = {
  eBay: "Buy on eBay",
  Shopify: "Buy on Shopify",
  Amazon: "Buy on Amazon",
  Store: "View on Store",
  "Official Site": "View Official Site",
  Other: "View Product",
};

export default function ProductDetailModal({ product, onClose }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hasImage = product.image_url && !imgError;
  const platformLabel = PLATFORM_LABELS[product.platform] || "View Product";

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-0" style={{ backgroundColor: "var(--border-medium)" }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image */}
        <div className="relative w-full" style={{ aspectRatio: "4/3", backgroundColor: "var(--bg-subtle)" }}>
          {hasImage ? (
            <>
              {!imgLoaded && <div className="absolute inset-0 skeleton" />}
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
                style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s ease" }}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl">
              {CATEGORY_ICONS[product.category] || "📦"}
            </div>
          )}
          {product.platform && (
            <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
              {product.platform}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold leading-snug" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              {product.name}
            </h2>
            {product.price && (
              <span className="text-sm font-bold shrink-0 px-3 py-1 rounded-full"
                style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                {product.price}
              </span>
            )}
          </div>

          {product.insight && (
            <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--accent-primary-light)" }}>
              <p className="text-sm italic font-medium" style={{ color: "var(--accent-primary)" }}>💡 {product.insight}</p>
            </div>
          )}

          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{product.description}</p>

          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-3 py-1 rounded-full capitalize font-medium"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              {CATEGORY_ICONS[product.category]} {product.category?.replace(/_/g, " ")}
            </span>
            {product.platform && (
              <span className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                {product.platform}
              </span>
            )}
          </div>

          {product.external_url && (
            <a
              href={product.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold bg-[#2E6B4F] text-white"
              style={{ textDecoration: "none" }}
            >
              <ExternalLink className="w-4 h-4" />
              {platformLabel}
              <span className="text-[11px] opacity-70 ml-1">↗ Opens externally</span>
            </a>
          )}

          <p className="text-[10px] text-center" style={{ color: "var(--text-hint)" }}>
            All product names and trademarks belong to their respective owners. This platform is not affiliated with any brand.
          </p>
        </div>
      </motion.div>
    </div>
  );
}