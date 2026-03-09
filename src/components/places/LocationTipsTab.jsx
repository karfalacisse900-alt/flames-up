import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Lightbulb, Heart, Plus, X } from "lucide-react";

const CATEGORIES = [
  { key: "general", label: "General", emoji: "💬" },
  { key: "food", label: "Food", emoji: "🍕" },
  { key: "parking", label: "Parking", emoji: "🅿️" },
  { key: "timing", label: "Timing", emoji: "⏰" },
  { key: "safety", label: "Safety", emoji: "🛡️" },
  { key: "hidden_gem", label: "Hidden gem", emoji: "💎" },
];

export default function LocationTipsTab({ locationName, locationData, user }) {
  const [showForm, setShowForm] = useState(false);
  const [tipText, setTipText] = useState("");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: tips = [] } = useQuery({
    queryKey: ["locationTips", locationName],
    queryFn: () => base44.entities.LocationTip.filter({ location_name: locationName }, "-likes", 50),
    enabled: !!locationName,
  });

  const submitTip = async () => {
    if (!tipText.trim() || !user) return;
    setSaving(true);
    await base44.entities.LocationTip.create({
      location_name: locationName,
      location_city: locationData?.city || "",
      author_email: user.email,
      author_name: user.display_name || user.full_name || "Anonymous",
      text: tipText.trim().slice(0, 200),
      category,
      likes: 0,
      liked_by: [],
    });
    setTipText("");
    setCategory("general");
    setShowForm(false);
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["locationTips", locationName] });
  };

  const toggleLike = async (tip) => {
    if (!user) return;
    const hasLiked = tip.liked_by?.includes(user.email);
    await base44.entities.LocationTip.update(tip.id, {
      likes: hasLiked ? Math.max(0, (tip.likes || 0) - 1) : (tip.likes || 0) + 1,
      liked_by: hasLiked
        ? (tip.liked_by || []).filter(e => e !== user.email)
        : [...(tip.liked_by || []), user.email],
    });
    qc.invalidateQueries({ queryKey: ["locationTips", locationName] });
  };

  const catInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[0];

  return (
    <div className="p-4 pb-28 space-y-3">
      {/* Add tip button */}
      {user && !showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed transition-all active:scale-[0.99]"
          style={{ borderColor: "var(--border-medium)", color: "var(--text-hint)" }}>
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add a tip for this place…</span>
        </button>
      )}

      {/* Tip compose form */}
      {showForm && (
        <div className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Share a tip</p>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: category === c.key ? "var(--accent-primary)" : "var(--bg-subtle)",
                  color: category === c.key ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${category === c.key ? "transparent" : "var(--border-light)"}`,
                }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <textarea value={tipText} onChange={e => setTipText(e.target.value.slice(0, 200))}
            placeholder="e.g. Best coffee is at the corner stand near the east entrance…"
            rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>{tipText.length}/200</p>
            <button onClick={submitTip} disabled={!tipText.trim() || saving}
              className="px-4 py-1.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-primary)" }}>
              {saving ? "Posting…" : "Post Tip"}
            </button>
          </div>
        </div>
      )}

      {tips.length === 0 ? (
        <div className="py-12 text-center">
          <Lightbulb className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No tips yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Be the first to share a local tip!</p>
        </div>
      ) : (
        tips.map(tip => {
          const cat = catInfo(tip.category);
          const hasLiked = tip.liked_by?.includes(user?.email);
          return (
            <div key={tip.id} className="p-4 rounded-2xl flex gap-3"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                style={{ backgroundColor: "var(--bg-subtle)" }}>
                {cat.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{tip.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>— {tip.author_name}</p>
                  <button onClick={() => toggleLike(tip)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: hasLiked ? "#FEE2E2" : "var(--bg-subtle)",
                      color: hasLiked ? "#EF4444" : "var(--text-hint)",
                    }}>
                    <Heart className={`w-3 h-3 ${hasLiked ? "fill-current" : ""}`} />
                    {tip.likes || 0}
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}