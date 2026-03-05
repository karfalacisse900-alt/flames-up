import React, { useState } from "react";
import { motion } from "framer-motion";
import { Music, Film, Tv, BookOpen, Gamepad2, ChevronRight } from "lucide-react";
import MediaTab from "./MediaTab";
import OpenLibraryBooksTab from "./OpenLibraryBooksTab";
import GamesTab from "./GamesTab";

const MEDIA_CATEGORIES = [
  { id: "music",  label: "Music",  icon: Music,     color: "#1DB954", bg: "#1DB95420", description: "Search millions of tracks & artists" },
  { id: "movies", label: "Movies", icon: Film,       color: "#E5A00D", bg: "#E5A00D20", description: "Discover films & cinematic releases" },
  { id: "shows",  label: "Shows",  icon: Tv,         color: "#E50914", bg: "#E5091420", description: "Explore TV series & episodes" },
  { id: "books",  label: "Books",  icon: BookOpen,   color: "#0078D4", bg: "#0078D420", description: "Browse the Open Library catalog" },
  { id: "games",  label: "Games",  icon: Gamepad2,   color: "#1B2838", bg: "#1B283820", description: "Explore Steam game catalog" },
];

function MediaCategoryCard({ cat, onClick }) {
  const Icon = cat.icon;
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-2xl w-full text-left transition-all active:scale-[0.98]"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg }}>
        <Icon className="w-6 h-6" style={{ color: cat.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{cat.label}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{cat.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
    </motion.button>
  );
}

export default function DiscoverMediaTab({ search, user }) {
  const [activeMedia, setActiveMedia] = useState(null);

  if (activeMedia === "books") {
    return (
      <div>
        <button onClick={() => setActiveMedia(null)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
          ← Back to Media
        </button>
        <OpenLibraryBooksTab initialSearch={search} />
      </div>
    );
  }

  if (activeMedia === "games") {
    return (
      <div>
        <button onClick={() => setActiveMedia(null)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
          ← Back to Media
        </button>
        <GamesTab initialSearch={search} />
      </div>
    );
  }

  if (activeMedia === "music" || activeMedia === "movies" || activeMedia === "shows") {
    return (
      <div>
        <button onClick={() => setActiveMedia(null)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
          ← Back to Media
        </button>
        <MediaTab user={user} initialTab={activeMedia} initialSearch={search} />
      </div>
    );
  }

  return (
    <div className="px-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>Browse by category</p>
      {MEDIA_CATEGORIES.map(cat => (
        <MediaCategoryCard key={cat.id} cat={cat} onClick={() => setActiveMedia(cat.id)} />
      ))}
    </div>
  );
}