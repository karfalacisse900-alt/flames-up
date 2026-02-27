import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Swords, ChevronRight, Medal, Crown, Star, RefreshCw, Loader2 } from "lucide-react";

function VoteBattle({ artA, artB, onVote, voted, votedId }) {
  const totalVotes = (artA?.vote_count || artA?.like_count || 0) + (artB?.vote_count || artB?.like_count || 0);
  const pctA = totalVotes > 0 ? Math.round(((artA?.vote_count || artA?.like_count || 0) / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;
  const winnerA = voted && pctA > pctB;
  const winnerB = voted && pctB > pctA;

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
        {voted ? "🏆 Votes revealed!" : "Tap to vote for your favourite"}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[{ art: artA, pct: pctA, isWinner: winnerA }, { art: artB, pct: pctB, isWinner: winnerB }].map(({ art, pct, isWinner }) => (
          <motion.button
            key={art.id}
            onClick={() => !voted && onVote(art.id)}
            whileTap={{ scale: voted ? 1 : 0.95 }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              border: isWinner ? "2px solid #F5A623" : voted ? "2px solid rgba(255,255,255,0.08)" : "2px solid rgba(255,255,255,0.12)",
              cursor: voted ? "default" : "pointer",
              minHeight: 220,
              transition: "border-color 0.3s",
            }}>
            <img src={art.image_url} alt={art.title}
              className="w-full h-full object-cover absolute inset-0"
              style={{ minHeight: 220 }} />

            {/* Gradient */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />

            {/* Winner crown */}
            <AnimatePresence>
              {isWinner && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#F5A623" }}>
                  <Crown className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vote CTA overlay */}
            {!voted && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "rgba(46,107,79,0.3)" }}>
                <span className="text-white font-bold text-lg bg-black/40 px-4 py-2 rounded-xl">Vote ✓</span>
              </div>
            )}

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-sm font-semibold truncate">{art.title}</p>
              <p className="text-white/60 text-[11px] truncate">{art.user_name}</p>

              {/* Vote bar */}
              <AnimatePresence>
                {voted && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-xs font-bold">{pct}%</span>
                      <span className="text-white/50 text-[10px]">{art.vote_count || art.like_count || 0} votes</span>
                    </div>
                    <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ backgroundColor: isWinner ? "#F5A623" : "#fff" }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-2 justify-center">
        <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
        <Swords className="w-5 h-5" style={{ color: "#E07070" }} />
        <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
      </div>
    </div>
  );
}

function Leaderboard({ allArt }) {
  const top = useMemo(() =>
    [...allArt].sort((a, b) => (b.vote_count || b.like_count || 0) - (a.vote_count || a.like_count || 0)).slice(0, 10),
    [allArt]
  );

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-2">
      {top.map((art, idx) => (
        <motion.div key={art.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ backgroundColor: idx < 3 ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${idx < 3 ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.06)"}` }}>
          <span className="text-lg w-8 text-center shrink-0">{medals[idx] || `#${idx + 1}`}</span>
          <img src={art.image_url} alt={art.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{art.title}</p>
            <p className="text-[11px] text-white/40 truncate">{art.user_name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold" style={{ color: idx < 3 ? "#F5A623" : "rgba(255,255,255,0.5)" }}>
              {art.vote_count || art.like_count || 0}
            </p>
            <p className="text-[10px] text-white/30">votes</p>
          </div>
        </motion.div>
      ))}
      {top.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm text-white/30">No votes yet</p>
        </div>
      )}
    </div>
  );
}

export default function ArtVoteArena({ user }) {
  const qc = useQueryClient();
  const [votes, setVotes] = useState({});
  const [matchIndex, setMatchIndex] = useState(0);
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
      id: `piece_${p.id}`,
      _raw_id: p.id,
      _type: "ArtPiece",
      title: p.title,
      image_url: p.image_url,
      user_name: p.creator_name || p.owner_name,
      vote_count: p.like_count || 0,
      like_count: p.like_count || 0,
    }))
  ], [artworks, artPieces]);

  const matches = useMemo(() => {
    // Stable shuffle using matchIndex seed
    const shuffled = [...allArt].sort((a, b) => {
      const seed = a.id.charCodeAt(0) - b.id.charCodeAt(0);
      return seed;
    });
    const pairs = [];
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    }
    return pairs;
  }, [allArt.length]);

  const currentMatch = matches.length > 0 ? matches[matchIndex % matches.length] : null;
  const matchId = currentMatch ? `${currentMatch[0]?.id}_${currentMatch[1]?.id}` : null;
  const voted = matchId ? !!votes[matchId] : false;
  const votedId = matchId ? votes[matchId] : null;

  const handleVote = (artId) => {
    if (!matchId || voted) return;
    setVotes(prev => ({ ...prev, [matchId]: artId }));
    const art = allArt.find(a => a.id === artId);
    if (!art) return;
    if (art._type === "ArtPiece") {
      base44.entities.ArtPiece.update(art._raw_id, { like_count: (art.like_count || 0) + 1 })
        .then(() => qc.invalidateQueries({ queryKey: ["artVotePieces"] }));
    } else {
      base44.entities.Artwork.update(artId, { vote_count: (art.vote_count || 0) + 1 })
        .then(() => qc.invalidateQueries({ queryKey: ["artVoteArtworks"] }));
    }
  };

  const nextMatch = () => {
    setMatchIndex(i => i + 1);
  };

  const totalVoted = Object.keys(votes).length;

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#2E6B4F" }} />
    </div>
  );

  if (allArt.length < 2) return (
    <div className="text-center py-16 px-6">
      <Swords className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
      <p className="text-sm text-white/40">Not enough artworks yet</p>
    </div>
  );

  return (
    <div className="px-4 pb-6">
      {/* Arena header */}
      <div className="flex items-center gap-3 mb-4 pt-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <Swords className="w-4 h-4" style={{ color: "#E07070" }} />
            <p className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>Art Vote Arena</p>
          </div>
          {totalVoted > 0 && (
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{totalVoted} match{totalVoted !== 1 ? "es" : ""} voted</p>
          )}
        </div>
        {/* Sub tabs */}
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          {[["battle", "⚔️"], ["leaderboard", "🏆"]].map(([key, icon]) => (
            <button key={key} onClick={() => setArenaTab(key)}
              className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
              style={{
                backgroundColor: arenaTab === key ? "rgba(255,255,255,0.15)" : "transparent",
                color: arenaTab === key ? "#fff" : "rgba(255,255,255,0.35)",
              }}>
              {icon} {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {arenaTab === "battle" && currentMatch && (
        <>
          {/* Match counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Match {(matchIndex % matches.length) + 1} of {matches.length}
            </span>
            <div className="flex gap-0.5">
              {matches.slice(0, Math.min(matches.length, 8)).map((_, i) => (
                <div key={i} className="w-5 h-1 rounded-full"
                  style={{ backgroundColor: i === matchIndex % matches.length ? "#2E6B4F" : votes[`${matches[i][0]?.id}_${matches[i][1]?.id}`] ? "rgba(46,107,79,0.4)" : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
          </div>

          <VoteBattle
            artA={currentMatch[0]}
            artB={currentMatch[1]}
            onVote={handleVote}
            voted={voted}
            votedId={votedId}
          />

          {/* Next button */}
          {voted && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={nextMatch}
              className="w-full mt-4 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white"
              style={{ backgroundColor: "#2E6B4F" }}>
              Next Battle <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}

          {!voted && (
            <button onClick={nextMatch}
              className="w-full mt-3 py-2 rounded-xl text-sm flex items-center justify-center gap-1.5"
              style={{ color: "rgba(255,255,255,0.25)", backgroundColor: "rgba(255,255,255,0.04)" }}>
              <RefreshCw className="w-3.5 h-3.5" /> Skip match
            </button>
          )}
        </>
      )}

      {arenaTab === "leaderboard" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4" style={{ color: "#F5A623" }} />
            <p className="text-sm font-semibold text-white">All-Time Rankings</p>
          </div>
          <Leaderboard allArt={allArt} />
        </div>
      )}
    </div>
  );
}