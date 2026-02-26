import React, { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ShoppingCart, X } from "lucide-react";

const CATEGORY_ICONS = {
  perfume: "🌸", laptop: "💻", earbuds: "🎧", phone: "📱",
  skincare: "✨", tech_accessories: "🔌", fitness: "🏋️", travel: "✈️",
};

const PLATFORM_LABELS = {
  ebay: "Buy on eBay",
  shopify: "Buy on Shopify",
  amazon: "Buy on Amazon",
  store: "View on Store",
  other: "Buy Now",
};

export default function ProductDetailModal({ product, onClose }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const buyLabel = product.platform_label || PLATFORM_LABELS[product.platform] || "Buy Now";

  const handleBuy = () => {
    if (product.external_link) {
      window.open(product.external_link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />

        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full z-10"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>

        {/* Image */}
        <div className="relative w-full aspect-square" style={{ backgroundColor: "var(--bg-subtle)" }}>
          {(product.image_url && !imgError) ? (
            <>
              {!imgLoaded && <div className="absolute inset-0 skeleton" />}
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
                style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s" }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">
              {CATEGORY_ICONS[product.category] || "📦"}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-4">
          {/* Platform */}
          {product.platform && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize inline-block"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              {product.platform}
            </span>
          )}

          <div>
            <h2 className="text-xl font-bold leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {product.name}
            </h2>
            {product.price && (
              <p className="text-lg font-semibold mt-1" style={{ color: "var(--accent-primary)" }}>{product.price}</p>
            )}
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {product.description}
          </p>

          {product.insight && (
            <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--accent-primary-light)", border: "1px solid var(--border-light)" }}>
              <p className="text-sm italic" style={{ color: "var(--accent-primary)" }}>💡 {product.insight}</p>
            </div>
          )}

          {/* Buy button */}
          {product.external_link ? (
            <button
              onClick={handleBuy}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              <ShoppingCart className="w-4 h-4" />
              {buyLabel}
              <ExternalLink className="w-3.5 h-3.5 opacity-75" />
            </button>
          ) : (
            <div className="w-full py-3.5 rounded-2xl text-center text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              No purchase link available
            </div>
          )}

          {product.external_link && (
            <p className="text-[10px] text-center" style={{ color: "var(--text-hint)" }}>
              ↗ Opens external site · We do not process payments
            </p>
          )}

          <p className="text-[10px] text-center pb-2 leading-relaxed" style={{ color: "var(--text-hint)", borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
            All product names and trademarks belong to their respective owners. This platform is community-driven and not affiliated with any brand.
          </p>
        </div>
      </motion.div>
    </div>
  );
}