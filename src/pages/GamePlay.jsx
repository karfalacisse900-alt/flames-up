import React, { useState, useEffect, useCallback, useRef } from "react";
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

// ============= MEMORY MATCH =============
function MemoryMatchGame({ onEnd }) {
  const emojis = ["🌿", "🍃", "🌸", "🌺", "🦋", "🐝", "🌻", "🍂"];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);

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
        setMatched((m) => [...m, newFlipped[0], newFlipped[1]]);
        setFlipped([]);
        if (matched.length + 2 === cards.length) {
          setTimeout(() => onEnd(true, moves + 1), 500);
        }
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div>
      <div className="text-center mb-4">
        <span className="text-sm text-[#6B6B6B]">Moves: {moves}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || matched.includes(idx);
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(idx)}
              className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 ${
                isFlipped ? "bg-white border-2 border-[#7C8C6E]" : "bg-[#F5F0EB] border-2 border-[#EDE9E3] hover:border-[#C4A882]"
              }`}
            >
              {isFlipped ? card.emoji : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============= REACTION SPEED =============
function ReactionSpeedGame({ onEnd }) {
  const [state, setState] = useState("waiting"); // waiting, ready, go, done
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
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
    if (state === "ready") {
      clearTimeout(timeoutRef.current);
      setState("waiting");
      return;
    }
    if (state === "go") {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setState("done");
      onEnd(true, time);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "40vh" }}>
      <button
        onClick={handleTap}
        className={`w-full py-20 rounded-2xl text-center transition-all ${
          state === "waiting" ? "bg-[#F5F0EB] border-2 border-[#EDE9E3]" :
          state === "ready" ? "bg-rose-50 border-2 border-rose-200" :
          state === "go" ? "bg-emerald-50 border-2 border-emerald-200" :
          "bg-white border-2 border-[#7C8C6E]"
        }`}
      >
        {state === "waiting" && <div><Zap className="w-10 h-10 mx-auto mb-2 text-[#9B9B9B]" /><p className="text-sm text-[#6B6B6B]">Tap to start</p></div>}
        {state === "ready" && <div><p className="text-lg text-rose-500 font-medium">Wait for green...</p><p className="text-xs text-rose-400 mt-1">Don't tap yet!</p></div>}
        {state === "go" && <div><p className="text-2xl text-emerald-600 font-bold">TAP NOW!</p></div>}
        {state === "done" && <div><p className="text-3xl font-bold text-[#7C8C6E]">{reactionTime}ms</p><p className="text-sm text-[#9B9B9B] mt-1">Your reaction time</p></div>}
      </button>
      {state === "done" && (
        <button onClick={() => { setState("waiting"); setReactionTime(0); }} className="mt-4 text-sm text-[#7C8C6E] underline">Try again</button>
      )}
    </div>
  );
}

// ============= TIC TAC TOE =============
function TicTacToeGame({ onEnd }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [winner, setWinner] = useState(null);

  const checkWinner = (b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,bb,c] of lines) {
      if (b[a] && b[a] === b[bb] && b[a] === b[c]) return b[a];
    }
    return b.every(Boolean) ? "draw" : null;
  };

  const aiMove = useCallback((b) => {
    const empty = b.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
    if (empty.length === 0) return b;
    const idx = empty[Math.floor(Math.random() * empty.length)];
    const newBoard = [...b];
    newBoard[idx] = "O";
    return newBoard;
  }, []);

  const handleClick = (idx) => {
    if (board[idx] || winner) return;
    const newBoard = [...board];
    newBoard[idx] = "X";
    let w = checkWinner(newBoard);
    if (w) { setBoard(newBoard); setWinner(w); onEnd(w === "X", 0); return; }
    const afterAI = aiMove(newBoard);
    w = checkWinner(afterAI);
    setBoard(afterAI);
    if (w) { setWinner(w); onEnd(w === "X", 0); }
  };

  return (
    <div>
      {winner && (
        <div className="text-center mb-4">
          <span className="text-lg font-serif" style={{ fontFamily: "var(--font-serif)" }}>
            {winner === "draw" ? "It's a draw!" : winner === "X" ? "You win! 🎉" : "AI wins!"}
          </span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(idx)}
            className="aspect-square rounded-xl bg-white border-2 border-[#EDE9E3] flex items-center justify-center text-2xl font-bold hover:border-[#7C8C6E] transition-colors"
          >
            <span className={cell === "X" ? "text-[#7C8C6E]" : "text-[#C4A882]"}>{cell}</span>
          </button>
        ))}
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

  const generateQ = () => {
    const ops = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b;
    if (op === "×") { a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; }
    else { a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * 30) + 1; }
    const result = op === "+" ? a + b : op === "-" ? a - b : a * b;
    return { text: `${a} ${op} ${b}`, result };
  };

  useEffect(() => {
    setQuestion(generateQ());
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setGameOver(true); onEnd(true, score); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, score, onEnd]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseInt(answer) === question.result) {
      setScore((s) => s + 1);
    }
    setAnswer("");
    setQuestion(generateQ());
  };

  if (gameOver) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🔢</p>
        <p className="text-2xl font-bold text-[#7C8C6E]">{score} correct</p>
        <p className="text-sm text-[#9B9B9B] mt-1">in 30 seconds</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex justify-between mb-6">
        <span className="text-sm text-[#6B6B6B]">Score: {score}</span>
        <span className="text-sm text-[#6B6B6B] flex items-center gap-1"><Clock className="w-3 h-3" /> {timeLeft}s</span>
      </div>
      <p className="text-4xl font-bold text-[#2C2C2C] mb-6" style={{ fontFamily: "var(--font-serif)" }}>{question?.text}</p>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-[200px] mx-auto">
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="flex-1 text-center text-xl border-2 border-[#EDE9E3] rounded-xl p-3 focus:border-[#7C8C6E] outline-none"
          autoFocus
        />
        <Button type="submit" className="bg-[#7C8C6E] hover:bg-[#6B7B5E] rounded-xl px-4">Go</Button>
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
    <div className="min-h-screen">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[#EDE9E3] bg-white">
        <Link to={createPageUrl("Games")} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="font-medium text-sm">{gameNames[gameId] || "Game"}</h2>
          <span className="text-xs text-[#9B9B9B]">{mode === "ai" ? "vs AI" : mode === "friend" ? "vs Friend" : "vs Random"}</span>
        </div>
      </div>

      <div className="p-5 mt-4">
        {renderGame()}
      </div>

      {result && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EDE9E3] p-5 z-50">
          <div className="max-w-lg mx-auto text-center">
            <Trophy className="w-8 h-8 mx-auto text-[#C4A882] mb-2" />
            <p className="font-serif text-lg" style={{ fontFamily: "var(--font-serif)" }}>
              {result.won ? "Well done!" : "Nice try!"}
            </p>
            <div className="flex gap-3 mt-4 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl gap-2 border-[#EDE9E3]">
                <RotateCcw className="w-4 h-4" /> Play Again
              </Button>
              <Link to={createPageUrl("Games")}>
                <Button className="rounded-xl bg-[#7C8C6E] hover:bg-[#6B7B5E]">Back to Games</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}