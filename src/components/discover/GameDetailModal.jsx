import React, { useState } from "react";
import { X, Monitor, Calendar, User, ExternalLink } from "lucide-react";
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
      className="fixed inset-0 z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-[2rem] max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#0F0F1A" }}
        onClick={e => e.stopPropagation()}>

        {/* Hero image */}
        <div className="relative h-52 overflow-hidden">
          {game.header_image ? (
            <img src={game.header_image} alt={game.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)" }}>🎮</div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0F0F1A 0%, transparent 60%)" }} />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <X className="w-5 h-5 text-white" />
          </button>
          {/* Price badge */}
          {game.price_formatted && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)", color: "#fff" }}>
              {game.price_formatted}
            </div>
          )}
        </div>

        <div className="px-5 pt-3 pb-8 space-y-4">
          {/* Title */}
          <div>
            <span className="text-green-400 text-xs font-bold uppercase tracking-widest">🎮 Steam Game</span>
            <h2 className="text-xl font-bold text-white mt-1">{game.name}</h2>
          </div>

          {/* Description */}
          {game.short_description && (
            <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>{game.short_description}</p>
          )}

          {/* Details row */}
          <div className="flex gap-3">
            {game.release_date && (
              <div className="flex-1 rounded-2xl p-3" style={{ background: "linear-gradient(135deg, #10B98115, #3B82F615)", border: "1px solid #10B98130" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-green-400">Released</span>
                </div>
                <p className="text-sm font-bold text-white">{game.release_date}</p>
              </div>
            )}
            {game.developers && (
              <div className="flex-1 rounded-2xl p-3" style={{ background: "linear-gradient(135deg, #3B82F615, #6366F115)", border: "1px solid #3B82F630" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-blue-400">Developer</span>
                </div>
                <p className="text-sm font-bold text-white truncate">{game.developers}</p>
              </div>
            )}
          </div>

          {/* Platforms */}
          {(game.platforms?.windows || game.platforms?.mac || game.platforms?.linux) && (
            <div className="flex gap-2 flex-wrap">
              {game.platforms?.windows && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#1E293B", color: "#93C5FD", border: "1px solid #1E40AF40" }}>
                  <Monitor className="w-3.5 h-3.5" /> Windows
                </span>
              )}
              {game.platforms?.mac && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#1E293B", color: "#86EFAC", border: "1px solid #16653440" }}>
                  🍎 Mac
                </span>
              )}
              {game.platforms?.linux && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#1E293B", color: "#FDE68A", border: "1px solid #92400E40" }}>
                  🐧 Linux
                </span>
              )}
            </div>
          )}

          <WorthItButton contentType="game" contentId={game.steam_app_id?.toString()} />

          <div className="flex gap-2">
            <a href={`https://store.steampowered.com/app/${game.steam_app_id}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)", boxShadow: "0 4px 20px #10B98140" }}>
              <ExternalLink className="w-4 h-4" /> View on Steam
            </a>
            <button onClick={() => setShareItem(game)}
              className="px-4 py-3 rounded-2xl text-sm font-semibold"
              style={{ backgroundColor: "#1E293B", color: "#94A3B8", border: "1px solid #334155" }}>
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