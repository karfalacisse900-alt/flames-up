import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Upload, Save, X, Sparkles, Loader2, MessageSquare, Send, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const SOCIAL_FIELDS = [
  { key: "fiverr_url", label: "Fiverr", placeholder: "https://fiverr.com/yourprofile", emoji: "🟢" },
  { key: "upwork_url", label: "Upwork", placeholder: "https://upwork.com/freelancers/~...", emoji: "🟩" },
  { key: "website_url", label: "Website", placeholder: "https://yourwebsite.com", emoji: "🌐" },
  { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/yourhandle", emoji: "📸" },
  { key: "twitter_url", label: "Twitter/X", placeholder: "https://x.com/yourhandle", emoji: "🐦" },
  { key: "tiktok_url", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle", emoji: "🎵" },
  { key: "youtube_url", label: "YouTube", placeholder: "https://youtube.com/@yourchannel", emoji: "▶️" },
  { key: "shopify_url", label: "Shopify Store", placeholder: "https://yourstore.myshopify.com", emoji: "🛒" },
  { key: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/in/yourprofile", emoji: "💼" },
  { key: "github_url", label: "GitHub", placeholder: "https://github.com/yourusername", emoji: "💻" },
];

// ── AI Assistant panel ──────────────────────────────────────────────────────
function AIAssistant({ form, onApply }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // "describe" | "skills" | "portfolio" | "reply"
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult(null);

    let prompt = "";
    let schema = null;

    if (mode === "describe") {
      prompt = `You are a professional copywriter. Write a compelling short service description (1–2 sentences, max 120 chars) AND a detailed long description (3–4 sentences) for a freelancer with the following info:\nHeadline: ${form.headline || ""}\nCategory: ${form.category || ""}\nSkills: ${(form.skills || []).join(", ")}\nExtra context from user: ${input}\nMake it confident, specific, and client-focused.`;
      schema = { type: "object", properties: { short_description: { type: "string" }, long_description: { type: "string" } } };
    } else if (mode === "skills") {
      prompt = `Based on this freelancer profile, suggest 6–10 relevant skills as short tags (e.g. "Figma", "Logo Design", "Brand Identity"). Only return the skills array.\nHeadline: ${form.headline || ""}\nCategory: ${form.category || ""}\nDescription: ${form.short_description || form.long_description || ""}\nExtra: ${input}`;
      schema = { type: "object", properties: { skills: { type: "array", items: { type: "string" } } } };
    } else if (mode === "portfolio") {
      prompt = `Given this URL or project description, generate a concise portfolio item title (max 50 chars) and a short engaging description (1–2 sentences).\nURL/Description: ${input}\nFreelancer headline: ${form.headline || ""}`;
      schema = { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } };
    } else if (mode === "reply") {
      prompt = `You are a helpful freelancer assistant. Draft a professional, friendly reply to this client inquiry.\nFreelancer: ${form.name || ""}, ${form.headline || ""}\nInquiry: ${input}\nKeep it concise (2–3 sentences), warm, and professional.`;
      schema = { type: "object", properties: { reply: { type: "string" } } };
    }

    const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    setResult(res);
    setLoading(false);
  };

  const modes = [
    { id: "describe", label: "Write Description", emoji: "✍️", hint: "Optional: add extra context about your work" },
    { id: "skills", label: "Suggest Skills", emoji: "🎯", hint: "Optional: add any specific skills to include" },
    { id: "portfolio", label: "Portfolio from URL", emoji: "🔗", hint: "Paste a URL or describe a project" },
    { id: "reply", label: "Draft Reply", emoji: "💬", hint: "Paste a client inquiry to reply to" },
  ];

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
        style={{ backgroundColor: "#FDF3ED", color: "#D98B62", border: "1px solid #F5D5B8" }}>
        <Sparkles className="w-4 h-4" /> AI Assistant
      </button>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FAF7F0", border: "1px solid #F5D5B8" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#F5D5B8", backgroundColor: "#FDF3ED" }}>
        <span className="text-sm font-semibold flex items-center gap-2" style={{ color: "#D98B62" }}>
          <Sparkles className="w-4 h-4" /> AI Assistant
        </span>
        <button onClick={() => { setOpen(false); setMode(null); setResult(null); setInput(""); }}>
          <X className="w-4 h-4" style={{ color: "#A8A8A8" }} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-2">
          {modes.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setResult(null); setInput(""); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors"
              style={{
                backgroundColor: mode === m.id ? "#3C6E5A" : "#fff",
                color: mode === m.id ? "#fff" : "#2F2F2F",
                border: `1px solid ${mode === m.id ? "#3C6E5A" : "#E5DFD0"}`
              }}>
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>

        {mode && (
          <>
            <div>
              <p className="text-[11px] mb-1.5" style={{ color: "#A8A8A8" }}>
                {modes.find(m => m.id === mode)?.hint}
              </p>
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={mode === "portfolio" ? "https://... or describe the project" : mode === "reply" ? "Paste client message here…" : "Optional extra context…"}
                  rows={2}
                  className="flex-1 text-sm px-3 py-2 rounded-xl outline-none resize-none"
                  style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }}
                />
                <button onClick={run} disabled={loading || (["portfolio","reply"].includes(mode) && !input.trim())}
                  className="px-3 rounded-xl text-white disabled:opacity-40 shrink-0"
                  style={{ backgroundColor: "#3C6E5A" }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {result && (
              <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "#EEF3F0", border: "1px solid rgba(60,110,90,0.2)" }}>
                {mode === "describe" && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#A8A8A8" }}>Short Description</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#2F2F2F" }}>{result.short_description}</p>
                      <button onClick={() => onApply("short_description", result.short_description)}
                        className="mt-1.5 text-[11px] font-semibold px-3 py-1 rounded-full text-white"
                        style={{ backgroundColor: "#3C6E5A" }}>Apply</button>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#A8A8A8" }}>Full Description</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#2F2F2F" }}>{result.long_description}</p>
                      <button onClick={() => onApply("long_description", result.long_description)}
                        className="mt-1.5 text-[11px] font-semibold px-3 py-1 rounded-full text-white"
                        style={{ backgroundColor: "#3C6E5A" }}>Apply</button>
                    </div>
                  </>
                )}
                {mode === "skills" && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>Suggested Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.skills?.map(s => (
                        <button key={s} onClick={() => onApply("skills_add", s)}
                          className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{ backgroundColor: "#fff", color: "#3C6E5A", border: "1px solid rgba(60,110,90,0.4)" }}>
                          + {s}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => onApply("skills_replace", result.skills)}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-full text-white"
                      style={{ backgroundColor: "#3C6E5A" }}>Apply All</button>
                  </>
                )}
                {mode === "portfolio" && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>Generated</p>
                    <p className="text-xs font-semibold" style={{ color: "#2F2F2F" }}>{result.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#6E6E6E" }}>{result.description}</p>
                    <button onClick={() => { onApply("portfolio_item", { title: result.title, description: result.description, external_url: input.startsWith("http") ? input : "" }); setResult(null); setInput(""); }}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-full text-white"
                      style={{ backgroundColor: "#3C6E5A" }}>Use in Portfolio</button>
                  </>
                )}
                {mode === "reply" && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>Draft Reply</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#2F2F2F" }}>{result.reply}</p>
                    <button onClick={() => { navigator.clipboard?.writeText(result.reply); }}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-full text-white"
                      style={{ backgroundColor: "#3C6E5A" }}>Copy to Clipboard</button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function EditServiceProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [skillInput, setSkillInput] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // pending portfolio item from AI
  const [pendingPortfolio, setPendingPortfolio] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.ServicePerson.filter({ created_by: u.email }).then(people => {
        if (people.length > 0) { setProfile(people[0]); setForm(people[0]); }
      });
    }).catch(() => {});
  }, []);

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleAIApply = (type, value) => {
    if (type === "short_description" || type === "long_description") handleChange(type, value);
    else if (type === "skills_add") handleChange("skills", [...new Set([...(form.skills || []), value])]);
    else if (type === "skills_replace") handleChange("skills", value);
    else if (type === "portfolio_item") setPendingPortfolio(value);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange("image_url", file_url);
    setImageUploading(false);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    handleChange("skills", [...(form.skills || []), s]);
    setSkillInput("");
  };

  const removeSkill = (i) => handleChange("skills", (form.skills || []).filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    if (profile) {
      await base44.entities.ServicePerson.update(profile.id, form);
    } else {
      const p = await base44.entities.ServicePerson.create({ ...form, is_approved: true });
      setProfile(p);
    }
    // save pending portfolio item if any
    if (pendingPortfolio && profile) {
      await base44.entities.ServicePersonPortfolio.create({
        service_person_id: profile.id,
        owner_email: user.email,
        title: pendingPortfolio.title,
        description: pendingPortfolio.description,
        type: "link",
        external_url: pendingPortfolio.external_url || "",
        is_premium: true,
      });
      setPendingPortfolio(null);
    }
    qc.invalidateQueries({ queryKey: ["servicepeople"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3C6E5A", borderTopColor: "transparent" }} />
    </div>
  );

  const fieldEl = (key, label, placeholder) => (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "#A8A8A8" }}>{label}</label>
      <input value={form[key] || ""} onChange={e => handleChange(key, e.target.value)} placeholder={placeholder}
        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
        style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: "#F5F2E8" }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b" style={{ backgroundColor: "#FAF7F0", borderColor: "#E5DFD0" }}>
        <Link to={createPageUrl("Profile")} className="p-2 rounded-full" style={{ backgroundColor: "#EDE9E3" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#6E6E6E" }} />
        </Link>
        <h2 className="font-semibold flex-1" style={{ fontFamily: "var(--font-serif)", color: "#2F2F2F" }}>
          {profile ? "Edit Service Profile" : "Create Service Profile"}
        </h2>
        <Link to={createPageUrl("Messages")} className="p-2 rounded-full" style={{ backgroundColor: "#EDE9E3" }}>
          <MessageSquare className="w-4 h-4" style={{ color: "#6E6E6E" }} />
        </Link>
      </div>

      <div className="px-5 mt-5 space-y-5">

        {/* AI Assistant */}
        <AIAssistant form={form} onApply={handleAIApply} />

        {/* Pending portfolio preview */}
        {pendingPortfolio && (
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: "#EEF3F0", border: "1px solid rgba(60,110,90,0.3)" }}>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#3C6E5A" }}>Portfolio item ready to save</p>
              <p className="text-sm font-semibold" style={{ color: "#2F2F2F" }}>{pendingPortfolio.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6E6E6E" }}>{pendingPortfolio.description}</p>
            </div>
            <button onClick={() => setPendingPortfolio(null)}><X className="w-4 h-4" style={{ color: "#A8A8A8" }} /></button>
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: "#EEF3F0", color: "#3C6E5A", border: "2px solid #E5DFD0" }}>
            {form.image_url ? <img src={form.image_url} alt="avatar" className="w-full h-full object-cover" /> : (form.name?.[0] || "?")}
          </div>
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
            style={{ borderColor: "#3C6E5A", color: "#3C6E5A", backgroundColor: "#EEF3F0" }}>
            <Upload className="w-4 h-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {imageUploading ? "Uploading…" : form.image_url ? "Change Photo" : "Upload Photo"}
          </label>
        </div>

        {/* Basic info */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>Basic Info</p>
          {fieldEl("name", "Name", "Your full name")}
          {fieldEl("headline", "Headline", "e.g. Logo Designer, Mix Engineer")}
          {fieldEl("starting_price", "Starting Price", "e.g. from $20")}
          {fieldEl("location", "Location", "e.g. New York, USA")}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "#A8A8A8" }}>Platform</label>
            <select value={form.platform || "Independent"} onChange={e => handleChange("platform", e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }}>
              {["Fiverr","Upwork","Independent","Coach","Other"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "#A8A8A8" }}>Category</label>
            <select value={form.category || "other"} onChange={e => handleChange("category", e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }}>
              {["design","development","music","marketing","writing","video","coaching","other"].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* About */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>About</p>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "#A8A8A8" }}>Short Description</label>
            <textarea value={form.short_description || ""} onChange={e => handleChange("short_description", e.target.value)}
              placeholder="Brief summary shown on your card…" rows={2}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F", fontFamily: "var(--font-serif)" }} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "#A8A8A8" }}>Full Description</label>
            <textarea value={form.long_description || ""} onChange={e => handleChange("long_description", e.target.value)}
              placeholder="Tell people about your experience, process, what makes you stand out…" rows={5}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F", fontFamily: "var(--font-serif)" }} />
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>Skills</p>
          <div className="flex flex-wrap gap-2">
            {(form.skills || []).map((s, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: "#EEF3F0", color: "#3C6E5A", border: "1px solid rgba(60,110,90,0.25)" }}>
                {s}
                <button onClick={() => removeSkill(i)} className="ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSkill()}
              placeholder="Add a skill…"
              className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }} />
            <button onClick={addSkill} className="px-3 py-2 rounded-xl text-white text-sm"
              style={{ backgroundColor: "#3C6E5A" }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Social Links */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>Links & Socials</p>
          {SOCIAL_FIELDS.map(({ key, label, placeholder, emoji }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-lg w-6 text-center shrink-0">{emoji}</span>
              <input value={form[key] || ""} onChange={e => handleChange(key, e.target.value)} placeholder={placeholder}
                className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
                style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="fixed bottom-20 left-0 right-0 px-5 z-40">
        <button
          onClick={handleSave}
          disabled={saving || !form.name || !form.headline}
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          style={{ backgroundColor: saved ? "#5a9e7a" : "#3C6E5A" }}>
          {saved ? "✓ Saved!" : saving ? "Saving…" : <><Save className="w-4 h-4" /> {profile ? "Save Changes" : "Create Profile"}</>}
        </button>
      </div>
    </div>
  );
}