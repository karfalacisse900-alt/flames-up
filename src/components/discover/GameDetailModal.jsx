import React, { useState } from "react";
import { X, Monitor, Apple, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";
import WorthItButton from "./WorthItButton";
import ShareModal from "./ShareModal";

export default function GameDetailModal({ game, onClose }) {
  const [shareItem, setShareItem] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--bg-modal)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Image */}
        {game.header_image && (
          <div className="w-full h-48 overflow-hidden bg-gray-200">
            <img src={game.header_image} alt={game.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full z-10"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {game.name}
            </h2>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Price</span>
            <span className="text-lg font-bold" style={{ color: "var(--accent-primary)" }}>
              {game.price_formatted}
            </span>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
              {game.short_description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {game.release_date && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                  <span className="text-xs" style={{ color: "var(--text-hint)" }}>Release</span>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {game.release_date}
                </p>
              </div>
            )}
            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                <span className="text-xs" style={{ color: "var(--text-hint)" }}>Developer</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {game.developers}
              </p>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Platforms</p>
            <div className="flex gap-2">
              {game.platforms?.windows && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <Monitor className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  <span className="text-xs" style={{ color: "var(--text-primary)" }}>Windows</span>
                </div>
              )}
              {game.platforms?.mac && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <Apple className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  <span className="text-xs" style={{ color: "var(--text-primary)" }}>Mac</span>
                </div>
              )}
              {game.platforms?.linux && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <span className="text-sm" style={{ color: "var(--accent-primary)" }}>🐧</span>
                  <span className="text-xs" style={{ color: "var(--text-primary)" }}>Linux</span>
                </div>
              )}
            </div>
          </div>

          {/* Rating Button */}
          <WorthItButton
            contentType="game"
            contentId={game.steam_app_id.toString()}
          />

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <a
              href={`https://store.steampowered.com/app/${game.steam_app_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-lg text-white font-semibold text-center"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              View on Steam
            </a>
            <button
              onClick={() => setShareItem(game)}
              className="px-4 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {shareItem && (
        <ShareModal
          item={{ ...shareItem, title: shareItem.name, link: `https://store.steampowered.com/app/${shareItem.steam_app_id}` }}
          onClose={() => setShareItem(null)}
        />
      )}
    </motion.div>
  );
}