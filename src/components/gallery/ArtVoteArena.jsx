import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Swords, Crown, Loader2 } from "lucide-react";

function Leaderboard({ allArt }) {
  const top = useMemo(() =>
    [...allArt].sort((a, b) => (b.vote_count || b.like_count || 0) - (a.vote_count || a.like_count || 0)).slice(0, 10),
    [allArt]
  );
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="space-y-2 px-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4" style={{ color: "#F5A623" }} />
        <p className="text-sm font-bold" style={{ color: "#243D33", fontFamily: "var(--font-serif)" }}>All-Time Rankings</p>
      </div>
      {top.map((art, idx) => (
        <div key={art.id} className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ backgroundColor: idx < 3 ? "rgba(245,166,35,0.1)" : "#DCCBB8", border: `1px solid ${idx < 3 ? "rgba(245,166,35,0.3)" : "#BF9E7960"}` }}>
          <span className="text-lg w-8 text-center shrink-0">{medals[idx] || `#${idx + 1}`}</span>
          <img src={art.image_url} alt={art.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#243D33" }}>{art.title}</p>
            <p className="text-[11px]" style={{ color: "#6B6B6B" }}>{art.user_name}</p>
          </div>
          <p className="text-sm font-bold shrink-0" style={{ color: idx < 3 ? "#F5A623" : "#6B6B6B" }}>
            {art.vote_count || art.like_count || 0}
          </p>
        </div>
      ))}
      {top.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: "#6B6B6B" }}>No votes yet</p>
        </div>
      )}
    </div>
  );
}

export default function ArtVoteArena({ user }) {
  const qc = useQueryClient();
  const [matchIndex, setMatchIndex] = useState(0);
  const [votedMatchIds, setVotedMatchIds] = useState(new Set());
  const [winnerArt, setWinnerArt] = useState(null); // briefly show winner before advancing
  const [arenaTab, setArenaTab] = useState("battle");

  const { data: artworks = [], isLoading: la } = useQuery({
    queryKey: ["artVoteArtworks"],
    queryFn: () => base44.entities.Artwork.filter({ status: "published" }, "-created_date", 80),
    staleTime: 60000,
  });
  const { data: artPieces = [], isLoading: lp } = useQuery({
    queryKey: ["artVotePieces"],
    queryFn: () => base44.entities.ArtPiece.list("-created_date", 80),
    staleTime: 60000,
  });

  const isLoading = la || lp;

  const allArt = useMemo(() => [
    ...artworks,
    ...artPieces.map(p => ({
      id: `piece_${p.id}`, _raw_id: p.id, _type: "ArtPiece",
      title: p.title, image_url: p.image_url,
      user_name: p.creator_name || p.owner_name,
      vote_count: p.like_count || 0, like_count: p.like_count || 0,
    }))
  ], [artworks, artPieces]);

  const matches = useMemo(() => {
    const shuffled = [...allArt].sort((a, b) => a.id.localeCompare(b.id));
    const pairs = [];
    for (let i = 0; i + 1 < shuffled.length; i += 2) pairs.push([shuffled[i], shuffled[i + 1]]);
    return pairs;
  }, [allArt.length]);

  const currentIndex = matchIndex % Math.max(1, matches.length);
  const currentMatch = matches[currentIndex];
  const matchId = currentMatch ? `${currentMatch[0]?.id}_${currentMatch[1]?.id}` : null;
  const voted = matchId ? votedMatchIds.has(matchId) : false;

  const handleVote = (art) => {
    if (!matchId || voted) return;
    setVotedMatchIds(prev => new Set([...prev, matchId]));
    setWinnerArt(art);

    // Update vote count
    if (art._type === "ArtPiece") {
      base44.entities.ArtPiece.update(art._raw_id, { like_count: (art.like_count || 0) + 1 })
        .then(() => qc.invalidateQueries({ queryKey: ["artVotePieces"] }));
    } else {
      base44.entities.Artwork.update(art.id, { vote_count: (art.vote_count || 0) + 1 })
        .then(() => qc.invalidateQueries({ queryKey: ["artVoteArtworks"] }));
    }

    // Auto-advance after a brief winner reveal
    setTimeout(() => {
      setWinnerArt(null);
      setMatchIndex(i => i + 1);
    }, 1000);
  };

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3C6E5A" }} /></div>
  );

  if (allArt.length < 2) return (
    <div className="text-center py-16 px-6">
      <Swords className="w-10 h-10 mx-auto mb-3" style={{ color: "#DCCBB8" }} />
      <p className="text-sm" style={{ color: "#6B6B6B" }}>Not enough artworks yet</p>
    </div>
  );

  const [artA, artB] = currentMatch || [];

  return (
    <div className="pb-6">
      {/* Sub tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {[["battle", "⚔️ Battle"], ["leaderboard", "🏆 Rankings"]].map(([key, label]) => (
          <button key={key} onClick={() => setArenaTab(key)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all border"
            style={{
              backgroundColor: arenaTab === key ? "#243D33" : "#DCCBB8",
              color: arenaTab === key ? "#E6EFEA" : "#6B6B6B",
              borderColor: arenaTab === key ? "#243D33" : "#BF9E7960",
            }}>
            {label}
          </button>
        ))}
      </div>

      {arenaTab === "leaderboard" && <Leaderboard allArt={allArt} />}

      {arenaTab === "battle" && currentMatch && (
        <div className="px-4">
          {/* Match counter dots */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium" style={{ color: "#6B6B6B" }}>
              {voted ? "✓ Moving to next…" : "Tap to vote"}
            </p>
            <div className="flex gap-1">
              {matches.slice(0, Math.min(8, matches.length)).map((_, i) => (
                <div key={i} className="w-4 h-1 rounded-full transition-all"
                  style={{ backgroundColor: i === currentIndex ? "#3C6E5A" : votedMatchIds.has(`${matches[i][0]?.id}_${matches[i][1]?.id}`) ? "#DCCBB8" : "#BF9E7940" }} />
              ))}
            </div>
          </div>

          {/* VS Cards */}
          <div className="flex gap-3" style={{ minHeight: 240 }}>
            {[artA, artB].map((art, i) => {
              const isWinner = winnerArt?.id === art.id;
              const isLoser = voted && winnerArt && winnerArt.id !== art.id;
              return (
                <motion.button
                  key={art.id}
                  onClick={() => handleVote(art)}
                  whileTap={{ scale: voted ? 1 : 0.96 }}
                  className="relative flex-1 rounded-3xl overflow-hidden"
                  style={{
                    cursor: voted ? "default" : "pointer",
                    border: isWinner ? "3px solid #F5A623" : isLoser ? "2px solid rgba(0,0,0,0.1)" : "2px solid #DCCBB8",
                    opacity: isLoser ? 0.55 : 1,
                    transition: "opacity 0.4s, border 0.3s",
                    minHeight: 240,
                  }}>
                  <img src={art.image_url} alt={art.title} className="w-full h-full object-cover absolute inset-0" style={{ minHeight: 240 }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }} />

                  {/* Winner crown */}
                  <AnimatePresence>
                    {isWinner && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F5A623" }}>
                        <Crown className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Vote overlay */}
                  {!voted && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ backgroundColor: "rgba(60,110,90,0.25)" }}>
                      <span className="text-white font-bold text-lg bg-black/40 px-4 py-2 rounded-xl">Vote ✓</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-semibold truncate">{art.title}</p>
                    <p className="text-white/60 text-[11px] truncate">{art.user_name}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* VS divider */}
          <div className="flex items-center gap-2 mt-3 justify-center">
            <div className="h-px flex-1" style={{ backgroundColor: "#DCCBB8" }} />
            <Swords className="w-4 h-4" style={{ color: "#E07070" }} />
            <div className="h-px flex-1" style={{ backgroundColor: "#DCCBB8" }} />
          </div>
        </div>
      )}
    </div>
  );
}