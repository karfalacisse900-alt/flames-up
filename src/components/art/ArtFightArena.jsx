import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Swords } from "lucide-react";
import ArtFightProfile from "./ArtFightProfile";

function calcElo(winnerScore, loserScore, k = 32) {
  const exp = 1 / (1 + Math.pow(10, (loserScore - winnerScore) / 400));
  return {
    newWinner: Math.round(winnerScore + k * (1 - exp)),
    newLoser: Math.round(loserScore + k * (0 - (1 - exp))),
  };
}

function pickPair(items, votedPairKeys) {
  if (items.length < 2) return null;
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      const key = [shuffled[i].id, shuffled[j].id].sort().join("_");
      if (!votedPairKeys.has(key)) return [shuffled[i], shuffled[j]];
    }
  }
  return [shuffled[0], shuffled[1]];
}

export default function ArtFightArena({ user }) {
  const [chosen, setChosen] = useState(null);
  const [pair, setPair] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const qc = useQueryClient();

  // Use ALL art from the gallery
  const { data: artPieces = [], isLoading } = useQuery({
    queryKey: ["art-arena"],
    queryFn: () => base44.entities.ArtPiece.list("-created_date", 100),
  });

  const { data: myVotes = [] } = useQuery({
    queryKey: ["artfight-votes", user?.email],
    queryFn: () => base44.entities.ArtFightVote.filter({ voter_email: user.email }),
    enabled: !!user?.email,
  });

  const votedPairKeys = useMemo(() => new Set(myVotes.map((v) => v.pair_key)), [myVotes]);

  React.useEffect(() => {
    if (artPieces.length >= 2 && !pair) {
      setPair(pickPair(artPieces, votedPairKeys));
    }
  }, [artPieces.length]);

  const handleVote = async (winnerId) => {
    if (!user || chosen || loading) return;
    setChosen(winnerId);
    setLoading(true);

    const [a, b] = pair;
    const winner = a.id === winnerId ? a : b;
    const loser = a.id === winnerId ? b : a;
    const pairKey = [a.id, b.id].sort().join("_");

    const { newWinner, newLoser } = calcElo(
      winner.fight_score || 1000,
      loser.fight_score || 1000
    );

    await Promise.all([
      base44.entities.ArtPiece.update(winner.id, { fight_score: newWinner, fight_wins: (winner.fight_wins || 0) + 1 }),
      base44.entities.ArtPiece.update(loser.id, { fight_score: newLoser, fight_losses: (loser.fight_losses || 0) + 1 }),
      base44.entities.ArtFightVote.create({
        voter_email: user.email,
        winner_id: winner.id,
        loser_id: loser.id,
        pair_key: pairKey,
      }),
    ]);

    qc.invalidateQueries({ queryKey: ["art-arena"] });
    qc.invalidateQueries({ queryKey: ["artfight-votes", user?.email] });

    setTimeout(() => {
      setChosen(null);
      setLoading(false);
      const fresh = qc.getQueryData(["art-arena"]) || artPieces;
      const newKeys = new Set([...votedPairKeys, pairKey]);
      setPair(pickPair(fresh, newKeys));
    }, 900);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (artPieces.length < 2) {
    return (
      <div className="text-center py-16 px-5">
        <Swords className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-hint)" }} />
        <p className="text-base font-semibold" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-serif)" }}>Not enough art yet</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-hint)" }}>Upload at least 2 artworks to start fights.</p>
      </div>
    );
  }

  if (!pair) return null;
  const [a, b] = pair;

  return (
    <div className="pb-8 pt-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-center mb-3" style={{ color: "var(--text-hint)" }}>
        Which one do you prefer?
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${a.id}-${b.id}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          className="flex gap-3 px-4"
          style={{ touchAction: "none" }}
        >
          {[a, b].map((entry) => {
            const isChosen = chosen === entry.id;
            const isLost = chosen && chosen !== entry.id;
            return (
              <motion.div
                key={entry.id}
                animate={
                  isChosen
                    ? { scale: 1.02, borderColor: "var(--accent-primary)" }
                    : isLost
                    ? { opacity: 0.45, scale: 0.97 }
                    : {}
                }
                transition={{ duration: 0.2 }}
                className="flex-1 rounded-3xl overflow-hidden flex flex-col"
                style={{
                  border: `2px solid ${isChosen ? "var(--accent-primary)" : "var(--border-light)"}`,
                  backgroundColor: "var(--bg-card)",
                  boxShadow: isChosen ? "0 0 0 4px rgba(60,110,90,0.12)" : "0 4px 16px rgba(0,0,0,0.05)",
                }}
              >
                <button
                  onClick={() => handleVote(entry.id)}
                  disabled={!!chosen}
                  className="w-full text-left relative"
                  style={{ touchAction: "none" }}
                >
                  {/* Fixed aspect ratio — no more infinite vertical growth */}
                  <div className="w-full relative" style={{ paddingTop: "100%" }}>
                    <img
                      src={entry.image_url}
                      alt={entry.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />
                    {isChosen && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="text-5xl">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3" style={{ backgroundColor: "var(--bg-card)" }}>
                    <p className="text-xs font-semibold line-clamp-1" style={{ color: "var(--text-primary)" }}>{entry.title}</p>
                    <p
                      className="text-[10px] mt-0.5 line-clamp-1"
                      style={{ color: "var(--text-hint)" }}
                      onClick={(e) => { e.stopPropagation(); setSelectedProfile(entry); }}
                    >
                      {entry.creator_name}
                    </p>
                    <p className="text-[10px] font-medium mt-1" style={{ color: "var(--accent-primary)" }}>
                      ⚡ {entry.fight_score || 1000} &nbsp;·&nbsp; {entry.fight_wins || 0}W {entry.fight_losses || 0}L
                    </p>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center mt-5">
        <button
          onClick={() => setPair(pickPair(artPieces, votedPairKeys))}
          className="text-xs px-4 py-1.5 rounded-full border"
          style={{ borderColor: "var(--border-medium)", color: "var(--text-hint)", backgroundColor: "var(--bg-card)" }}
        >
          Skip pair
        </button>
      </div>

      <ArtFightProfile entry={selectedProfile} user={user} open={!!selectedProfile} onClose={() => setSelectedProfile(null)} />
    </div>
  );
}