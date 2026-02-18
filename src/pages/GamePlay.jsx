import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trophy, Clock, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import RockPaperScissors from "../components/games/RockPaperScissors";
import TicTacToeCompact from "../components/games/TicTacToe";
import MemoryMatchCompact from "../components/games/MemoryMatch";
import MathSpeedCompact from "../components/games/MathSpeed";
import TriviaCompact from "../components/games/Trivia";
import CheckersGame from "../components/games/Checkers";
import MazeRunnerGame from "../components/games/MazeRunner";
import ReactionSpeedGame2 from "../components/games/ReactionSpeed";
import ColorConnectGame from "../components/games/ColorConnect";

// ============= MEMORY MATCH =============
function MemoryMatchGame({ onEnd }) {
  const emojis = ["🌿", "🍃", "🌸", "🌺", "🦋", "🐝", "🌻", "🍂"];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [wrong, setWrong] = useState([]);

  useEffect(() => {
    const shuffled = [...emojis, ...emojis].sort(() => Math.random() - 0.5).map((e, i) => ({ id: i, emoji: e }));
    setCards(shuffled);
  }, []);

  const handleFlip = (idx) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return;
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        const newMatched = [...matched, newFlipped[0], newFlipped[1]];
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.length === cards.length) {
          setTimeout(() => onEnd(true, moves + 1), 500);
        }
      } else {
        setWrong(newFlipped);
        setTimeout(() => { setFlipped([]); setWrong([]); }, 800);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm px-1" style={{ color: "var(--text-hint)" }}>
        <span>Moves: <strong style={{ color: "var(--accent-primary)" }}>{moves}</strong></span>
        <span>Pairs: <strong style={{ color: "var(--accent-primary)" }}>{matched.length / 2} / 8</strong></span>
      </div>
      <div className="grid grid-cols-4 gap-2 p-3 rounded-3xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || matched.includes(idx);
          const isMatch = matched.includes(idx);
          const isWrong = wrong.includes(idx);
          return (
            <motion.button
              key={card.id}
              onClick={() => handleFlip(idx)}
              whileTap={{ scale: isFlipped ? 1 : 0.88 }}
              className="aspect-square rounded-xl flex items-center justify-center text-2xl"
              style={{
                backgroundColor: isMatch ? "rgba(60,110,90,0.12)" : isWrong ? "rgba(224,92,122,0.12)" : isFlipped ? "white" : "var(--bg-app)",
                border: `2px solid ${isMatch ? "var(--accent-primary)" : isWrong ? "#E05C7A" : isFlipped ? "var(--border-medium)" : "var(--border-light)"}`,
                transition: "background 0.2s, border 0.2s",
              }}
            >
              <motion.span
                animate={{ rotateY: isFlipped ? 0 : 180 }}
                transition={{ duration: 0.3 }}
                style={{ display: "inline-block" }}
              >
                {isFlipped ? card.emoji : <span style={{ color: "var(--text-hint)", fontSize: "1rem" }}>?</span>}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============= REACTION SPEED =============
function ReactionSpeedGame({ onEnd }) {
  const [state, setState] = useState("waiting");
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [best, setBest] = useState(null);
  const timeoutRef = useRef(null);

  const start = () => {
    setState("ready");
    const delay = 2000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      setState("go");
      setStartTime(Date.now());
    }, delay);
  };

  const handleTap = () => {
    if (state === "waiting") { start(); return; }
    if (state === "ready") { clearTimeout(timeoutRef.current); setState("waiting"); return; }
    if (state === "go") {
      const t = Date.now() - startTime;
      setReactionTime(t);
      if (!best || t < best) setBest(t);
      setState("done");
      onEnd(true, t);
    }
  };

  const bgMap = {
    waiting: "var(--bg-card)", ready: "#fff0f0", go: "#f0fff8", done: "var(--bg-card)",
  };
  const borderMap = {
    waiting: "var(--border-light)", ready: "#fca5a5", go: "#6ee7b7", done: "var(--accent-primary)",
  };

  const rating = reactionTime < 200 ? "⚡ Superhuman!" : reactionTime < 300 ? "🏆 Excellent!" : reactionTime < 450 ? "👍 Good!" : "🐢 Keep practicing!";

  return (
    <div className="flex flex-col items-center gap-4" style={{ minHeight: "40vh" }}>
      <motion.button
        onClick={handleTap}
        animate={{ scale: state === "go" ? [1, 1.02, 1] : 1 }}
        transition={{ repeat: state === "go" ? Infinity : 0, duration: 0.5 }}
        className="w-full py-24 rounded-3xl text-center"
        style={{ backgroundColor: bgMap[state], border: `3px solid ${borderMap[state]}`, transition: "background 0.3s, border 0.3s" }}
      >
        {state === "waiting" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>Tap to Start</p>
          </motion.div>
        )}
        {state === "ready" && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="text-xl font-bold text-rose-500">Get ready…</p>
            <p className="text-sm text-rose-400 mt-1">Don't tap yet!</p>
          </motion.div>
        )}
        {state === "go" && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400 }}>
            <p className="text-4xl font-black text-emerald-600">TAP NOW!</p>
          </motion.div>
        )}
        {state === "done" && (
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
            <p className="text-5xl font-black" style={{ color: "var(--accent-primary)" }}>{reactionTime}<span className="text-2xl">ms</span></p>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{rating}</p>
            {best && <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Best: {best}ms</p>}
          </motion.div>
        )}
      </motion.button>
      {state === "done" && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => { setState("waiting"); setReactionTime(0); }}
          className="px-6 py-2.5 rounded-2xl font-semibold text-white text-sm"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          Try Again
        </motion.button>
      )}
    </div>
  );
}

// ============= TIC TAC TOE =============
function TicTacToeGame({ onEnd }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [winner, setWinner] = useState(null);

  const checkWinner = (b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,bb,c] of lines) {
      if (b[a] && b[a] === b[bb] && b[a] === b[c]) return { w: b[a], line: [a,bb,c] };
    }
    return b.every(Boolean) ? { w: "draw", line: [] } : null;
  };

  const aiMove = useCallback((b) => {
    const empty = b.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
    if (empty.length === 0) return b;
    const idx = empty[Math.floor(Math.random() * empty.length)];
    const nb = [...b]; nb[idx] = "O"; return nb;
  }, []);

  const handleClick = (idx) => {
    if (board[idx] || winner) return;
    const nb = [...board]; nb[idx] = "X";
    let res = checkWinner(nb);
    if (res) { setBoard(nb); setWinner(res); onEnd(res.w === "X", 0); return; }
    const afterAI = aiMove(nb);
    res = checkWinner(afterAI);
    setBoard(afterAI);
    if (res) { setWinner(res); onEnd(res.w === "X", 0); }
  };

  return (
    <div className="space-y-4">
      {winner && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl text-center font-bold text-sm"
          style={{
            backgroundColor: winner.w === "X" ? "rgba(60,110,90,0.12)" : winner.w === "O" ? "rgba(224,92,122,0.12)" : "rgba(245,158,11,0.12)",
            color: winner.w === "X" ? "var(--accent-primary)" : winner.w === "O" ? "#E05C7A" : "#B45309",
          }}>
          {winner.w === "draw" ? "🤝 It's a draw!" : winner.w === "X" ? "🎉 You win!" : "🤖 AI wins!"}
        </motion.div>
      )}
      <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto p-3 rounded-3xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        {board.map((cell, idx) => {
          const isWin = winner?.line?.includes(idx);
          return (
            <motion.button
              key={idx}
              onClick={() => handleClick(idx)}
              whileTap={{ scale: cell ? 1 : 0.88 }}
              className="aspect-square rounded-xl flex items-center justify-center text-3xl font-black"
              style={{
                backgroundColor: isWin ? (winner?.w === "X" ? "rgba(60,110,90,0.15)" : "rgba(224,92,122,0.15)") : "var(--bg-app)",
                border: `2px solid ${isWin ? (winner?.w === "X" ? "var(--accent-primary)" : "#E05C7A") : "var(--border-light)"}`,
              }}
            >
              {cell && (
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  style={{ color: cell === "X" ? "var(--accent-primary)" : "#E05C7A" }}>
                  {cell}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============= MATH SPEED =============
function MathSpeedGame({ onEnd }) {
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const inputRef = useRef(null);

  const generateQ = () => {
    const ops = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b;
    if (op === "×") { a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; }
    else { a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * 30) + 1; }
    const result = op === "+" ? a + b : op === "-" ? a - b : a * b;
    return { text: `${a} ${op} ${b}`, result };
  };

  useEffect(() => { setQuestion(generateQ()); }, []);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { setGameOver(true); onEnd(true, score); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, score, onEnd]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const correct = parseInt(answer) === question.result;
    if (correct) setScore((s) => s + 1);
    setFeedback(correct ? "correct" : "wrong");
    setTimeout(() => setFeedback(null), 300);
    setAnswer(""); setQuestion(generateQ());
    inputRef.current?.focus();
  };

  const timerColor = timeLeft <= 5 ? "#E05C7A" : timeLeft <= 10 ? "#D98B62" : "var(--accent-primary)";

  if (gameOver) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 space-y-2">
      <div className="text-5xl mb-3">🔢</div>
      <p className="text-4xl font-black" style={{ color: "var(--accent-primary)" }}>{score}</p>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>correct answers in 30s</p>
    </motion.div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Score</p>
          <motion.p key={score} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>{score}</motion.p>
        </div>
        <div className="p-3 rounded-2xl text-center" style={{ backgroundColor: timeLeft <= 5 ? "rgba(224,92,122,0.1)" : "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Time</p>
          <motion.p key={timeLeft} animate={{ scale: timeLeft <= 5 ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.3 }}
            className="text-2xl font-bold" style={{ color: timerColor }}>{timeLeft}s</motion.p>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-light)" }}>
        <motion.div animate={{ width: `${(timeLeft / 30) * 100}%` }} transition={{ duration: 0.9, ease: "linear" }}
          className="h-full rounded-full" style={{ backgroundColor: timerColor }} />
      </div>
      <motion.div key={question?.text}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
        className="p-6 rounded-3xl text-center"
        style={{
          backgroundColor: feedback === "correct" ? "rgba(60,110,90,0.1)" : feedback === "wrong" ? "rgba(224,92,122,0.1)" : "var(--bg-card)",
          border: `2px solid ${feedback === "correct" ? "var(--accent-primary)" : feedback === "wrong" ? "#E05C7A" : "var(--border-light)"}`,
          transition: "background 0.15s, border 0.15s",
        }}>
        <p className="text-5xl font-black" style={{ color: "var(--text-primary)" }}>{question?.text}</p>
      </motion.div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input ref={inputRef} type="number" value={answer} onChange={e => setAnswer(e.target.value)}
          placeholder="Answer…" autoFocus
          className="flex-1 px-4 py-3.5 rounded-2xl border text-center text-xl font-bold outline-none"
          style={{ borderColor: "var(--border-medium)", backgroundColor: "white", color: "var(--text-primary)" }} />
        <Button type="submit" className="px-5 rounded-2xl" style={{ backgroundColor: "var(--accent-primary)" }}>✓</Button>
      </form>
    </div>
  );
}

// ============= MAIN GAMEPLAY PAGE =============
export default function GamePlay() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");
  const mode = params.get("mode") || "ai";
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const gameNames = {
    maze: "Maze Runner", "color-connect": "Color Connect", reaction: "Reaction Speed",
    memory: "Memory Match", "math-speed": "Math Speed", trivia: "Trivia Battle",
    "tic-tac-toe": "Tic-Tac-Toe", checkers: "Checkers", chess: "Chess", "ping-pong": "Ping Pong",
  };

  const handleGameEnd = async (won, score) => {
    setResult({ won, score });
    if (user?.email) {
      const existing = await base44.entities.GameStats.filter({ player_email: user.email, game_name: gameId });
      if (existing.length > 0) {
        const s = existing[0];
        await base44.entities.GameStats.update(s.id, {
          games_played: (s.games_played || 0) + 1,
          wins: (s.wins || 0) + (won ? 1 : 0),
          losses: (s.losses || 0) + (won ? 0 : 1),
          best_score: Math.max(s.best_score || 0, score || 0),
        });
      } else {
        await base44.entities.GameStats.create({
          player_email: user.email,
          game_name: gameId,
          games_played: 1,
          wins: won ? 1 : 0,
          losses: won ? 0 : 1,
          best_score: score || 0,
        });
      }
    }
  };

  const renderGame = () => {
    switch (gameId) {
      case "memory": return <MemoryMatchGame onEnd={handleGameEnd} />;
      case "reaction": return <ReactionSpeedGame onEnd={handleGameEnd} />;
      case "tic-tac-toe": return <TicTacToeGame onEnd={handleGameEnd} />;
      case "math-speed": return <MathSpeedGame onEnd={handleGameEnd} />;
      case "rock-paper-scissors": return <RockPaperScissors mode={mode} />;
      case "color-connect": return <TriviaCompact />;
      case "trivia": return <TriviaCompact />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🎮</p>
            <p className="font-serif text-lg text-[#6B6B6B]" style={{ fontFamily: "var(--font-serif)" }}>
              {gameNames[gameId] || "Game"} – Coming Soon
            </p>
            <p className="text-sm text-[#9B9B9B] mt-1">This game is being built. Stay tuned!</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 sticky top-0 z-40" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <Link to={createPageUrl("Games")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-app)" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
        </Link>
        <div className="flex-1">
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{gameNames[gameId] || "Game"}</h2>
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>{mode === "ai" ? "🤖 vs AI" : mode === "friend" ? "👥 vs Friend" : "🔀 vs Random"}</span>
        </div>
      </div>

      <div className="p-5">
        {renderGame()}
      </div>

      {/* Result overlay */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-5"
          style={{ backgroundColor: "var(--bg-nav)", borderTop: "1px solid var(--border-light)" }}
        >
          <div className="max-w-lg mx-auto text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
              <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--accent-secondary)" }} />
            </motion.div>
            <p className="font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              {result.won ? "🎉 Well done!" : "💪 Nice try!"}
            </p>
            <div className="flex gap-3 mt-4 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl gap-2"
                style={{ borderColor: "var(--border-light)" }}>
                <RotateCcw className="w-4 h-4" /> Play Again
              </Button>
              <Link to={createPageUrl("Games")}>
                <Button className="rounded-xl" style={{ backgroundColor: "var(--accent-primary)" }}>Back to Games</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}