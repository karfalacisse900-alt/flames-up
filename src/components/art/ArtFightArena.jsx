import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Heart } from "lucide-react";
import ArtFightFavoriteBtn from "./ArtFightFavoriteBtn";
import ArtFightProfile from "./ArtFightProfile";

// Simple ELO calculation
function calcElo(winnerScore, loserScore, k = 32) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserScore - winnerScore) / 400));
  const newWinner = Math.round(winnerScore + k * (1 - expectedWinner));
  const newLoser = Math.round(loserScore + k * (0 - (1 - expectedWinner)));
  return { newWinner, newLoser };
}

function pickPair(approved, votedPairKeys) {
  if (approved.length < 2) return null;
  // Sort by fight_score similarity, try to find an unvoted pair
  const shuffled = [...approved].sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      const key = [shuffled[i].id, shuffled[j].id].sort().join("_");
      if (!votedPairKeys.has(key)) return [shuffled[i], shuffled[j]];
    }
  }
  // Fallback: any random pair
  return [shuffled[0], shuffled[1]];
}

export default function ArtFightArena({ user }) {
  const [chosen, setChosen] = useState(null);
  const [pair, setPair] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const qc = useQueryClient();

  const { data: approved = [], isLoading } = useQuery({
    queryKey: ["artfight-approved"],
    queryFn: () => base44.entities.ArtFightEntry.filter({ status: "approved" }, "-fight_score"),
  });

  const { data: myVotes = [] } = useQuery({
    queryKey: ["artfight-votes", user?.email],
    queryFn: () => base44.entities.ArtFightVote.filter({ voter_email: user.email }),
    enabled: !!user?.email,
  });

  const votedPairKeys = useMemo(() => new Set(myVotes.map(v => v.pair_key)), [myVotes]);

  // Init pair once approved loads
  React.useEffect(() => {
    if (approved.length >= 2 && !pair) {
      setPair(pickPair(approved, votedPairKeys));
    }
  }, [approved.length]);

  const handleVote = async (winnerId) => {
    if (!user || chosen || loading) return;
    setChosen(winnerId);
    setLoading(true);

    const [a, b] = pair;
    const winner = a.id === winnerId ? a : b;
    const loser = a.id === winnerId ? b : a;
    const pairKey = [a.id, b.id].sort().join("_");

    const { newWinner, newLoser } = calcElo(winner.fight_score || 1000, loser.fight_score || 1000);

    await Promise.all([
      base44.entities.ArtFightEntry.update(winner.id, {
        wins: (winner.wins || 0) + 1,
        fight_score: newWinner,
      }),
      base44.entities.ArtFightEntry.update(loser.id, {
        losses: (loser.losses || 0) + 1,
        fight_score: newLoser,
      }),
      base44.entities.ArtFightVote.create({
        voter_email: user.email,
        winner_id: winner.id,
        loser_id: loser.id,
        pair_key: pairKey,
      }),
      base44.entities.ArtFightHistory.create({
        entry_id: winner.id,
        opponent_id: loser.id,
        winner_id: winner.id,
        score_before: winner.fight_score || 1000,
        score_after: newWinner,
      }),
      base44.entities.ArtFightHistory.create({
        entry_id: loser.id,
        opponent_id: winner.id,
        winner_id: winner.id,
        score_before: loser.fight_score || 1000,
        score_after: newLoser,
      }),
    ]);

    qc.invalidateQueries({ queryKey: ["artfight-approved"] });
    qc.invalidateQueries({ queryKey: ["artfight-votes", user.email] });

    setTimeout(() => {
      setChosen(null);
      setLoading(false);
      const freshApproved = qc.getQueryData(["artfight-approved"]) || approved;
      const newPairKeys = new Set([...votedPairKeys, pairKey]);
      setPair(pickPair(freshApproved, newPairKeys));
    }, 900);
  };

  const nextPair = () => {
    setPair(pickPair(approved, votedPairKeys));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (approved.length < 2) {
    return (
      <div className="text-center py-16 px-5">
        <Swords className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-hint)" }} />
        <p className="text-base font-semibold" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-serif)" }}>Not enough art yet</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-hint)" }}>At least 2 approved artworks are needed to start fights.</p>
      </div>
    );
  }

  if (!pair) return null;

  const [a, b] = pair;
  const allVoted = !pickPair(approved, votedPairKeys);

  return (
    <div className="pb-24 pt-2">
      <div className="px-4 py-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-hint)" }}>Which one do you prefer?</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${a.id}-${b.id}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          className="flex gap-3 px-4 h-[60vh]"
        >
          {[a, b].map((entry) => {
            const isChosen = chosen === entry.id;
            const isLost = chosen && chosen !== entry.id;
            return (
              <motion.div
                key={entry.id}
                animate={isChosen ? { scale: 1.02, borderColor: "var(--accent-primary)" } : isLost ? { opacity: 0.45, scale: 0.97 } : {}}
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
                  className="flex-1 flex flex-col text-left relative overflow-hidden"
                >
                  <div className="flex-1 relative overflow-hidden">
                    <img src={entry.image_url} alt={entry.title} className="w-full h-full object-cover" />
                    {isChosen && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="text-5xl">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white/95 backdrop-blur-sm">
                    <p className="text-xs font-semibold line-clamp-1" style={{ color: "var(--text-primary)" }}>{entry.title}</p>
                    <p className="text-[10px] mt-0.5 cursor-pointer hover:underline line-clamp-1" style={{ color: "var(--text-hint)" }} onClick={(e) => { e.stopPropagation(); setSelectedProfile(entry); }}>
                      {entry.owner_name}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-right">
                        <p className="text-[10px] font-medium" style={{ color: "var(--accent-primary)" }}>⚡ {entry.fight_score || 1000}</p>
                        <p className="text-[9px]" style={{ color: "var(--text-hint)" }}>{entry.wins || 0}W {entry.losses || 0}L</p>
                      </div>
                      <ArtFightFavoriteBtn entry={entry} user={user} />
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {allVoted && !chosen && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>You've voted on all current pairs! 🎉</p>
        </div>
      )}

      <div className="flex justify-center mt-4">
        <button onClick={nextPair} className="text-xs px-4 py-1.5 rounded-full border"
          style={{ borderColor: "var(--border-medium)", color: "var(--text-hint)" }}>
          Skip pair
        </button>
      </div>

      <ArtFightProfile entry={selectedProfile} user={user} open={!!selectedProfile} onClose={() => setSelectedProfile(null)} />
    </div>
  );
}