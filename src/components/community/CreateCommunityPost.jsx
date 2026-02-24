import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Plus, Minus } from "lucide-react";

const POST_TYPES = [
  { key: "opinion",      label: "Opinion",    emoji: "💬", desc: "Share your take on anything" },
  { key: "question",     label: "Question",   emoji: "❓", desc: "Ask the community anything" },
  { key: "debate",       label: "Debate",     emoji: "⚔️", desc: "Create a two-sided debate" },
  { key: "list",         label: "List",       emoji: "📋", desc: "Share a ranked list" },
  { key: "quote_of_day", label: "Quote",      emoji: "✦",  desc: "Share an inspiring quote" },
  { key: "discussion",   label: "Discussion", emoji: "🗣", desc: "Start a general discussion" },
];

const MEDIA_TYPES = [
  { key: "general", label: "General" },
  { key: "movie",   label: "🎬 Movie" },
  { key: "show",    label: "📺 Show" },
  { key: "book",    label: "📚 Book" },
  { key: "game",    label: "🎮 Game" },
  { key: "music",   label: "🎵 Music" },
];

export default function CreateCommunityPost({ user, onClose, onCreated }) {
  const [step, setStep] = useState("type");
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaType, setMediaType] = useState("general");
  const [mediaRef, setMediaRef] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [listItems, setListItems] = useState(["", ""]);
  const [sideA, setSideA] = useState("");
  const [sideB, setSideB] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!body.trim() && type !== "debate") return;
    if (type === "debate" && (!title.trim() || !sideA.trim() || !sideB.trim())) return;
    setSaving(true);

    const postData = {
      type,
      title: title.trim() || undefined,
      body: body.trim() || title.trim(),
      author_email: user?.email || "",
      author_name: user?.display_name || user?.full_name || "Anonymous",
      is_anonymous: isAnon,
      media_type: mediaType,
      media_ref_title: mediaRef.trim() || undefined,
      upvotes: 0, downvotes: 0, comment_count: 0, engagement_score: 0,
      is_daily_spotlight: false,
      list_items: type === "list" ? listItems.filter(i => i.trim()) : undefined,
    };

    const newPost = await base44.entities.CommunityPost.create(postData);

    if (type === "debate" && newPost?.id) {
      await base44.entities.CommunityDebate.create({
        post_id: newPost.id,
        topic: title.trim(),
        side_a_label: sideA.trim(),
        side_b_label: sideB.trim(),
        side_a_votes: 0, side_b_votes: 0,
      });
    }

    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />

        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              {step === "type" ? "What would you like to post?" : "Compose Your Post"}
            </h2>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          {/* Step 1: Pick type */}
          {step === "type" && (
            <div className="grid grid-cols-2 gap-2 pb-6">
              {POST_TYPES.map(t => (
                <button key={t.key} onClick={() => { setType(t.key); setStep("compose"); }}
                  className="p-3 rounded-2xl text-left transition-all active:scale-95"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                  <p className="text-2xl mb-1">{t.emoji}</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-hint)" }}>{t.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Compose */}
          {step === "compose" && (
            <div className="space-y-3 pb-6">
              <button onClick={() => setStep("type")} className="text-xs" style={{ color: "var(--accent-primary)" }}>
                ← Change type
              </button>

              {/* Media topic */}
              <div>
                <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Topic (optional)</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {MEDIA_TYPES.map(m => (
                    <button key={m.key} onClick={() => setMediaType(m.key)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                      style={{
                        backgroundColor: mediaType === m.key ? "var(--accent-primary)" : "transparent",
                        color: mediaType === m.key ? "#fff" : "var(--text-secondary)",
                        borderColor: mediaType === m.key ? "var(--accent-primary)" : "var(--border-light)",
                      }}>{m.label}</button>
                  ))}
                </div>
                {mediaType !== "general" && (
                  <input value={mediaRef} onChange={e => setMediaRef(e.target.value)}
                    placeholder={`Name of the ${mediaType}...`}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                )}
              </div>

              {/* Title (for debate/list) */}
              {(type === "debate" || type === "list") && (
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={type === "debate" ? "Debate topic..." : "List title..."}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              )}

              {/* Body */}
              {type !== "debate" && (
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  placeholder={type === "quote_of_day" ? "Enter the quote..." : type === "list" ? "Describe your list..." : "Write your thoughts..."}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              )}

              {/* Debate sides */}
              {type === "debate" && (
                <>
                  <textarea value={body} onChange={e => setBody(e.target.value)}
                    placeholder="Describe the debate (optional)..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] font-medium mb-1" style={{ color: "#3C6E5A" }}>🟢 Side A</p>
                      <input value={sideA} onChange={e => setSideA(e.target.value)} placeholder="e.g. Yes"
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ backgroundColor: "#EEF3F0", border: "1px solid #3C6E5A33", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium mb-1" style={{ color: "#D98B62" }}>🟠 Side B</p>
                      <input value={sideB} onChange={e => setSideB(e.target.value)} placeholder="e.g. No"
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ backgroundColor: "#FFF3E8", border: "1px solid #D98B6233", color: "var(--text-primary)" }} />
                    </div>
                  </div>
                </>
              )}

              {/* List items */}
              {type === "list" && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>List items</p>
                  {listItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-xs font-bold w-5 text-center" style={{ color: "var(--accent-primary)" }}>{i+1}</span>
                      <input value={item} onChange={e => { const n = [...listItems]; n[i] = e.target.value; setListItems(n); }}
                        placeholder={`Item ${i+1}...`}
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                      {listItems.length > 2 && (
                        <button onClick={() => setListItems(l => l.filter((_, j) => j !== i))}>
                          <Minus className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setListItems(l => [...l, ""])} className="flex items-center gap-1 text-xs mt-1" style={{ color: "var(--accent-primary)" }}>
                    <Plus className="w-3.5 h-3.5" /> Add item
                  </button>
                </div>
              )}

              {/* Anonymous toggle */}
              <div className="flex items-center justify-between py-1">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Post anonymously</p>
                <button onClick={() => setIsAnon(v => !v)}
                  className="w-10 h-5 rounded-full transition-all relative"
                  style={{ backgroundColor: isAnon ? "var(--accent-primary)" : "var(--border-medium)" }}>
                  <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: isAnon ? "calc(100% - 18px)" : "2px" }} />
                </button>
              </div>

              <button onClick={handleSubmit} disabled={saving}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                {saving ? "Posting..." : "Post to Community"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}