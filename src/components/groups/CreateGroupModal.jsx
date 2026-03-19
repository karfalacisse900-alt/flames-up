import React, { useState } from "react";
import { X, Plus, MapPin, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { uploadToR2 } from "@/utils/uploadToR2";

const CATEGORIES = [
  "fitness", "food", "travel", "tech", "art", "music", "gaming", "movies",
  "sports", "health", "study", "books", "relationships", "motivation", "general"
];

export default function CreateGroupModal({ open, onClose, onCreated, user }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [emoji, setEmoji] = useState("💬");
  const [groupType, setGroupType] = useState("online");
  const [isPaid, setIsPaid] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState(0);
  const [creating, setCreating] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const group = await base44.entities.Group.create({
        name,
        description,
        category,
        emoji,
        group_type: groupType,
        is_private: false,
        is_active: true,
        member_count: 1,
        creator_email: user?.email,
        creator_name: user?.full_name || user?.email,
        is_paid: isPaid,
        monthly_fee: isPaid ? monthlyFee : 0,
        preview_video_url: previewMedia,
        created_at: new Date().toISOString(),
      });

      await base44.entities.GroupMember.create({
        group_id: group.id,
        group_name: name,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: "admin",
        joined_at: new Date().toISOString(),
      });

      onCreated(group);
      resetForm();
    } catch (err) {
      console.error("Error creating group:", err);
    }
    setCreating(false);
  };

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setCategory("general");
    setEmoji("💬");
    setGroupType("online");
    setIsPaid(false);
    setMonthlyFee(0);
    setPreviewMedia(null);
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileType = file.type.startsWith("video") ? "groups/videos" : "groups/images";
      const { file_url } = await uploadToR2(file, fileType);
      setPreviewMedia(file_url);
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#FFFFFF" }}>
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Create Group</h2>
          <button onClick={() => { onClose(); resetForm(); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Step indicator */}
          <div className="flex gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: step >= s ? "var(--accent-primary)" : "var(--bg-subtle)" }} />
            ))}
          </div>

          {step === 1 ? (
            <>
              {/* Group name & type */}
              <div className="mb-4">
                <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Group Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Downtown Yoga Circle" className="w-full mt-2 px-3 py-2.5 rounded-xl border text-sm" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }} />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell members about your group..." className="w-full mt-2 px-3 py-2.5 rounded-xl border text-sm h-24 resize-none" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }} />
              </div>

              {/* Type selector */}
              <div className="mb-4">
                <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Type</label>
                <div className="flex gap-2 mt-2">
                  {[
                    { key: "online", label: "🌐 Online", icon: Globe },
                    { key: "realworld", label: "📍 Real-World", icon: MapPin }
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setGroupType(key)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${groupType === key ? "text-white" : ""}`} style={{ backgroundColor: groupType === key ? "var(--accent-primary)" : "var(--bg-subtle)", color: groupType === key ? "white" : "var(--text-secondary)" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category & Emoji */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-2 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Emoji</label>
                  <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength="2" className="w-full mt-2 px-3 py-2 rounded-xl border text-2xl text-center" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }} />
                </div>
              </div>

              {/* Preview Media */}
              <div className="mb-6">
                <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Preview Video/Photo (Optional)</label>
                <p className="text-xs mb-2" style={{ color: "var(--text-hint)" }}>Upload a preview to show in group discovery</p>
                {previewMedia ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "4/5" }}>
                    {previewMedia.includes(".mp4") || previewMedia.includes("video") ? (
                      <video src={previewMedia} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={previewMedia} className="w-full h-full object-cover" alt="Preview" />
                    )}
                    <button onClick={() => setPreviewMedia(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block w-full p-6 rounded-xl border-2 border-dashed text-center cursor-pointer hover:bg-gray-50" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }}>
                    <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
                    <Plus className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-hint)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {uploading ? "Uploading..." : "Upload Video or Photo"}
                    </p>
                  </label>
                )}
              </div>

              <button onClick={() => setStep(2)} className="w-full py-2.5 rounded-xl font-bold text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
                Next: Pricing
              </button>
            </>
          ) : (
            <>
              {/* Pricing */}
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Membership Type</p>
                <div className="space-y-2">
                  {[
                    { key: false, label: "Free", desc: "Anyone can join" },
                    { key: true, label: "Paid Monthly", desc: "Members pay monthly fee" }
                  ].map(({ key, label, desc }) => (
                    <button key={String(key)} onClick={() => { setIsPaid(key); if (!key) setMonthlyFee(0); }} className={`w-full p-3 rounded-xl border text-left transition-all ${isPaid === key ? "border-2" : ""}`} style={{ borderColor: isPaid === key ? "var(--accent-primary)" : "var(--border-light)", backgroundColor: isPaid === key ? "var(--accent-primary-light)" : "var(--bg-subtle)" }}>
                      <p className="font-semibold" style={{ color: isPaid === key ? "var(--accent-primary)" : "var(--text-primary)" }}>{label}</p>
                      <p className="text-xs" style={{ color: "var(--text-hint)" }}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {isPaid && (
                <div className="mb-6">
                  <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Monthly Fee ($)</label>
                  <input type="number" min="0.99" step="0.01" value={monthlyFee} onChange={e => setMonthlyFee(parseFloat(e.target.value) || 0)} className="w-full mt-2 px-3 py-2.5 rounded-xl border text-sm" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }} />
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl font-bold" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}>Back</button>
                <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 rounded-xl font-bold text-white" style={{ backgroundColor: "var(--accent-primary)", opacity: creating ? 0.6 : 1 }}>
                  {creating ? "Creating..." : "Create Group"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}