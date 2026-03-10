import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, ImageIcon, X, MapPin, Phone, Mail, Globe,
  Loader2, ChevronDown, ChevronUp, Check, Search
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

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-hint)" }}>{children}</p>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>{hint}</p>}
    </div>
  );
}

function Input({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />}
      <input
        {...props}
        className={`w-full py-3 rounded-2xl text-sm outline-none ${Icon ? "pl-10 pr-4" : "px-4"}`}
        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
      />
    </div>
  );
}

export default function CreateGroup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=type, 2=form
  const [groupType, setGroupType] = useState(null);

  // Basic
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [rules, setRules] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Logo + cover
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const logoRef = useRef(null);
  const coverRef = useRef(null);

  // Contact
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Location
  const [locationName, setLocationName] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [meetingSchedule, setMeetingSchedule] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  // Social
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Address search state
  const [addressInput, setAddressInput] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState(null); // { place_name, lat, lng, city }
  const [addressError, setAddressError] = useState("");
  const addressDebounceRef = useRef(null);
  const [mapboxToken, setMapboxToken] = useState(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSocial, setShowSocial] = useState(false);

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
      setAddressError("");
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=poi,address&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        setAddressSuggestions(data.features || []);
      } catch {
        setAddressSuggestions([]);
      }
      setAddressSearching(false);
    }, 350);
  };

  const selectAddress = (feature) => {
    const [lng, lat] = feature.center;
    const cityContext = feature.context?.find(c => c.id.startsWith("place.") || c.id.startsWith("locality."));
    const city = cityContext?.text || feature.properties?.city || "";
    setValidatedAddress({ place_name: feature.place_name, lat, lng, city });
    setAddressInput(feature.place_name);
    setAddressSuggestions([]);
    setAddressError("");
  };

  const clearAddress = () => {
    setValidatedAddress(null);
    setAddressInput("");
    setAddressSuggestions([]);
    setAddressError("");
  };

  const selectedCat = CATEGORIES.find(c => c.key === category);

  const handleImagePick = (e, type) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (type === "logo") { setLogoFile(f); setLogoPreview(url); }
    else { setCoverFile(f); setCoverPreview(url); }
    e.target.value = "";
  };

  const uploadFile = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  };

  const handleCreate = async () => {
    if (!name.trim() || saving) return;
    if (groupType === "realworld" && !validatedAddress) {
      setAddressError("Please search and select a valid meeting address.");
      return;
    }
    setSaving(true);
    setUploading(true);

    let logoUrl = null;
    let coverUrl = null;
    if (logoFile) logoUrl = await uploadFile(logoFile);
    if (coverFile) coverUrl = await uploadFile(coverFile);
    setUploading(false);

    const user = await base44.auth.me();

    const group = await base44.entities.Group.create({
      name: name.trim(),
      description: description.trim() || undefined,
      group_type: groupType,
      emoji: selectedCat?.emoji,
      category,
      rules: rules.trim() || undefined,
      is_private: isPrivate,
      logo_url: logoUrl || undefined,
      cover_image_url: coverUrl || undefined,
      cover_color: CATEGORY_COLORS[category],
      creator_email: user.email,
      creator_name: user.full_name || user.email,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      location_name: validatedAddress?.place_name || undefined,
      location_city: validatedAddress?.city || undefined,
      location_lat: validatedAddress?.lat || undefined,
      location_lng: validatedAddress?.lng || undefined,
      meeting_schedule: meetingSchedule.trim() || undefined,
      social_facebook: facebook.trim() || undefined,
      social_instagram: instagram.trim() || undefined,
      social_tiktok: tiktok.trim() || undefined,
      social_whatsapp: whatsapp.trim() || undefined,
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
    navigate(createPageUrl("Groups"));
  };

  // ── STEP 1: Choose Type ──────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-10" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="max-w-lg mx-auto">
          {/* Back */}
          <button onClick={() => navigate(createPageUrl("Groups"))}
            className="flex items-center gap-2 mb-6 text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Groups
          </button>

          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            Create a Group
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--text-hint)" }}>Choose your group type to get started</p>

          <div className="space-y-4">
            <motion.button whileTap={{ scale: 0.98 }}
              onClick={() => { setGroupType("realworld"); setStep(2); }}
              className="w-full text-left p-5 rounded-3xl border-2 transition-all"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>📍</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Real-World Group</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Groups that meet in physical locations. Perfect for yoga clubs, running groups, study meetups, and more.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {["Yoga Club", "Running Club", "Study Group", "Foodies"].map(t => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "#E8F2EC", color: "#2E6B4F" }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>

            <motion.button whileTap={{ scale: 0.98 }}
              onClick={() => { setGroupType("online"); setStep(2); }}
              className="w-full text-left p-5 rounded-3xl border-2 transition-all"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ background: "linear-gradient(135deg, #0284c7, #6d28d9)" }}>🌐</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Online Community</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Communities that interact inside the app. Great for discussions, sharing, and connecting around any topic.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {["Movie Discussions", "Coding Help", "AI Tools", "Travel Tips"].map(t => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "#EDE8DF", color: "#5C5C5C" }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Full Config Form ─────────────────────────────
  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="max-w-lg mx-auto">

        {/* Sticky Header */}
        <div className="sticky top-0 z-20 px-4 pt-4 pb-3 flex items-center justify-between"
          style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)" }}>
          <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {groupType === "realworld" ? "📍 Real-World Group" : "🌐 Online Community"}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>Group Configuration</p>
          </div>
          <div className="w-16" />
        </div>

        <div className="px-4 pt-6 space-y-8">

          {/* ── IDENTITY ── */}
          <section>
            <SectionLabel>Identity</SectionLabel>
            <div className="p-4 rounded-3xl space-y-5" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>

              {/* Logo */}
              <Field label="Group Logo">
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleImagePick(e, "logo")} />
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: getGrad(category), border: "2px solid var(--border-light)" }}>
                    {logoPreview
                      ? <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                      : <span className="text-3xl">{selectedCat?.emoji || "💬"}</span>}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <button onClick={() => logoRef.current?.click()}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold border"
                      style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}>
                      <ImageIcon className="w-4 h-4 inline mr-1.5" />Upload Logo
                    </button>
                    {logoPreview && (
                      <button onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="w-full py-2 rounded-xl text-xs font-semibold"
                        style={{ color: "#E05C7A", backgroundColor: "#FFF0F3" }}>Remove</button>
                    )}
                  </div>
                </div>
              </Field>

              {/* Cover Image */}
              <Field label="Cover Image">
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => handleImagePick(e, "cover")} />
                {coverPreview ? (
                  <div className="relative rounded-2xl overflow-hidden h-32">
                    <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => coverRef.current?.click()}
                    className="w-full py-5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium"
                    style={{ borderColor: "var(--border-medium)", color: "var(--text-hint)", backgroundColor: "var(--bg-subtle)" }}>
                    <ImageIcon className="w-4 h-4" /> Add cover image
                  </button>
                )}
              </Field>

              {/* Name */}
              <Field label="Group Name *">
                <Input value={name} onChange={e => setName(e.target.value)} maxLength={50}
                  placeholder={groupType === "realworld" ? "e.g. Morning Yoga Club, NYC Runners…" : "e.g. Film Buffs, Coding Café…"} />
              </Field>

              {/* Description */}
              <Field label="Description">
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={400}
                  placeholder="What's this group about? What can members expect?"
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

          {/* ── CONTACT ── */}
          <section>
            <SectionLabel>Contact Information</SectionLabel>
            <div className="p-4 rounded-3xl space-y-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <Field label="Phone Number">
                <Input icon={Phone} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" type="tel" />
              </Field>
              <Field label="Email Address">
                <Input icon={Mail} value={email} onChange={e => setEmail(e.target.value)} placeholder="group@example.com" type="email" />
              </Field>
            </div>
          </section>

          {/* ── LOCATION (real-world only) ── */}
          {groupType === "realworld" && (
            <section>
              <SectionLabel>Meeting Location *</SectionLabel>
              <div className="p-4 rounded-3xl space-y-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <Field
                  label="Meeting Address"
                  hint="Enter a real public address where your group meets (e.g. Bryant Park, 42nd St, New York)">
                  <div className="relative">
                    {validatedAddress ? (
                      <div className="flex items-start gap-2 px-3 py-3 rounded-2xl"
                        style={{ backgroundColor: "#E8F2EC", border: "1.5px solid #2E6B4F" }}>
                        <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#2E6B4F" }} />
                        <p className="text-xs font-semibold flex-1" style={{ color: "#2E6B4F" }}>{validatedAddress.place_name}</p>
                        <button onClick={clearAddress} className="shrink-0">
                          <X className="w-4 h-4" style={{ color: "#2E6B4F" }} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: "var(--text-hint)" }} />
                        <input
                          value={addressInput}
                          onChange={e => { setAddressInput(e.target.value); searchAddress(e.target.value); setValidatedAddress(null); }}
                          placeholder="Search for a real address or place…"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                          style={{ backgroundColor: "var(--bg-subtle)", border: `1px solid ${addressError ? "#E05C7A" : "var(--border-light)"}`, color: "var(--text-primary)" }}
                        />
                        {addressSearching && (
                          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: "var(--text-hint)" }} />
                        )}
                      </>
                    )}

                    <AnimatePresence>
                      {addressSuggestions.length > 0 && !validatedAddress && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl overflow-hidden"
                          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                          {addressSuggestions.map((feature, i) => (
                            <button key={feature.id || i} onClick={() => selectAddress(feature)}
                              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-[var(--bg-subtle)] transition-colors"
                              style={{ borderBottom: i < addressSuggestions.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{feature.text}</p>
                                <p className="text-[11px] truncate" style={{ color: "var(--text-hint)" }}>{feature.place_name}</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {addressError && <p className="text-xs mt-1 font-medium" style={{ color: "#E05C7A" }}>{addressError}</p>}
                </Field>

                <Field label="Meeting Schedule">
                  <Input value={meetingSchedule} onChange={e => setMeetingSchedule(e.target.value)} placeholder="e.g. Every Saturday at 9AM" />
                </Field>
              </div>
            </section>
          )}

          {/* ── SOCIAL NETWORKS ── */}
          <section>
            <button
              onClick={() => setShowSocial(v => !v)}
              className="w-full flex items-center justify-between mb-3">
              <SectionLabel>Social Networks</SectionLabel>
              {showSocial ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-hint)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-hint)" }} />}
            </button>

            {showSocial && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-3xl space-y-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>

                {/* Facebook */}
                <Field label="Facebook">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">📘</span>
                    <input value={facebook} onChange={e => setFacebook(e.target.value)}
                      placeholder="https://facebook.com/yourgroup"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                  </div>
                </Field>

                {/* Instagram */}
                <Field label="Instagram">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">📸</span>
                    <input value={instagram} onChange={e => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/yourgroup"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                  </div>
                </Field>

                {/* TikTok */}
                <Field label="TikTok">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">🎵</span>
                    <input value={tiktok} onChange={e => setTiktok(e.target.value)}
                      placeholder="https://tiktok.com/@yourgroup"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                  </div>
                </Field>

                {/* WhatsApp */}
                <Field label="WhatsApp">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">💬</span>
                    <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                      placeholder="https://wa.me/yournumber or group link"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                  </div>
                </Field>
              </motion.div>
            )}
          </section>

          {/* ── SETTINGS ── */}
          <section>
            <SectionLabel>Settings</SectionLabel>
            <div className="p-4 rounded-3xl space-y-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <Field label="Group Rules (optional)">
                <textarea value={rules} onChange={e => setRules(e.target.value)} rows={2} maxLength={300}
                  placeholder="e.g. Be respectful, no spam, stay on topic…"
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

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-3 max-w-lg mx-auto"
          style={{ backgroundColor: "var(--bg-app)", borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={handleCreate} disabled={!name.trim() || saving || (groupType === "realworld" && !validatedAddress)}
            className="w-full py-4 rounded-2xl text-base font-bold text-white disabled:opacity-50 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 20px rgba(46,107,79,0.4)" }}>
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploading ? "Uploading images…" : "Creating group…"}
              </span>
            ) : "✦ Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getGrad(category) {
  const GRADS = {
    fitness: ["#0d9488", "#16a34a"], food: ["#ea580c", "#d97706"],
    travel: ["#0284c7", "#6d28d9"], study: ["#d97706", "#b45309"],
    tech: ["#0284c7", "#0369a1"], art: ["#7c3aed", "#a21caf"],
    music: ["#db2777", "#be185d"], gaming: ["#16a34a", "#15803d"],
    books: ["#d97706", "#b45309"], movies: ["#7c3aed", "#4338ca"],
    health: ["#0d9488", "#16a34a"], sports: ["#ea580c", "#dc2626"],
    general: ["#64748b", "#475569"],
  };
  const [a, b] = GRADS[category] || GRADS.general;
  return `linear-gradient(135deg, ${a}, ${b})`;
}