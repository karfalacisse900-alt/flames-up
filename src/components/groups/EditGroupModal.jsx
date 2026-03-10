import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  X, ImageIcon, Video, MapPin, Phone, Mail,
  Loader2, Check, Search, ChevronDown, ChevronUp
} from "lucide-react";

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

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>{hint}</p>}
    </div>
  );
}

function SectionLabel({ children }) {
  return <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-hint)" }}>{children}</p>;
}

export default function EditGroupModal({ group, onClose, onUpdated }) {
  const [name, setName] = useState(group.name || "");
  const [description, setDescription] = useState(group.description || "");
  const [category, setCategory] = useState(group.category || "general");
  const [rules, setRules] = useState(group.rules || "");
  const [isPrivate, setIsPrivate] = useState(group.is_private || false);
  const [meetingSchedule, setMeetingSchedule] = useState(group.meeting_schedule || "");
  const [phone, setPhone] = useState(group.phone || "");
  const [email, setEmail] = useState(group.email || "");
  const [facebook, setFacebook] = useState(group.social_facebook || "");
  const [instagram, setInstagram] = useState(group.social_instagram || "");
  const [tiktok, setTiktok] = useState(group.social_tiktok || "");
  const [whatsapp, setWhatsapp] = useState(group.social_whatsapp || "");
  const [showSocial, setShowSocial] = useState(false);

  // Media
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(group.logo_url || null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(group.cover_image_url || null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoName, setVideoName] = useState(group.preview_video_url ? "Current preview video" : null);
  const logoRef = useRef(null);
  const coverRef = useRef(null);
  const videoRef = useRef(null);

  // Address (realworld)
  const [addressInput, setAddressInput] = useState(group.location_name || "");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState(
    group.location_name ? { place_name: group.location_name, lat: group.location_lat, lng: group.location_lng, city: group.location_city } : null
  );
  const addressDebounceRef = useRef(null);
  const [mapboxToken, setMapboxToken] = useState(null);

  const [saving, setSaving] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  useEffect(() => {
    base44.functions.invoke("mapboxToken", {}).then(res => {
      if (res.data?.token) setMapboxToken(res.data.token);
    }).catch(() => {});
  }, []);

  const searchAddress = (query) => {
    if (!query.trim() || !mapboxToken) return;
    clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(async () => {
      setAddressSearching(true);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=poi,address&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        setAddressSuggestions(data.features || []);
      } catch { setAddressSuggestions([]); }
      setAddressSearching(false);
    }, 350);
  };

  const selectAddress = (feature) => {
    const [lng, lat] = feature.center;
    const cityContext = feature.context?.find(c => c.id.startsWith("place.") || c.id.startsWith("locality."));
    const city = cityContext?.text || "";
    setValidatedAddress({ place_name: feature.place_name, lat, lng, city });
    setAddressInput(feature.place_name);
    setAddressSuggestions([]);
  };

  const handleFilePick = (e, type) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (type === "logo") { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
    else if (type === "cover") { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
    else if (type === "video") { setVideoFile(f); setVideoName(f.name); }
    e.target.value = "";
  };

  const upload = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);

    let logoUrl = group.logo_url;
    let coverUrl = group.cover_image_url;
    let videoUrl = group.preview_video_url;

    if (logoFile) { setUploadMsg("Uploading logo…"); logoUrl = await upload(logoFile); }
    if (coverFile) { setUploadMsg("Uploading cover…"); coverUrl = await upload(coverFile); }
    if (videoFile) { setUploadMsg("Uploading video…"); videoUrl = await upload(videoFile); }
    setUploadMsg("Saving…");

    const updates = {
      name: name.trim(),
      description: description.trim() || null,
      category,
      rules: rules.trim() || null,
      is_private: isPrivate,
      meeting_schedule: meetingSchedule.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      social_facebook: facebook.trim() || null,
      social_instagram: instagram.trim() || null,
      social_tiktok: tiktok.trim() || null,
      social_whatsapp: whatsapp.trim() || null,
      logo_url: logoUrl || null,
      cover_image_url: coverUrl || null,
      preview_video_url: videoUrl || null,
    };

    if (group.group_type === "realworld" && validatedAddress) {
      updates.location_name = validatedAddress.place_name;
      updates.location_city = validatedAddress.city;
      updates.location_lat = validatedAddress.lat;
      updates.location_lng = validatedAddress.lng;
    }

    await base44.entities.Group.update(group.id, updates);
    setSaving(false);
    onUpdated({ ...group, ...updates });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="absolute bottom-0 left-0 right-0 max-w-lg mx-auto rounded-t-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "var(--bg-app)", maxHeight: "92dvh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Edit Group</h2>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Update your group's information</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 pt-4 pb-6 space-y-6">

          {/* IDENTITY */}
          <section>
            <SectionLabel>Identity</SectionLabel>
            <div className="p-4 rounded-3xl space-y-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>

              {/* Logo */}
              <Field label="Group Logo">
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleFilePick(e, "logo")} />
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: "var(--bg-subtle)", border: "2px solid var(--border-light)" }}>
                    {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">💬</span>}
                  </div>
                  <button onClick={() => logoRef.current?.click()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}>
                    <ImageIcon className="w-4 h-4 inline mr-1.5" />Change Logo
                  </button>
                </div>
              </Field>

              {/* Cover */}
              <Field label="Cover Image">
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => handleFilePick(e, "cover")} />
                {coverPreview ? (
                  <div className="relative rounded-2xl overflow-hidden h-28">
                    <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => coverRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                      <span className="text-white text-xs font-semibold">Change Cover</span>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => coverRef.current?.click()}
                    className="w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium"
                    style={{ borderColor: "var(--border-medium)", color: "var(--text-hint)", backgroundColor: "var(--bg-subtle)" }}>
                    <ImageIcon className="w-4 h-4" /> Add cover image
                  </button>
                )}
              </Field>

              {/* Preview Video */}
              <Field label="Preview Video" hint="Short clip showing what your group does">
                <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleFilePick(e, "video")} />
                {videoName ? (
                  <div className="flex items-center gap-2 px-3 py-3 rounded-2xl"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                    <Video className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                    <p className="text-xs font-semibold flex-1 truncate" style={{ color: "var(--text-primary)" }}>{videoName}</p>
                    <button onClick={() => videoRef.current?.click()} className="text-xs font-semibold shrink-0" style={{ color: "var(--accent-primary)" }}>Change</button>
                    <button onClick={() => { setVideoFile(null); setVideoName(null); }}
                      className="shrink-0"><X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} /></button>
                  </div>
                ) : (
                  <button onClick={() => videoRef.current?.click()}
                    className="w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium"
                    style={{ borderColor: "var(--border-medium)", color: "var(--text-hint)", backgroundColor: "var(--bg-subtle)" }}>
                    <Video className="w-4 h-4" /> Upload preview video
                  </button>
                )}
              </Field>

              {/* Name */}
              <Field label="Group Name *">
                <input value={name} onChange={e => setName(e.target.value)} maxLength={50}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </Field>

              {/* Description */}
              <Field label="Description">
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={400}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </Field>

              {/* Category */}
              <Field label="Category">
                <div className="flex flex-wrap gap-2">
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
              </Field>
            </div>
          </section>

          {/* CONTACT */}
          <section>
            <SectionLabel>Contact</SectionLabel>
            <div className="p-4 rounded-3xl space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <Field label="Phone">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
                  <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                </div>
              </Field>
              <Field label="Email">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="group@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                </div>
              </Field>
            </div>
          </section>

          {/* LOCATION (realworld only) */}
          {group.group_type === "realworld" && (
            <section>
              <SectionLabel>Meeting Location</SectionLabel>
              <div className="p-4 rounded-3xl space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <Field label="Address">
                  <div className="relative">
                    {validatedAddress ? (
                      <div className="flex items-start gap-2 px-3 py-3 rounded-2xl"
                        style={{ backgroundColor: "#E8F2EC", border: "1.5px solid #2E6B4F" }}>
                        <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#2E6B4F" }} />
                        <p className="text-xs font-semibold flex-1" style={{ color: "#2E6B4F" }}>{validatedAddress.place_name}</p>
                        <button onClick={() => { setValidatedAddress(null); setAddressInput(""); }}>
                          <X className="w-4 h-4" style={{ color: "#2E6B4F" }} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: "var(--text-hint)" }} />
                        <input value={addressInput}
                          onChange={e => { setAddressInput(e.target.value); searchAddress(e.target.value); }}
                          placeholder="Search for a new address…"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                        {addressSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: "var(--text-hint)" }} />}
                      </>
                    )}
                    <AnimatePresence>
                      {addressSuggestions.length > 0 && !validatedAddress && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl overflow-hidden"
                          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                          {addressSuggestions.map((f, i) => (
                            <button key={f.id || i} onClick={() => selectAddress(f)}
                              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left"
                              style={{ borderBottom: i < addressSuggestions.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{f.text}</p>
                                <p className="text-[11px] truncate" style={{ color: "var(--text-hint)" }}>{f.place_name}</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Field>
                <Field label="Meeting Schedule">
                  <input value={meetingSchedule} onChange={e => setMeetingSchedule(e.target.value)}
                    placeholder="e.g. Every Saturday at 9AM"
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                </Field>
              </div>
            </section>
          )}

          {/* SOCIAL */}
          <section>
            <button onClick={() => setShowSocial(v => !v)}
              className="w-full flex items-center justify-between mb-3">
              <SectionLabel>Social Networks</SectionLabel>
              {showSocial ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-hint)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-hint)" }} />}
            </button>
            {showSocial && (
              <div className="p-4 rounded-3xl space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                {[
                  { label: "Facebook", emoji: "📘", value: facebook, set: setFacebook, ph: "https://facebook.com/yourgroup" },
                  { label: "Instagram", emoji: "📸", value: instagram, set: setInstagram, ph: "https://instagram.com/yourgroup" },
                  { label: "TikTok", emoji: "🎵", value: tiktok, set: setTiktok, ph: "https://tiktok.com/@yourgroup" },
                  { label: "WhatsApp", emoji: "💬", value: whatsapp, set: setWhatsapp, ph: "https://wa.me/yournumber" },
                ].map(s => (
                  <Field key={s.label} label={s.label}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">{s.emoji}</span>
                      <input value={s.value} onChange={e => s.set(e.target.value)} placeholder={s.ph}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                    </div>
                  </Field>
                ))}
              </div>
            )}
          </section>

          {/* SETTINGS */}
          <section>
            <SectionLabel>Settings</SectionLabel>
            <div className="p-4 rounded-3xl space-y-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <Field label="Group Rules">
                <textarea value={rules} onChange={e => setRules(e.target.value)} rows={2} maxLength={300}
                  placeholder="e.g. Be respectful, no spam…"
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </Field>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Private Group</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Only members can see posts</p>
                </div>
                <button onClick={() => setIsPrivate(v => !v)}
                  className="w-12 h-6 rounded-full transition-all relative shrink-0"
                  style={{ backgroundColor: isPrivate ? "var(--accent-primary)" : "var(--border-medium)" }}>
                  <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow transition-all"
                    style={{ left: isPrivate ? "calc(100% - 22px)" : "2px" }} />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Save button */}
        <div className="px-4 pb-6 pt-3 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-app)" }}>
          <button onClick={handleSave} disabled={!name.trim() || saving}
            className="w-full py-4 rounded-2xl text-base font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 20px rgba(46,107,79,0.35)" }}>
            {saving
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />{uploadMsg || "Saving…"}</span>
              : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}