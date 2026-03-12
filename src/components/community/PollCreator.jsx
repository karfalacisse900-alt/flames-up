import React, { useState } from "react";
import { X, Plus } from "lucide-react";

export default function PollCreator({ onPollCreate, onCancel }) {
  const [pollType, setPollType] = useState("multiple_choice");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    setError("");

    if (!question.trim()) {
      setError("Poll question is required");
      return;
    }

    const filledOptions = options.filter((opt) => opt.trim());
    if (filledOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    const pollData = {
      poll_type: pollType,
      question: question.trim(),
      options: filledOptions.map((text, idx) => ({
        id: `opt_${idx}`,
        text: text.trim(),
        vote_count: 0,
      })),
      voters: {},
      total_votes: 0,
      is_active: true,
    };

    onPollCreate(pollData);
  };

  const isYesNo = pollType === "yes_no";

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Create a Poll
        </h3>
        <button
          onClick={onCancel}
          className="p-1 hover:opacity-70"
          style={{ color: "var(--text-hint)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Poll Type */}
      <div className="space-y-2">
        <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
          Poll Type
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setPollType("multiple_choice")}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              backgroundColor: pollType === "multiple_choice" ? "var(--accent-primary)" : "var(--bg-subtle)",
              color: pollType === "multiple_choice" ? "#fff" : "var(--text-primary)",
            }}
          >
            Multiple Choice
          </button>
          <button
            onClick={() => setPollType("yes_no")}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              backgroundColor: pollType === "yes_no" ? "var(--accent-primary)" : "var(--bg-subtle)",
              color: pollType === "yes_no" ? "#fff" : "var(--text-primary)",
            }}
          >
            Yes/No
          </button>
        </div>
      </div>

      {/* Question */}
      <div className="space-y-2">
        <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
          Question
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's your question?"
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{
            backgroundColor: "var(--bg-subtle)",
            borderColor: "var(--border-light)",
            color: "var(--text-primary)",
          }}
          maxLength={100}
        />
        <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
          {question.length}/100
        </p>
      </div>

      {/* Options */}
      {!isYesNo && (
        <div className="space-y-2">
          <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
            Options ({options.length}/5)
          </label>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    borderColor: "var(--border-light)",
                    color: "var(--text-primary)",
                  }}
                  maxLength={50}
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(idx)}
                    className="p-2 hover:opacity-70"
                    style={{ color: "var(--text-hint)" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 5 && (
            <button
              onClick={addOption}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: "var(--bg-subtle)",
                color: "var(--accent-primary)",
                border: "1px dashed var(--border-light)",
              }}
            >
              <Plus className="w-4 h-4" /> Add Option
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(229, 62, 62, 0.1)", color: "#E53E3E" }}>
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 rounded-lg font-semibold text-sm"
          style={{
            backgroundColor: "var(--bg-subtle)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-light)",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          className="flex-1 px-3 py-2 rounded-lg font-semibold text-sm"
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "#fff",
          }}
        >
          Create Poll
        </button>
      </div>
    </div>
  );
}