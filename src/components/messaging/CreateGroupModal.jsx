import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Search, Camera, Check } from "lucide-react";

export default function CreateGroupModal({ user, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [follows, setFollows] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    base44.entities.Follow.filter({ follower_email: user.email }, "-created_date", 100)
      .then(setFollows).catch(() => {});
  }, [user.email]);

  const toggle = (follow) => {
    setSelected(prev =>
      prev.find(s => s.email === follow.following_email)
        ? prev.filter(s => s.email !== follow.following_email)
        : [...prev, { email: follow.following_email, name: follow.following_name, avatar: "", role: "member" }]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.length < 1) return;
    setCreating(true);
    let url = photoUrl;
    if (photo) {
      const res = await base44.integrations.Core.UploadFile({ file: photo });
      url = res.file_url;
    }
    const members = [
      { email: user.email, name: user.full_name, avatar: user.avatar_url || "", role: "admin" },
      ...selected,
    ];
    const group = await base44.entities.GroupChat.create({
      name: name.trim(),
      photo_url: url,
      creator_email: user.email,
      creator_name: user.full_name,
      members,
      member_emails: members.map(m => m.email),
    });
    setCreating(false);
    onCreate(group);
  };

  const filtered = follows.filter(f =>
    !search || f.following_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "90dvh" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>New Group Chat</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(90dvh - 80px)" }}>
          {/* Group photo + name */}
          <div className="flex items-center gap-4 mb-4">
            <label className="w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden"
              style={{ backgroundColor: "var(--bg-subtle)", border: "2px dashed var(--border-medium)" }}>
              {photoUrl ? <img src={photoUrl} className="w-full h-full object-cover" alt="" /> : <Camera className="w-6 h-6" style={{ color: "var(--text-hint)" }} />}
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files[0];
                if (f) { setPhoto(f); setPhotoUrl(URL.createObjectURL(f)); }
              }} />
            </label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Group name…"
              className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Selected preview */}
          {selected.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
              {selected.map(s => (
                <button key={s.email} onClick={() => toggle({ following_email: s.email })}
                  className="flex-shrink-0 flex flex-col items-center gap-1 text-xs"
                  style={{ color: "var(--text-secondary)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs relative"
                    style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}>
                    {s.name?.[0]?.toUpperCase()}
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center" style={{ fontSize: 8 }}>×</span>
                  </div>
                  <span className="truncate w-12 text-center">{s.name?.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <Search className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people…"
              className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }} />
          </div>

          {/* People list */}
          <div className="space-y-1 mb-4">
            {filtered.map(f => {
              const isSelected = selected.find(s => s.email === f.following_email);
              return (
                <button key={f.following_email} onClick={() => toggle(f)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                  style={{ backgroundColor: isSelected ? "var(--accent-primary-light)" : "transparent" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}>
                    {f.following_name?.[0]?.toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium text-left" style={{ color: "var(--text-primary)" }}>{f.following_name}</span>
                  {isSelected && <Check className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />}
                </button>
              );
            })}
          </div>

          <button onClick={handleCreate} disabled={!name.trim() || selected.length < 1 || creating}
            className="w-full py-3.5 rounded-2xl font-bold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #243D33, var(--accent-primary))" }}>
            {creating ? "Creating…" : `Create Group (${selected.length + 1} members)`}
          </button>
        </div>
      </div>
    </div>
  );
}