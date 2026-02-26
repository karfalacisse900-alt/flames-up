import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, RefreshCw, Trophy } from "lucide-react";

function VoteCard({ art, onVote, voted, isWinner }) {
  return (
    <motion.button
      onClick={() => !voted && onVote(art.id)}
      whileTap={{ scale: voted ? 1 : 0.97 }}
      className="relative flex-1 rounded-3xl overflow-hidden"
      style={{
        border: isWinner ? "3px solid #F5A623" : "2px solid var(--border-light)",
        cursor: voted ? "default" : "pointer",
        minHeight: 200,
      }}>
      <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" style={{ minHeight: 200, maxHeight: 260 }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
      {isWinner && (
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#F5A623" }}>
          <Trophy className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-sm font-semibold truncate">{art.title}</p>
        <p className="text-white/70 text-[11px] truncate">{art.user_name}</p>
        {voted && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="h-1.5 rounded-full flex-1" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${art._pct || 0}%`, backgroundColor: isWinner ? "#F5A623" : "#fff" }} />
            </div>
            <span className="text-white text-[11px] font-bold">{art._pct || 0}%</span>
          </div>
        )}
      </div>
      {!voted && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
          <span className="text-white font-bold text-lg">Vote</span>
        </div>
      )}
    </motion.button>
  );
}

export default function ArtVoteArena({ user }) {
  const qc = useQueryClient();
  const [votes, setVotes] = useState({}); // { matchId: artId }
  const [matchIndex, setMatchIndex] = useState(0);

  const { data: artworks = [], isLoading: loadingArtworks } = useQuery({
    queryKey: ["artVoteArtworks"],
    queryFn: () => base44.entities.Artwork.filter({ status: "published" }, "-created_date", 60),
    staleTime: 60000,
  });

  const { data: artPieces = [], isLoading: loadingPieces } = useQuery({
    queryKey: ["artVotePieces"],
    queryFn: () => base44.entities.ArtPiece.list("-created_date", 60),
    staleTime: 60000,
  });

  const isLoading = loadingArtworks || loadingPieces;

  const allArt = useMemo(() => [
    ...artworks,
    ...artPieces.map(p => ({
      id: `piece_${p.id}`,
      _raw_id: p.id,
      _type: "ArtPiece",
      title: p.title,
      image_url: p.image_url,
      user_name: p.creator_name || p.owner_name,
      vote_count: 0,
    }))
  ], [artworks, artPieces]);

  const matches = useMemo(() => {
    const shuffled = [...allArt].sort(() => Math.random() - 0.5);
    const pairs = [];
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    }
    return pairs;
  }, [allArt.length]);

  const currentMatch = matches[matchIndex % Math.max(1, matches.length)];
  const matchId = currentMatch ? `${currentMatch[0]?.id}_${currentMatch[1]?.id}` : null;
  const voted = matchId ? !!votes[matchId] : false;
  const votedId = matchId ? votes[matchId] : null;

  const handleVote = (artId) => {
    if (!matchId || voted) return;
    setVotes(prev => ({ ...prev, [matchId]: artId }));
    // Update vote count
    base44.entities.Artwork.update(artId, {
      vote_count: ((artworks.find(a => a.id === artId)?.vote_count) || 0) + 1,
    }).then(() => qc.invalidateQueries({ queryKey: ["artVoteArtworks"] }));
  };

  const nextMatch = () => setMatchIndex(i => i + 1);

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#3C6E5A", borderTopColor: "transparent" }} />
    </div>
  );

  if (matches.length === 0) return (
    <div className="text-center py-12 px-6">
      <p className="text-4xl mb-3">🎨</p>
      <p className="text-sm" style={{ color: "#6B6B6B" }}>Not enough artworks for a vote yet</p>
    </div>
  );

  const [artA, artB] = currentMatch || [];

  // Compute percentages
  const totalVotes = (artA?.vote_count || 0) + (artB?.vote_count || 0);
  const pctA = totalVotes > 0 ? Math.round(((artA?.vote_count || 0) / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;
  const withPct = [{ ...artA, _pct: pctA }, { ...artB, _pct: pctB }];

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-4 h-4" style={{ color: "#E07070" }} />
        <p className="text-sm font-bold" style={{ color: "#243D33", fontFamily: "var(--font-serif)" }}>Art Vote Arena</p>
        <span className="text-[11px] ml-auto" style={{ color: "#6B6B6B" }}>Match {(matchIndex % matches.length) + 1}/{matches.length}</span>
      </div>

      <p className="text-xs text-center mb-3 font-medium" style={{ color: "#6B6B6B" }}>
        {voted ? "Result!" : "Tap to vote for your favourite"}
      </p>

      <div className="flex gap-3" style={{ minHeight: 220 }}>
        {withPct.map((art, i) => (
          <VoteCard
            key={art.id}
            art={art}
            onVote={handleVote}
            voted={voted}
            isWinner={voted && art._pct > (i === 0 ? withPct[1]._pct : withPct[0]._pct)}
          />
        ))}
      </div>

      {voted && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center">
          <button onClick={nextMatch}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "#2E6B4F", color: "#fff" }}>
            <RefreshCw className="w-4 h-4" /> Next Match
          </button>
        </motion.div>
      )}
    </div>
  );
}