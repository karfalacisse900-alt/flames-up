import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";

export default function EditProfile() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", username: "" });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({
        full_name: u?.display_name || u?.full_name || "",
        phone: u?.phone || "",
        email: u?.email || "",
        username: (u?.username || "").replace(/^@/, ""),
      });
      setAvatarUrl(u?.avatar_url || "");
    }).catch(() => {});
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url: tempUrl } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke("uploadToCloudflare", { file_url: tempUrl });
      setAvatarUrl(res.data?.file_url || tempUrl);
    } catch {}
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const usernameToSave = form.username ? `@${form.username.replace(/^@/, "")}` : "";
    await base44.auth.updateMe({
      display_name: form.full_name,
      phone: form.phone,
      username: usernameToSave,
      avatar_url: avatarUrl,
    });
    setSaving(false);
    navigate(-1);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    await base44.auth.updateMe({ account_deleted: true });
    base44.auth.logout();
  };

  const initials = (form.full_name || form.email || "U")[0]?.toUpperCase();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ paddingTop: "max(env(safe-area-inset-top,0px), 16px)" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Edit Profile</h1>
        <div className="w-9" />
      </div>

      {/* Avatar */}
      <div className="flex justify-center mt-4 mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-bold text-white text-3xl"
            style={{ background: "linear-gradient(135deg, var(--accent-primary), #818cf8)" }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#facc15" }}
          >
            {uploading
              ? <Loader2 className="w-4 h-4 animate-spin text-black" />
              : <Camera className="w-4 h-4 text-black" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
      </div>

      {/* Form fields */}
      <div className="mx-4 rounded-2xl overflow-hidden mb-6" style={{ backgroundColor: "var(--bg-card)" }}>
        {[
          { label: "Full name", key: "full_name", placeholder: "Your full name" },
          { label: "Phone number", key: "phone", placeholder: "e.g. 1234-5678-987", type: "tel" },
          { label: "Email", key: "email", placeholder: "your@email.com", disabled: true },
          { label: "Username", key: "username", placeholder: "@username" },
        ].map(({ label, key, placeholder, type, disabled }, i, arr) => (
          <div
            key={key}
            className="flex items-center px-4 py-3.5"
            style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
          >
            <span className="text-sm w-28 shrink-0" style={{ color: "var(--text-hint)" }}>{label}</span>
            <input
              type={type || "text"}
              value={form[key]}
              onChange={e => !disabled && setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent text-sm text-right outline-none"
              style={{ color: disabled ? "var(--text-hint)" : "var(--text-primary)", cursor: disabled ? "default" : "text" }}
            />
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="mx-4 mb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-black disabled:opacity-60"
          style={{ backgroundColor: "#a3e635" }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Delete Account */}
      <div className="mx-4 mb-10">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 text-sm font-medium"
            style={{ color: "var(--text-hint)" }}
          >
            Delete Account
          </button>
        ) : (
          <div className="p-4 rounded-2xl space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid #ef444440" }}>
            <p className="text-sm font-semibold text-center" style={{ color: "#ef4444" }}>⚠️ This is permanent</p>
            <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>Type <strong>DELETE</strong> to confirm.</p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-center outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid #ef444440", color: "var(--text-primary)" }}
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== "DELETE"}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: "#ef4444" }}>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}