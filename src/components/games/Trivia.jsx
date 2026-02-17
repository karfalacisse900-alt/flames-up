import React, { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

const triviaQuestions = [
  { q: "What's the capital of France?", options: ["Paris", "Lyon", "Nice", "Marseille"], correct: 0 },
  { q: "Which planet is closest to the sun?", options: ["Mercury", "Venus", "Earth", "Mars"], correct: 0 },
  { q: "What's the largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 },
  { q: "How many continents are there?", options: ["5", "6", "7", "8"], correct: 2 },
  { q: "What's the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correct: 2 },
  { q: "Who painted the Mona Lisa?", options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"], correct: 1 },
  { q: "What's the square root of 144?", options: ["10", "12", "14", "16"], correct: 1 },
  { q: "Which country has the most population?", options: ["USA", "India", "China", "Russia"], correct: 2 },
  { q: "What's the fastest land animal?", options: ["Lion", "Cheetah", "Antelope", "Greyhound"], correct: 1 },
  { q: "How many strings does a violin have?", options: ["3", "4", "5", "6"], correct: 1 },
];

export default function Trivia() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [answered, setAnswered] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const startGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setGameActive(true);
    setAnswered(null);
    setSelectedAnswer(null);
  };

  const handleAnswer = (index) => {
    if (answered !== null) return;
    setSelectedAnswer(index);
    const isCorrect = index === triviaQuestions[currentQuestion].correct;
    if (isCorrect) setScore(prev => prev + 1);
    setAnswered(isCorrect);
  };

  const handleNext = () => {
    if (currentQuestion < triviaQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setAnswered(null);
      setSelectedAnswer(null);
    } else {
      setGameActive(false);
    }
  };

  if (!gameActive) {
    return (
      <div className="space-y-6 pb-6 text-center">
        <div className="p-6 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {score > 0 ? (
            <>
              <p className="text-4xl mb-4">{score >= 8 ? "🏆" : score >= 5 ? "🎯" : "📚"}</p>
              <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Quiz Complete!</h3>
              <p className="text-3xl font-bold mb-4" style={{ color: "var(--accent-primary)" }}>{score} / 10</p>
            </>
          ) : (
            <>
              <p className="text-4xl mb-4">❓</p>
              <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Trivia Battle</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Answer 10 questions and test your knowledge!</p>
            </>
          )}
          <button
            onClick={startGame}
            className="mt-6 px-6 py-3 rounded-xl font-medium text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            {score > 0 ? "Try Again" : "Start Game"}
          </button>
        </div>
      </div>
    );
  }

  const q = triviaQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / triviaQuestions.length) * 100;

  return (
    <div className="space-y-6 pb-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Question {currentQuestion + 1}/10</p>
          <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>Score: {score}</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-light)" }}>
          <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: "var(--accent-primary)" }} />
        </div>
      </div>

      {/* Question */}
      <div className="p-6 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{q.q}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = index === q.correct;
          let bgColor = "var(--bg-card)";
          let borderColor = "var(--border-light)";
          
          if (answered !== null) {
            if (isCorrect) {
              bgColor = "#dcfce7";
              borderColor = "#4ade80";
            } else if (isSelected && !isCorrect) {
              bgColor = "#fee2e2";
              borderColor = "#ef4444";
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={answered !== null}
              className="w-full p-4 rounded-xl text-left transition-all"
              style={{
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                opacity: answered !== null && !isCorrect && !isSelected ? 0.5 : 1,
                color: "var(--text-primary)"
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "var(--bg-app)" }}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span>{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered !== null && (
        <div className={`p-4 rounded-xl text-center font-bold ${answered ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {answered ? "✅ Correct!" : "❌ Wrong!"}
        </div>
      )}

      {/* Next Button */}
      {answered !== null && (
        <button
          onClick={handleNext}
          className="w-full p-3 rounded-xl font-medium text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}
        >
          {currentQuestion === triviaQuestions.length - 1 ? "See Results" : "Next Question"}
        </button>
      )}
    </div>
  );
}