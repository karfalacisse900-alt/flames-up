import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Clock, Edit3, Trash2, Plus, Search, Loader2, Upload, X } from "lucide-react";
import { createPortal } from "react-dom";

const CATEGORY_LABELS = {
  painter: "🎨 Painter", dancer: "💃 Dancer", musician: "🎵 Musician",
  videographer: "🎬 Videographer", photographer: "📸 Photographer",
  street_performer: "🎭 Street Performer", comedian: "😂 Comedian",
  magician: "🪄 Magician", tattoo_artist: "✒️ Tattoo Artist",
  caricaturist: "✏️ Caricaturist", other: "🌟 Other"
};

const STATUS_COLORS = {
  pending:  { bg: "#FFF7ED", color: "#F97316", icon: Clock },
  approved: { bg: "#F0FDF4", color: "#16A34A", icon: CheckCircle },
  rejected: { bg: "#FEF2F2", color: "#EF4444", icon: XCircle },
};

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }));

function CreatorFormModal({ creator, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: creator?.full_name || "",
    category: creator?.category || "",
    description: creator?.description || "",
    price: creator?.price || "",
    city: creator?.city || "",
    approval_status: creator?.approval_status || "pending",
    user_email: creator?.user_email || "",
    instagram_url: creator?.instagram_url || "",
    tiktok_url: creator?.tiktok_url || "",
    youtube_url: creator?.youtube_url || "",
    website_url: creator?.website_url || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(creator?.profile_image || null);
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    let profile_image = creator?.profile_image || "";
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      profile_image = file_url;
    }
    let saved;
    if (creator) {
      saved = await base44.entities.Creator.update(creator.id, { ...form, profile_image });
      onSaved({ ...creator, ...form, profile_image });
    } else {
      saved = await base44.entities.Creator.create({ ...form, profile_image, availability_status: "closed" });
      onSaved(saved);
    }
    setSaving(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg mx-4 my-6 rounded-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-modal)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-light)" }}>
          <h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-serif)" }}>
            {creator ? "Edit Creator" : "Add Creator"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-3">
          {/* Image */}
          <label className="flex items-center justify-center w-full h-28 rounded-2xl cursor-pointer overflow-hidden"
            style={{ border: "2px dashed var(--border-medium)", backgroundColor: "var(--bg-subtle)" }}>
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); }} />
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
            ) : (
              <div className="text-center">
                <Upload className="w-5 h-5 mx-auto mb-1" style={{ color: "var(--text-hint)" }} />
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>Upload photo</p>
              </div>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-hint)" }}>Full Name *</label>
              <input value={form.full_name} onChange={set("full_name")} required
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-hint)" }}>Category *</label>
              <select value={form.category} onChange={set("category")} required
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}>
                <option value="">Select</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-hint)" }}>City</label>
              <input value={form.city} onChange={set("city")}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-hint)" }}>Price</label>
              <input value={form.price} onChange={set("price")}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-hint)" }}>User Email</label>
              <input value={form.user_email} onChange={set("user_email")}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-hint)" }}>Approval Status</label>
              <select value={form.approval_status} onChange={set("approval_status")}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-hint)" }}>Description</label>
            <textarea value={form.description} onChange={set("description")} rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "instagram_url", label: "Instagram", emoji: "📸" },
              { key: "tiktok_url", label: "TikTok", emoji: "🎵" },
              { key: "youtube_url", label: "YouTube", emoji: "▶️" },
              { key: "website_url", label: "Website", emoji: "🌐" },
            ].map(({ key, label, emoji }) => (
              <div key={key}>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-hint)" }}>{emoji} {label}</label>
                <input value={form[key]} onChange={set(key)}
                  className="w-full px-3 py-2 rounded-xl text-xs"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </div>
            ))}
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-2xl font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : creator ? "Save Changes" : "Create Creator"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function AdminCreators() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingCreator, setEditingCreator] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ["adminCreators"],
    queryFn: () => base44.entities.Creator.list("-created_date", 200),
  });

  const filtered = creators.filter(c => {
    const matchSearch = !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.approval_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id, status) => {
    await base44.entities.Creator.update(id, { approval_status: status });
    qc.invalidateQueries({ queryKey: ["adminCreators"] });
  };

  const deleteCreator = async (id) => {
    if (!window.confirm("Delete this creator?")) return;
    await base44.entities.Creator.delete(id);
    qc.invalidateQueries({ queryKey: ["adminCreators"] });
  };

  const counts = {
    all: creators.length,
    pending: creators.filter(c => c.approval_status === "pending").length,
    approved: creators.filter(c => c.approval_status === "approved").length,
    rejected: creators.filter(c => c.approval_status === "rejected").length,
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "var(--bg-app)" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              Street Creators
            </h1>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Manage creator applications and profiles</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <Plus className="w-4 h-4" /> Add Creator
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { key: "all", label: "Total", color: "#4F46E5" },
            { key: "pending", label: "Pending", color: "#F97316" },
            { key: "approved", label: "Approved", color: "#16A34A" },
            { key: "rejected", label: "Rejected", color: "#EF4444" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className="p-3 rounded-2xl text-center transition-all"
              style={{
                backgroundColor: filterStatus === key ? color + "15" : "var(--bg-card)",
                border: `1.5px solid ${filterStatus === key ? color : "var(--border-light)"}`,
              }}>
              <p className="text-xl font-black" style={{ color }}>{counts[key]}</p>
              <p className="text-xs font-medium" style={{ color: "var(--text-hint)" }}>{label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or city..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        </div>

        {/* Creators List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--text-hint)" }}>
            <div className="text-4xl mb-3">🎨</div>
            <p className="font-medium">No creators found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(creator => {
              const s = STATUS_COLORS[creator.approval_status] || STATUS_COLORS.pending;
              const StatusIcon = s.icon;
              const isLive = creator.availability_status === "open";
              return (
                <div key={creator.id} className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <div className="flex items-center gap-3 p-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-xl"
                      style={{ background: "linear-gradient(135deg, #E05C2A22, #F9731622)" }}>
                      {creator.profile_image ? (
                        <img src={creator.profile_image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        CATEGORY_LABELS[creator.category]?.split(" ")[0] || "🌟"
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{creator.full_name}</p>
                        {isLive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {CATEGORY_LABELS[creator.category]} {creator.city ? `· ${creator.city}` : ""}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-hint)" }}>{creator.user_email}</p>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.bg }}>
                      <StatusIcon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      <span className="text-xs font-bold capitalize" style={{ color: s.color }}>
                        {creator.approval_status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 px-4 pb-3">
                    {creator.approval_status !== "approved" && (
                      <button
                        onClick={() => updateStatus(creator.id, "approved")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    {creator.approval_status !== "rejected" && (
                      <button
                        onClick={() => updateStatus(creator.id, "rejected")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                    <button
                      onClick={() => setEditingCreator(creator)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => deleteCreator(creator.id)}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(editingCreator || showCreate) && (
        <CreatorFormModal
          creator={editingCreator}
          onClose={() => { setEditingCreator(null); setShowCreate(false); }}
          onSaved={() => { setEditingCreator(null); setShowCreate(false); qc.invalidateQueries({ queryKey: ["adminCreators"] }); }}
        />
      )}
    </div>
  );
}