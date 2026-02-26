import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import GameCard from "./GameCard";
import GameDetailModal from "./GameDetailModal";

const FEATURED_GAMES = [261550, 107410, 214950, 570, 1091500]; // Bannerlord, Arma 3, Rome II, Dota 2, Helldivers 2

export default function GamesTab() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [games, setGames] = useState([]);

  const { data: cachedGames, isLoading } = useQuery({
    queryKey: ["steamGames"],
    queryFn: async () => {
      const response = await base44.functions.invoke("steamGameFetch", {
        appIds: FEATURED_GAMES,
      });
      return response.data.games || {};
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (cachedGames) {
      const gamesList = Object.entries(cachedGames)
        .map(([appId, data]) => ({ steam_app_id: parseInt(appId), ...data }))
        .filter(g => g.name);
      setGames(gamesList);
    }
  }, [cachedGames]);

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          🎮 Popular Games
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
          Discover trending Steam games
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
        </div>
      )}

      {/* Games Grid */}
      {!isLoading && games.length > 0 && (
        <div className="px-5 grid grid-cols-2 gap-3">
          <AnimatePresence>
            {games.map((game) => (
              <div key={game.steam_app_id} onClick={() => setSelectedGame(game)}>
                <GameCard game={game} onClick={() => setSelectedGame(game)} />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedGame && (
          <GameDetailModal
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}