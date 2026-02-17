import React, { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function MathSpeed() {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [time, setTime] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [feedback, setFeedback] = useState("");

  const generateQuestion = () => {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let result;
    if (op === "+") result = a + b;
    else if (op === "-") result = a - b;
    else result = a * b;
    return { a, b, op, result, question: `${a} ${op} ${b}` };
  };

  useEffect(() => {
    if (gameActive && time > 0) {
      const timer = setTimeout(() => setTime(time - 1), 1000);
      return () => clearTimeout(timer);
    } else if (time === 0 && gameActive) {
      setGameActive(false);
    }
  }, [time, gameActive]);

  const startGame = () => {
    setQuestion(generateQuestion());
    setScore(0);
    setStreak(0);
    setTime(30);
    setGameActive(true);
    setAnswer("");
    setFeedback("");
  };

  const handleSubmit = () => {
    if (!answer || !gameActive) return;
    
    if (parseInt(answer) === question.result) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      setFeedback("✅ Correct!");
      setQuestion(generateQuestion());
      setAnswer("");
    } else {
      setStreak(0);
      setFeedback("❌ Wrong!");
      setTimeout(() => setFeedback(""), 1000);
    }
  };

  if (!gameActive && score === 0) {
    return (
      <div className="space-y-6 pb-6 text-center">
        <div className="p-6 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-4xl mb-4">🔢</p>
          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Math Speed</h3>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Solve as many equations as you can in 30 seconds!</p>
          <button
            onClick={startGame}
            className="px-6 py-3 rounded-xl font-medium text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Score</p>
          <p className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>{score}</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Streak</p>
          <p className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>{streak}</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: time < 10 ? "rgba(220,60,60,0.1)" : "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: time < 10 ? "#DC3C3C" : "var(--text-hint)" }}>Time</p>
          <p className="text-2xl font-bold" style={{ color: time < 10 ? "#DC3C3C" : "var(--accent-primary)" }}>{time}s</p>
        </div>
      </div>

      {gameActive && question && (
        <>
          {/* Question */}
          <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Solve this:</p>
            <p className="text-5xl font-bold mt-3" style={{ color: "var(--accent-primary)", fontFamily: "monospace" }}>
              {question.question}
            </p>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-3 rounded-xl text-center font-bold ${feedback.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {feedback}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Type answer..."
              autoFocus
              className="flex-1 px-4 py-3 rounded-xl border"
              style={{ borderColor: "var(--border-light)", backgroundColor: "white", color: "var(--text-primary)" }}
            />
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-xl font-medium text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              Answer
            </button>
          </div>
        </>
      )}

      {!gameActive && (
        <div className="p-4 rounded-xl text-center font-bold bg-amber-100 text-amber-700">
          ⏰ Game Over! Final Score: {score}
        </div>
      )}

      {!gameActive && (
        <button
          onClick={startGame}
          className="w-full p-3 rounded-xl font-medium text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}
        >
          Play Again
        </button>
      )}
    </div>
  );
}