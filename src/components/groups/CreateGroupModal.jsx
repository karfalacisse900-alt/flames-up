import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, MapPin, ImageIcon, Loader2 } from "lucide-react";

const CATEGORIES = [
  { key: "fitness", label: "Fitness", emoji: "💪" },
  { key: "food", label: "Food", emoji: "🍕" },
  { key: "travel", label: "Travel", emoji: "✈️" },
  { key: "study", label: "Study", emoji: "📚" },
  { key: "tech", label: "Tech", emoji: "💻" },
  { key: "art", label: "Art", emoji: "🎨" },
  { key: "music", label: "Music", emoji: "🎵" },
  { key: "gaming", label: "Gaming", emoji: "🎮" },
  { key: "books", label: "Books", emoji: "📖" },
  { key: "movies", label: "Movies", emoji: "🎬" },
  { key: "health", label: "Health", emoji: "🌿" },
  { key: "sports", label: "Sports", emoji: "⚽" },
  { key: "general", label: "General", emoji: "💬" },
];

const CATEGORY_COLORS = {
  fitness: "linear-gradient(135deg, #0d9488, #16a34a)",
  food: "linear-gradient(135deg, #ea580c, #d97706)",
  travel: "linear-gradient(135deg, #0284c7, #6d28d9)",
  study: "linear-gradient(135deg, #d97706, #b45309)",
  tech: "linear-gradient(135deg, #0284c7, #0369a1)",
  art: "linear-gradient(135deg, #7c3aed, #a21caf)",
  music: "linear-gradient(135deg, #db2777, #be185d)",
  gaming: "linear-gradient(135deg, #16a34a, #15803d)",
  books: "linear-gradient(135deg, #d97706, #b45309)",
  movies: "linear-gradient(135deg, #7c3aed, #4338ca)",
  health: "linear-gradient(135deg, #0d9488, #16a34a)",
  sports: "linear-gradient(135deg, #ea580c, #dc2626)",
  general: "linear-gradient(135deg, #64748b, #475569)",
};

export default function CreateGroupModal({ user, onClose, onCreated }) {
  const [step, setStep] = useState(1); // 1=type, 2=details
  const [groupType, setGroupType] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [rules, setRules] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [meetingSchedule, setMeetingSchedule] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const selectedCat = CATEGORIES.find(c => c.key === category);

  const handleImagePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
    e.target.value = "";
  };

  const handleCreate = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    let coverUrl = null;
    if (coverFile) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: coverFile });
      coverUrl = file_url;
      setUploading(false);
    }

    const group = await base44.entities.Group.create({
      name: name.trim(),
      description: description.trim() || undefined,
      group_type: groupType,
      emoji: selectedCat?.emoji,
      category,
      rules: rules.trim() || undefined,
      is_private: isPrivate,
      cover_image_url: coverUrl || undefined,
      cover_color: CATEGORY_COLORS[category],
      creator_email: user.email,
      creator_name: user.full_name || user.email,
      location_name: locationName.trim() || undefined,
      location_city: locationCity.trim() || undefined,
      meeting_schedule: meetingSchedule.trim() || undefined,
      member_count: 1,
      post_count: 0,
      is_active: true,
    });

    await base44.entities.GroupMember.create({
      group_id: group.id, group_name: group.name,
      user_email: user.email, user_name: user.full_name || user.email,
      role: "admin", joined_at: new Date().toISOString(),
    });

    setSaving(false);
    onCreated(group);
  };

  // Step 1: Choose type
  if (step === 1) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={onClose}>
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", maxHeight: "90vh", overflowY: "auto" }}
          onClick={e => e.stopPropagation()}>
          <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />
          <div className="px-5 pt-4 pb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Create a Group</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Choose your group type to get started</p>
              </div>
              <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
            </div>

            <div className="space-y-3">
              {/* Real-world */}
              <button onClick={() => { setGroupType("realworld"); setStep(2); }}
                className="w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98]"
                style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                    📍
                  </div>
                  <div>
                    <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Real-World Group</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      Groups that meet in physical locations. Perfect for yoga clubs, running groups, study meetups, food groups, and more.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["Yoga Club", "Running Club", "Study Group", "Foodies"].map(t => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: "#E8F2EC", color: "#2E6B4F" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>

              {/* Online */}
              <button onClick={() => { setGroupType("online"); setStep(2); }}
                className="w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98]"
                style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "linear-gradient(135deg, #0284c7, #6d28d9)" }}>
                    🌐
                  </div>
                  <div>
                    <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Online Community</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      Communities that interact only inside the app. Great for discussions, sharing, and connecting around any topic.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["Movie Discussions", "Coding Help", "AI Tools", "Travel Tips"].map(t => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: "#EDE8DF", color: "#5C5C5C" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Step 2: Details
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(1)} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              ‹
            </button>
            <div>
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                {groupType === "realworld" ? "📍 Real-World Group" : "🌐 Online Community"}
              </h2>
              <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>Fill in the details</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
        </div>

        <div className="px-5 py-4 space-y-4 pb-10">
          {/* Cover image */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Cover Image</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            {coverPreview ? (
              <div className="relative mt-1.5 rounded-xl overflow-hidden h-28">
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                <button onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full mt-1.5 py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                style={{ borderColor: "var(--border-medium)", color: "var(--text-hint)", backgroundColor: "var(--bg-subtle)" }}>
                <ImageIcon className="w-4 h-4" /> Add cover image
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Group Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={40}
              placeholder={groupType === "realworld" ? "e.g. Morning Yoga Club, NYC Runners..." : "e.g. Film Buffs, Coding Café..."}
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Category</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setCategory(c.key)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    backgroundColor: category === c.key ? "var(--accent-primary)" : "var(--bg-subtle)",
                    color: category === c.key ? "#fff" : "var(--text-secondary)",
                    borderColor: category === c.key ? "var(--accent-primary)" : "var(--border-light)",
                  }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={300}
              placeholder="What's this group about?"
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Location (real-world only) */}
          {groupType === "realworld" && (
            <div className="p-3 rounded-xl space-y-2.5" style={{ backgroundColor: "#E8F2EC", border: "1px solid #2E6B4F30" }}>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" style={{ color: "#2E6B4F" }} />
                <p className="text-xs font-bold" style={{ color: "#2E6B4F" }}>Meeting Location</p>
              </div>
              <input value={locationName} onChange={e => setLocationName(e.target.value)}
                placeholder="Location name (e.g. Central Park)"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid #2E6B4F30", color: "var(--text-primary)" }} />
              <input value={locationCity} onChange={e => setLocationCity(e.target.value)}
                placeholder="City"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid #2E6B4F30", color: "var(--text-primary)" }} />
              <input value={meetingSchedule} onChange={e => setMeetingSchedule(e.target.value)}
                placeholder="Meeting schedule (e.g. Saturdays at 9AM)"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid #2E6B4F30", color: "var(--text-primary)" }} />
            </div>
          )}

          {/* Rules */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Group Rules (optional)</label>
            <textarea value={rules} onChange={e => setRules(e.target.value)} rows={2} maxLength={300}
              placeholder="e.g. Be respectful, no spam..."
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Private toggle */}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Private Group</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Only members can see posts</p>
            </div>
            <button onClick={() => setIsPrivate(v => !v)}
              className="w-11 h-6 rounded-full transition-all relative shrink-0"
              style={{ backgroundColor: isPrivate ? "var(--accent-primary)" : "var(--border-medium)" }}>
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow transition-all"
                style={{ left: isPrivate ? "calc(100% - 22px)" : "2px" }} />
            </button>
          </div>

          <button onClick={handleCreate} disabled={!name.trim() || saving}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 16px rgba(46,107,79,0.35)" }}>
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploading ? "Uploading..." : "Creating..."}
              </span>
            ) : "✦ Create Group"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}