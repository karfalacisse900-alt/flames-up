import React, { useState } from "react";
import { X, Eye, EyeOff, Sparkles, RefreshCw, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { checkContent, createModerationReport } from "../moderation/moderationHelper";
import FontPicker, { getFontStyle } from "./FontPicker";

const postTypes = [
  { value: "question", label: "Question", emoji: "❓" },
  { value: "quote", label: "Quote", emoji: "💭" },
  { value: "concern", label: "Concern", emoji: "🫂" },
];

export default function CreatePostModal({ open, onClose, onCreated, user }) {
  const [type, setType] = useState("question");
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState("serif");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answerType, setAnswerType] = useState("open");
  const [multiOptions, setMultiOptions] = useState(["", ""]);
  const [aiTopic, setAiTopic] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    
    // AI moderation check
    const modCheck = await checkContent(text);
    
    let pollData = {};
    if (type === "question" && answerType !== "open") {
      let opts = answerType === "yes_no" ? ["Yes", "No"] : multiOptions.filter(o => o.trim());
      pollData = { answer_type: answerType, options: opts, votes: Object.fromEntries(opts.map((_, i) => [i, 0])), voted_by: {}, total_votes: 0 };
    } else {
      pollData = { answer_type: "open", options: [], votes: {}, voted_by: {}, total_votes: 0 };
    }
    const post = await base44.entities.Post.create({
      type, text: text.trim(), font_family: fontFamily, is_anonymous: isAnonymous,
      author_name: isAnonymous ? "Anonymous" : (user?.display_name || user?.full_name || "User"),
      author_email: isAnonymous ? "" : (user?.email || ""),
      like_count: 0, reply_count: 0, liked_by: [],
      ...pollData,
    });
    
    // Create moderation report if flagged
    if (!modCheck.safe) {
      await createModerationReport("post", post.id, user?.email || "", user?.display_name || "Unknown", modCheck.flags, modCheck.confidence);
    }
    
    setText(""); setType("question"); setIsAnonymous(false); setFontFamily("serif");
    setAnswerType("open"); setMultiOptions(["", ""]);
    setShowAiPanel(false); setAiTopic("");
    setLoading(false);
    onCreated();
    onClose();
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    const typeMap = { question: "a thoughtful question", quote: "an inspiring quote or thought", concern: "a heartfelt concern" };
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write ${typeMap[type]} about the topic: "${aiTopic}". It should be concise (1-3 sentences), personal, and feel authentic. Output only the text, no quotes or labels.`,
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
      prompt: `Rephrase the following text for better clarity and tone. Keep it authentic and human. Output only the rephrased text.\n\nOriginal: "${text}"`,
    });
    setText(result);
    setAiLoading(false);
  };

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onTouchMove={e => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
        onTouchMove={e => e.stopPropagation()}
      />

      {/* Sheet */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "512px",
          borderRadius: "24px 24px 0 0",
          backgroundColor: "var(--bg-nav)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, backgroundColor: "var(--border-medium)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px", flexShrink: 0 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "var(--font-serif)", color: "var(--text-primary)", margin: 0 }}>New Post</h2>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 99, background: "var(--bg-app)", border: "none", cursor: "pointer", display: "flex" }}>
            <X style={{ width: 18, height: 18, color: "var(--text-hint)" }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 8px" }}>
          {/* Type selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {postTypes.map((pt) => (
              <button
                key={pt.value}
                onClick={() => setType(pt.value)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "12px 4px", borderRadius: 12,
                  border: `2px solid ${type === pt.value ? "var(--accent-primary)" : "var(--border-light)"}`,
                  backgroundColor: type === pt.value ? "rgba(60,110,90,0.07)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 20 }}>{pt.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: type === pt.value ? "var(--accent-primary)" : "var(--text-secondary)" }}>{pt.label}</span>
              </button>
            ))}
          </div>

          {/* Text area */}
          <Textarea
            placeholder={type === "question" ? "What's your question?" : type === "quote" ? "Share a thought or quote..." : "What concerns you?"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="rounded-xl resize-none"
            style={{ minHeight: 110, fontFamily: getFontStyle(fontFamily), borderColor: "var(--border-light)", color: "var(--text-primary)", backgroundColor: "var(--bg-subtle)", fontSize: 15, width: "100%", boxSizing: "border-box" }}
          />

          {/* Font picker */}
          <div style={{ marginTop: 12 }}>
            <FontPicker value={fontFamily} onChange={setFontFamily} />
          </div>

          {/* Answer type */}
          {type === "question" && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8 }}>Answer type</p>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ value: "open", label: "Open" }, { value: "yes_no", label: "Yes/No" }, { value: "multi", label: "Multi" }].map((at) => (
                  <button
                    key={at.value}
                    onClick={() => setAnswerType(at.value)}
                    style={{
                      flex: 1, padding: "6px 4px", borderRadius: 10,
                      border: `1px solid ${answerType === at.value ? "var(--accent-primary)" : "var(--border-light)"}`,
                      backgroundColor: answerType === at.value ? "rgba(60,110,90,0.07)" : "transparent",
                      color: answerType === at.value ? "var(--accent-primary)" : "var(--text-secondary)",
                      fontSize: 11, fontWeight: 500, cursor: "pointer",
                    }}
                  >{at.label}</button>
                ))}
              </div>
              {answerType === "yes_no" && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {["Yes", "No"].map((opt) => (
                    <div key={opt} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1px solid var(--border-medium)", textAlign: "center", fontSize: 13, color: "var(--text-secondary)", backgroundColor: "var(--bg-app)" }}>{opt}</div>
                  ))}
                </div>
              )}
              {answerType === "multi" && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {multiOptions.map((opt, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Input
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => { const next = [...multiOptions]; next[idx] = e.target.value; setMultiOptions(next); }}
                        className="rounded-xl text-sm flex-1"
                        style={{ borderColor: "var(--border-light)" }}
                      />
                      {multiOptions.length > 2 && (
                        <button onClick={() => setMultiOptions(multiOptions.filter((_, i) => i !== idx))} style={{ color: "var(--text-hint)", background: "none", border: "none", cursor: "pointer" }}>
                          <Trash2 style={{ width: 16, height: 16 }} />
                        </button>
                      )}
                    </div>
                  ))}
                  {multiOptions.length < 5 && (
                    <button onClick={() => setMultiOptions([...multiOptions, ""])} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-hint)", padding: "6px 12px", borderRadius: 10, border: "1px dashed var(--border-medium)", background: "none", cursor: "pointer" }}>
                      <Plus style={{ width: 14, height: 14 }} /> Add option
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI toolbar */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99,
                border: `1px solid ${showAiPanel ? "var(--accent-primary)" : "var(--border-light)"}`,
                color: showAiPanel ? "var(--accent-primary)" : "var(--text-secondary)",
                backgroundColor: showAiPanel ? "rgba(60,110,90,0.06)" : "transparent",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              <Sparkles style={{ width: 13, height: 13 }} /> AI Generate
            </button>
            {text.trim() && (
              <button
                onClick={handleAiRephrase}
                disabled={aiLoading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, border: "1px solid var(--border-light)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer", background: "transparent" }}
              >
                {aiLoading ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <RefreshCw style={{ width: 13, height: 13 }} />}
                Rephrase
              </button>
            )}
          </div>

          {showAiPanel && (
            <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: "1px solid var(--border-light)", backgroundColor: "var(--bg-card)", display: "flex", gap: 8 }}>
              <Input
                placeholder="Topic: e.g. loneliness, growth…"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                className="flex-1 rounded-xl border-0 bg-transparent text-sm"
                style={{ color: "var(--text-primary)" }}
              />
              <button
                onClick={handleAiGenerate}
                disabled={!aiTopic.trim() || aiLoading}
                style={{ padding: "6px 14px", borderRadius: 10, backgroundColor: "var(--accent-primary)", color: "#fff", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", opacity: !aiTopic.trim() || aiLoading ? 0.5 : 1 }}
              >
                {aiLoading ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : "Go"}
              </button>
            </div>
          )}

          {/* Spacer at bottom of scroll area */}
          <div style={{ height: 16 }} />
        </div>

        {/* ─── STICKY FOOTER — always visible ─── */}
        <div style={{ flexShrink: 0, padding: "12px 20px 28px", borderTop: "1px solid var(--border-light)", backgroundColor: "var(--bg-nav)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
                {isAnonymous ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                <span>{isAnonymous ? "Anonymous" : "Public"}</span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-hint)" }}>{text.length} chars</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
            style={{
              width: "100%", height: 56, borderRadius: 16, border: "none", cursor: text.trim() ? "pointer" : "not-allowed",
              backgroundColor: text.trim() ? "var(--accent-primary)" : "#ccc",
              color: "#fff", fontSize: 16, fontWeight: 700,
              boxShadow: text.trim() ? "0 4px 16px rgba(60,110,90,0.45)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            {loading ? <><Loader2 style={{ width: 20, height: 20 }} className="animate-spin" /> Publishing...</> : "✦ Publish Post"}
          </button>
        </div>
      </div>
    </div>
  );
}