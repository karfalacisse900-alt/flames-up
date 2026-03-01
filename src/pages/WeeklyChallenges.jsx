import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Upload, Heart, Trophy, Flame, Zap, X, ChevronRight, Loader2 } from "lucide-react";
import PhotoEditor from "@/components/editor/PhotoEditor";

// ── Countdown ─────────────────────────────────────────────
function Countdown({ target }) {
  const [diff, setDiff] = useState(Math.max(0, new Date(target) - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setDiff(Math.max(0, new Date(target) - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (diff === 0) return <span className="text-xs font-bold" style={{ color: "#E05C7A" }}>Ended</span>;
  return (
    <div className="flex items-center gap-1">
      {d > 0 && <Chip v={d} u="d" />}
      <Chip v={h} u="h" />
      <Chip v={m} u="m" />
      <Chip v={s} u="s" />
    </div>
  );
}
function Chip({ v, u }) {
  return (
    <span className="px-1.5 py-0.5 rounded-lg text-xs font-bold tabular-nums"
      style={{ backgroundColor: "#2E6B4F", color: "#fff", minWidth: 28, textAlign: "center" }}>
      {String(v).padStart(2, "0")}{u}
    </span>
  );
}

// ── Entry Card ─────────────────────────────────────────────
function EntryCard({ entry, canVote, onVote, onLike, user }) {
  const voted = entry.voted_by?.includes(user?.email);
  const liked = entry.liked_by?.includes(user?.email);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FAFAF8", border: "1px solid var(--border-light)" }}>
      <div className="relative">
        <img src={entry.image_url} alt={entry.title} className="w-full aspect-square object-cover" />
        {entry.is_winner && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
            style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#1a1a1a" }}>
            🥇 Winner
          </div>
        )}
        {entry.boost_level && entry.boost_level !== "none" && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: "#E05C7A", color: "#fff" }}>
            🔥 Boosted
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{entry.title || entry.user_name}</p>
        {entry.caption && <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: "var(--text-hint)" }}>{entry.caption}</p>}
        <div className="flex items-center gap-3 mt-2">
          {canVote && (
            <button onClick={() => onVote(entry)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ backgroundColor: voted ? "#2E6B4F" : "var(--bg-subtle)", color: voted ? "#fff" : "var(--text-hint)", border: `1px solid ${voted ? "#2E6B4F" : "var(--border-light)"}` }}>
              <Zap className="w-3 h-3" /> {entry.vote_count || 0}
            </button>
          )}
          <button onClick={() => onLike(entry)}
            className="flex items-center gap-1 text-xs"
            style={{ color: liked ? "#E05C7A" : "var(--text-hint)" }}>
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
            {entry.like_count || 0}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Submit Modal ───────────────────────────────────────────
function SubmitModal({ challenge, user, onClose }) {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!file || !user) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ChallengeEntry.create({
      challenge_id: challenge.id,
      image_url: file_url,
      title: title.trim() || "My Entry",
      caption: caption.trim(),
      user_email: user.email,
      user_name: user.full_name || "Artist",
      vote_count: 0,
      like_count: 0,
      voted_by: [],
      liked_by: [],
    });
    await base44.entities.PhotoChallenge.update(challenge.id, {
      submission_count: (challenge.submission_count || 0) + 1,
    });
    qc.invalidateQueries({ queryKey: ["challengeEntries", challenge.id] });
    qc.invalidateQueries({ queryKey: ["challenges"] });
    setUploading(false);
    setDone(true);
    setTimeout(onClose, 1600);
  };

  if (done) return (
    <div className="p-8 text-center">
      <p className="text-4xl mb-3">🎉</p>
      <p className="font-bold" style={{ color: "var(--text-primary)" }}>Entry submitted!</p>
      <p className="text-sm mt-1" style={{ color: "var(--text-hint)" }}>Good luck in the challenge!</p>
    </div>
  );

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Submit Entry</h3>
        <button onClick={onClose}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>
      </div>

      <input type="file" accept="image/*" className="hidden" ref={fileRef}
        onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />

      <button onClick={() => fileRef.current?.click()}
        className="w-full rounded-2xl overflow-hidden border-2 border-dashed min-h-[120px] flex items-center justify-center"
        style={{ borderColor: preview ? "#2E6B4F" : "var(--border-medium)" }}>
        {preview ? <img src={preview} alt="preview" className="w-full max-h-48 object-cover" />
          : <div className="text-center py-6"><Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-hint)" }} /><p className="text-xs" style={{ color: "var(--text-hint)" }}>Tap to choose photo</p></div>
        }
      </button>

      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Entry title (optional)"
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

      <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)" rows={2}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

      <button onClick={handleSubmit} disabled={!file || uploading}
        className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Entry"}
      </button>
    </div>
  );
}

// ── Challenge Card ─────────────────────────────────────────
function ChallengeCard({ challenge, onSelect }) {
  const statusColor = { upcoming: "#BF9E79", submissions_open: "#2E6B4F", voting_open: "#E05C7A", completed: "#888" };
  const statusLabel = { upcoming: "Coming Soon", submissions_open: "Open for Submissions", voting_open: "Voting Live!", completed: "Completed" };
  const countdownTarget = challenge.status === "submissions_open" ? challenge.submissions_end
    : challenge.status === "voting_open" ? challenge.voting_end : null;

  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={() => onSelect(challenge)}
      className="p-4 rounded-2xl cursor-pointer"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", background: "linear-gradient(135deg, #2E6B4F08, #D98B6205)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: statusColor[challenge.status] + "22", color: statusColor[challenge.status] }}>
              {statusLabel[challenge.status]}
            </span>
          </div>
          <h3 className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            📸 {challenge.theme}
          </h3>
          {challenge.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{challenge.description}</p>}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {countdownTarget && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
                <Countdown target={countdownTarget} />
              </div>
            )}
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>
              {challenge.submission_count || 0} submissions
            </span>
            {challenge.prize_badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "linear-gradient(135deg, #FFD70033, #FFA50022)", color: "#B8860B" }}>
                🏆 {challenge.prize_badge}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "var(--text-hint)" }} />
      </div>
    </motion.div>
  );
}

// ── Challenge Detail ───────────────────────────────────────
function ChallengeDetail({ challenge, user, onBack }) {
  const qc = useQueryClient();
  const [showSubmit, setShowSubmit] = useState(false);

  const { data: entries = [] } = useQuery({
    queryKey: ["challengeEntries", challenge.id],
    queryFn: () => base44.entities.ChallengeEntry.filter({ challenge_id: challenge.id }, "-vote_count", 100),
  });

  const canSubmit = challenge.status === "submissions_open" && user
    && !entries.some(e => e.user_email === user.email);
  const canVote = challenge.status === "voting_open" && user;

  const voteMut = useMutation({
    mutationFn: (entry) => {
      const alreadyVoted = entry.voted_by?.includes(user.email);
      if (alreadyVoted) return Promise.resolve();
      return base44.entities.ChallengeEntry.update(entry.id, {
        vote_count: (entry.vote_count || 0) + 1,
        voted_by: [...(entry.voted_by || []), user.email],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challengeEntries", challenge.id] }),
  });

  const likeMut = useMutation({
    mutationFn: (entry) => {
      const liked = entry.liked_by?.includes(user?.email);
      return base44.entities.ChallengeEntry.update(entry.id, liked
        ? { like_count: Math.max(0, (entry.like_count || 0) - 1), liked_by: (entry.liked_by || []).filter(e => e !== user.email) }
        : { like_count: (entry.like_count || 0) + 1, liked_by: [...(entry.liked_by || []), user.email] });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challengeEntries", challenge.id] }),
  });

  // Sort: winners first, then by votes
  const sorted = [...entries].sort((a, b) => {
    if (a.is_winner && !b.is_winner) return -1;
    if (!a.is_winner && b.is_winner) return 1;
    const aBoost = a.boost_level !== "none" ? 2 : 0;
    const bBoost = b.boost_level !== "none" ? 2 : 0;
    return (b.vote_count || 0) + bBoost - ((a.vote_count || 0) + aBoost);
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4 sticky top-0 z-10" style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)" }}>
        <button onClick={onBack} className="flex items-center gap-2 mb-3 text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
          ← Back
        </button>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>📸 {challenge.theme}</h2>
        {challenge.description && <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{challenge.description}</p>}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {challenge.prize_badge && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "linear-gradient(135deg, #FFD70033, #FFA50022)", color: "#B8860B" }}>
              🏆 {challenge.prize_badge}
            </span>
          )}
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>{entries.length} entries</span>
        </div>
        {canSubmit && (
          <button onClick={() => setShowSubmit(true)}
            className="mt-3 w-full py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
            <Upload className="w-4 h-4" /> Submit Your Photo
          </button>
        )}
        {challenge.status === "voting_open" && (
          <div className="mt-2 p-2.5 rounded-xl text-xs text-center font-semibold"
            style={{ background: "#E05C7A18", color: "#E05C7A", border: "1px solid #E05C7A25" }}>
            🗳️ Voting is live! Tap an entry to vote.
          </div>
        )}
      </div>

      {/* Entries grid */}
      <div className="px-4 pt-4 pb-24" style={{ columns: "2", columnGap: "12px" }}>
        {sorted.map(entry => (
          <div key={entry.id} className="break-inside-avoid mb-3">
            <EntryCard entry={entry} canVote={canVote} onVote={e => voteMut.mutate(e)} onLike={e => likeMut.mutate(e)} user={user} />
          </div>
        ))}
        {entries.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <p className="text-4xl mb-2">📸</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No entries yet — be the first!</p>
          </div>
        )}
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowSubmit(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="w-full max-w-lg mx-auto rounded-t-3xl overflow-y-auto"
              style={{ backgroundColor: "#FAFAF8", maxHeight: "90dvh" }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />
              <SubmitModal challenge={challenge} user={user} onClose={() => setShowSubmit(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function WeeklyChallenges() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => base44.entities.PhotoChallenge.list("-created_date", 20),
  });

  const active = challenges.filter(c => c.status !== "completed");
  const past = challenges.filter(c => c.status === "completed");

  if (selected) return <ChallengeDetail challenge={selected} user={user} onBack={() => setSelected(null)} />;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Hero */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>📸</div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Weekly Challenges</h1>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Submit. Vote. Win.</p>
          </div>
        </div>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Every week a new theme drops. Submit your best shot, get community votes, and win the 🥇 Gold Badge.
        </p>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {isLoading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} /></div>}

        {active.length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>Active Challenges</p>
            {active.map(c => <ChallengeCard key={c.id} challenge={c} onSelect={setSelected} />)}
          </>
        )}

        {!isLoading && active.length === 0 && (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🏆</p>
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No active challenges right now</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Check back soon — new themes drop weekly</p>
          </div>
        )}

        {past.length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-wider mt-4" style={{ color: "var(--text-hint)" }}>Past Challenges</p>
            {past.map(c => <ChallengeCard key={c.id} challenge={c} onSelect={setSelected} />)}
          </>
        )}
      </div>
    </div>
  );
}