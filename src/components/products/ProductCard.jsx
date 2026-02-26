import React, { useState } from "react";
import { ExternalLink } from "lucide-react";

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

export default function ProductCard({ product, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasImage = product.image_url && !imgError;
  const platformLabel = PLATFORM_LABELS[product.platform] || "View Product";

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
      style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative w-full" style={{ aspectRatio: "4/3", backgroundColor: "var(--bg-subtle)" }}>
        {hasImage ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 skeleton" />
            )}
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
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            {CATEGORY_ICONS[product.category] || "📦"}
          </div>
        )}
        {product.platform && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}>
            {product.platform}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-sm leading-snug line-clamp-1" style={{ color: "var(--text-primary)" }}>{product.name}</p>
          {product.price && (
            <span className="text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              {product.price}
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed line-clamp-2 mb-2" style={{ color: "var(--text-secondary)" }}>
          {product.description}
        </p>
        {product.insight && (
          <p className="text-[10px] mb-2 italic" style={{ color: "var(--accent-primary)" }}>💡 {product.insight}</p>
        )}

        {product.external_url && (
          <a
            href={product.external_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-[#2E6B4F] text-white"
            style={{ textDecoration: "none" }}
          >
            <ExternalLink className="w-3 h-3" />
            {platformLabel}
          </a>
        )}
      </div>
    </div>
  );
}