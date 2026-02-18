import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Sparkles, RefreshCw, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";

const postTypes = [
  { value: "question", label: "Question", emoji: "❓" },
  { value: "quote", label: "Quote", emoji: "💭" },
  { value: "concern", label: "Concern", emoji: "🫂" },
];

export default function CreatePostModal({ open, onClose, onCreated, user }) {
  const [type, setType] = useState("question");
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  // Answer type (for questions)
  const [answerType, setAnswerType] = useState("open"); // "open" | "yes_no" | "multi"
  const [multiOptions, setMultiOptions] = useState(["", ""]);

  // AI state
  const [aiTopic, setAiTopic] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiMode, setAiMode] = useState(null); // "generate" | "rephrase"
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    // Build poll data for question posts
    let pollData = {};
    if (type === "question" && answerType !== "open") {
      let opts = answerType === "yes_no" ? ["Yes", "No"] : multiOptions.filter(o => o.trim());
      pollData = {
        answer_type: answerType,
        options: opts,
        votes: Object.fromEntries(opts.map((_, i) => [i, 0])),
        voted_by: {},
        total_votes: 0,
      };
    } else {
      pollData = { answer_type: "open", options: [], votes: {}, voted_by: {}, total_votes: 0 };
    }

    await base44.entities.Post.create({
        type, text: text.trim(), is_anonymous: isAnonymous,
        author_name: isAnonymous ? "Anonymous" : (user?.full_name || "User"),
        author_email: user?.email || "", like_count: 0, reply_count: 0, liked_by: [],
        ...pollData,
      });
      setText(""); setType("question"); setIsAnonymous(false);
      setAnswerType("open"); setMultiOptions(["", ""]);
      setShowAiPanel(false); setAiTopic("");
    setLoading(false); onCreated(); onClose();
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    const typeMap = { question: "a thoughtful question", quote: "an inspiring quote or thought", concern: "a heartfelt concern" };
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write ${typeMap[type]} about the topic: "${aiTopic}". It should be concise (1-3 sentences), personal, and feel authentic — like something a real person would post on a reflective social app. Output only the text, no quotes or labels.`,
    });
    setText(result);
    setShowAiPanel(false);
    setAiTopic("");
    setAiLoading(false);
  };

  const handleAiRephrase = async () => {
    if (!text.trim()) return;
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Rephrase the following text for better clarity and tone. Keep it authentic and human. Output only the rephrased text, no quotes or labels.\n\nOriginal: "${text}"`,
    });
    setText(result);
    setAiMode(null);
    setAiLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-lg rounded-t-3xl flex flex-col"
        style={{ maxHeight: "92dvh", backgroundColor: "var(--bg-nav)" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
        </div>

        <div className="px-5 pt-2 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Create Post</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
            </button>
          </div>

          {/* Type selector */}
          <div className="flex gap-2 mb-4">
            {postTypes.map((pt) => (
              <button
                key={pt.value}
                onClick={() => setType(pt.value)}
                className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: type === pt.value ? "var(--accent-primary)" : "var(--border-light)",
                  backgroundColor: type === pt.value ? "rgba(60,110,90,0.06)" : "transparent",
                }}
              >
                <span className="text-xl">{pt.emoji}</span>
                <span className="text-xs font-medium" style={{ color: type === pt.value ? "var(--accent-primary)" : "var(--text-secondary)" }}>{pt.label}</span>
              </button>
            ))}
          </div>

          <Textarea
            placeholder={
              type === "question" ? "What's your question?" :
              type === "quote" ? "Share a thought or quote..." : "What concerns you?"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px] rounded-xl text-base resize-none"
            style={{ fontFamily: "var(--font-serif)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          />

          {/* Answer type selector — only for questions */}
          {type === "question" && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Answer type</p>
              <div className="flex gap-2">
                {[
                  { value: "open", label: "Open text" },
                  { value: "yes_no", label: "Yes / No" },
                  { value: "multi", label: "Multiple choice" },
                ].map((at) => (
                  <button
                    key={at.value}
                    onClick={() => setAnswerType(at.value)}
                    className="flex-1 py-1.5 rounded-xl border text-xs font-medium transition-all"
                    style={{
                      borderColor: answerType === at.value ? "var(--accent-primary)" : "var(--border-light)",
                      backgroundColor: answerType === at.value ? "rgba(60,110,90,0.07)" : "transparent",
                      color: answerType === at.value ? "var(--accent-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {at.label}
                  </button>
                ))}
              </div>

              {/* Yes/No preview */}
              {answerType === "yes_no" && (
                <div className="flex gap-2 mt-3">
                  {["Yes", "No"].map((opt) => (
                    <div key={opt} className="flex-1 py-2 rounded-xl border text-center text-sm font-medium" style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-app)" }}>
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Multiple choice inputs */}
              {answerType === "multi" && (
                <div className="mt-3 space-y-2">
                  {multiOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const next = [...multiOptions];
                          next[idx] = e.target.value;
                          setMultiOptions(next);
                        }}
                        className="flex-1 rounded-xl text-sm"
                        style={{ borderColor: "var(--border-light)" }}
                      />
                      {multiOptions.length > 2 && (
                        <button onClick={() => setMultiOptions(multiOptions.filter((_, i) => i !== idx))} style={{ color: "var(--text-hint)" }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {multiOptions.length < 5 && (
                    <button
                      onClick={() => setMultiOptions([...multiOptions, ""])}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-dashed transition-all"
                      style={{ borderColor: "var(--border-medium)", color: "var(--text-hint)" }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add option
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI toolbar */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setShowAiPanel(!showAiPanel); setAiMode("generate"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
              style={{
                borderColor: showAiPanel && aiMode === "generate" ? "var(--accent-primary)" : "var(--border-light)",
                color: showAiPanel && aiMode === "generate" ? "var(--accent-primary)" : "var(--text-secondary)",
                backgroundColor: showAiPanel && aiMode === "generate" ? "rgba(60,110,90,0.06)" : "transparent",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Generate from topic
            </button>

            {text.trim() && (
              <button
                onClick={handleAiRephrase}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Rephrase
              </button>
            )}
          </div>

          {/* AI generate panel */}
          <AnimatePresence>
            {showAiPanel && aiMode === "generate" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 rounded-xl border flex gap-2" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
                  <Input
                    placeholder="Enter a topic (e.g. loneliness, motivation, growth)…"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                    className="flex-1 rounded-xl border-0 bg-transparent text-sm"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <button
                    onClick={handleAiGenerate}
                    disabled={!aiTopic.trim() || aiLoading}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: "var(--accent-primary)" }}
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Sticky footer with submit — always visible */}
        <div className="shrink-0 px-5 pb-6 pt-3 border-t" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-nav)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{isAnonymous ? "Anonymous" : "Public"}</span>
              </div>
            </div>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>{text.length} chars</span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
            className="w-full text-white rounded-2xl font-bold h-14 text-base"
            style={{ backgroundColor: text.trim() ? "var(--accent-primary)" : "var(--border-medium)", boxShadow: text.trim() ? "0 4px 14px rgba(60,110,90,0.4)" : "none", transition: "all 0.2s" }}
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2 inline" />Publishing...</> : "✦ Publish Post"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}