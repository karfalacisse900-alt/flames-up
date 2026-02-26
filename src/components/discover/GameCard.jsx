import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Monitor, Apple } from "lucide-react";

export default function GameCard({ game, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden cursor-pointer group"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
      onClick={onClick}
    >
      {/* Header Image */}
      {game.header_image && (
        <div className="w-full h-32 overflow-hidden bg-gray-200 relative">
          <img
            src={game.header_image}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2" style={{ color: "var(--text-primary)" }}>
          {game.name}
        </h3>

        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
          {game.short_description}
        </p>

        {/* Platforms */}
        <div className="flex gap-1 mt-2 mb-2">
          {game.platforms?.windows && <Monitor className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />}
          {game.platforms?.mac && <Apple className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />}
          {game.platforms?.linux && <span className="text-xs" style={{ color: "var(--text-hint)" }}>🐧</span>}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold" style={{ color: "var(--accent-primary)" }}>
            {game.price_formatted}
          </span>
          <a
            href={`https://store.steampowered.com/app/${game.steam_app_id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[10px] px-2 py-1 rounded-lg text-white font-medium"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            Steam
          </a>
        </div>
      </div>
    </motion.div>
  );
}