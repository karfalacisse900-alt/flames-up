import React, { useState } from "react";
import { RotateCcw, Zap } from "lucide-react";

const choices = ["Rock", "Paper", "Scissors"];
const choiceEmojis = { Rock: "✊", Paper: "✋", Scissors: "✌️" };

export default function RockPaperScissors({ mode }) {
  const [playerChoice, setPlayerChoice] = useState(null);
  const [aiChoice, setAiChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const determineWinner = (player, ai) => {
    if (player === ai) return "tie";
    if ((player === "Rock" && ai === "Scissors") || 
        (player === "Paper" && ai === "Rock") || 
        (player === "Scissors" && ai === "Paper")) {
      return "win";
    }
    return "lose";
  };

  const handleChoice = (choice) => {
    const randomAi = choices[Math.floor(Math.random() * choices.length)];
    setPlayerChoice(choice);
    setAiChoice(randomAi);
    
    const outcome = determineWinner(choice, randomAi);
    setResult(outcome);
    setGameStarted(true);

    if (outcome === "win") setPlayerScore(prev => prev + 1);
    if (outcome === "lose") setAiScore(prev => prev + 1);
  };

  const reset = () => {
    setPlayerScore(0);
    setAiScore(0);
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
    setGameStarted(false);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Scores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Your Score</p>
          <p className="text-3xl font-bold mt-1" style={{ color: "var(--accent-primary)" }}>{playerScore}</p>
        </div>
        <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>AI Score</p>
          <p className="text-3xl font-bold mt-1" style={{ color: "var(--text-secondary)" }}>{aiScore}</p>
        </div>
      </div>

      {/* Game Area */}
      {gameStarted && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-2xl" style={{ backgroundColor: "rgba(60,110,90,0.1)", border: "2px solid var(--accent-primary)" }}>
              <p className="text-xs mb-2" style={{ color: "var(--text-hint)" }}>Your Choice</p>
              <div className="text-5xl">{choiceEmojis[playerChoice]}</div>
              <p className="text-sm font-medium mt-2" style={{ color: "var(--text-primary)" }}>{playerChoice}</p>
            </div>
            <div className="text-center p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <p className="text-xs mb-2" style={{ color: "var(--text-hint)" }}>AI Choice</p>
              <div className="text-5xl">{choiceEmojis[aiChoice]}</div>
              <p className="text-sm font-medium mt-2" style={{ color: "var(--text-primary)" }}>{aiChoice}</p>
            </div>
          </div>

          {/* Result */}
          <div className={`p-4 rounded-2xl text-center font-bold text-lg ${
            result === "win" ? "bg-green-100 text-green-700" : 
            result === "lose" ? "bg-red-100 text-red-700" : 
            "bg-yellow-100 text-yellow-700"
          }`}>
            {result === "win" ? "🎉 You Win!" : result === "lose" ? "😢 You Lose!" : "🤝 It's a Tie!"}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!gameStarted ? (
          <>
            <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>Make your choice:</p>
            <div className="grid grid-cols-3 gap-2">
              {choices.map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  className="p-4 rounded-xl border transition-all active:scale-95"
                  style={{ 
                    backgroundColor: "var(--bg-card)", 
                    borderColor: "var(--border-light)",
                    color: "var(--text-primary)"
                  }}
                >
                  <div className="text-3xl mb-1">{choiceEmojis[choice]}</div>
                  <p className="text-xs font-medium">{choice}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <button
            onClick={() => setGameStarted(false)}
            className="w-full p-3 rounded-xl font-medium text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <Zap className="w-4 h-4" /> Play Again
          </button>
        )}
      </div>

      {/* Reset Button */}
      <button
        onClick={reset}
        className="w-full p-2 rounded-lg border flex items-center justify-center gap-2 text-sm"
        style={{ borderColor: "var(--border-light)", color: "var(--text-hint)" }}
      >
        <RotateCcw className="w-4 h-4" /> Reset Score
      </button>
    </div>
  );
}