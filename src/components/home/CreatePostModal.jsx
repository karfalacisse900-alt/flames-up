import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Sparkles, RefreshCw, Loader2 } from "lucide-react";
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

  // AI state
  const [aiTopic, setAiTopic] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiMode, setAiMode] = useState(null); // "generate" | "rephrase"
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await base44.entities.Post.create({
      type, text: text.trim(), is_anonymous: isAnonymous,
      author_name: isAnonymous ? "Anonymous" : (user?.full_name || "User"),
      author_email: user?.email || "", like_count: 0, reply_count: 0, liked_by: [],
    });
    setText(""); setType("question"); setIsAnonymous(false);
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
        className="relative w-full max-w-lg rounded-t-3xl"
        style={{ maxHeight: "90dvh", overflowY: "auto", backgroundColor: "var(--bg-nav)" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
        </div>

        <div className="px-5 pb-6 pt-2">
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
              type === "question" ? "What's on your mind?" :
              type === "quote" ? "Share a thought or quote..." : "What concerns you?"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] rounded-xl text-base resize-none"
            style={{ fontFamily: "var(--font-serif)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          />

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

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isAnonymous ? "Anonymous" : "Public"}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!text.trim() || loading}
              className="text-white rounded-xl px-6"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              {loading ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}