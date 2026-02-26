import React, { useState } from "react";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

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

export default function ProductCard({ product, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const buyLabel = product.platform_label || PLATFORM_LABELS[product.platform] || "Buy Now";

  const handleBuyClick = (e) => {
    e.stopPropagation();
    if (product.external_link) {
      window.open(product.external_link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
      style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
    >
      {/* Product Image */}
      {(product.image_url && !imgError) ? (
        <div className="relative w-full aspect-square bg-gray-100">
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: imgLoaded ? 1 : 0 }}
          />
        </div>
      ) : (
        <div className="w-full aspect-square flex items-center justify-center text-5xl"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          {CATEGORY_ICONS[product.category] || "📦"}
        </div>
      )}

      {/* Card Body */}
      <div className="p-4">
        {/* Platform badge */}
        {product.platform && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 inline-block capitalize"
            style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            {product.platform === "tech_accessories" ? "Electronics" : product.platform}
          </span>
        )}

        <p className="font-semibold text-sm leading-snug mb-1" style={{ color: "var(--text-primary)" }}>
          {product.name}
        </p>

        <p className="text-xs leading-relaxed line-clamp-2 mb-2" style={{ color: "var(--text-secondary)" }}>
          {product.description}
        </p>

        <div className="flex items-center justify-between gap-2 mt-3">
          {product.price ? (
            <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
              {product.price}
            </span>
          ) : <span />}

          {product.external_link && (
            <button
              onClick={handleBuyClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {buyLabel}
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          )}
        </div>

        {product.insight && (
          <p className="text-[10px] mt-2 italic" style={{ color: "var(--accent-primary)" }}>
            💡 {product.insight}
          </p>
        )}
      </div>
    </motion.div>
  );
}