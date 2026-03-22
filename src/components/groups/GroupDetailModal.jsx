import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Lock, Globe, MapPin, DollarSign, Star, Phone, Mail, Calendar } from "lucide-react";

const CATEGORY_EMOJIS = {
  fitness: "💪", food: "🍕", travel: "✈️", study: "📚", tech: "💻",
  art: "🎨", music: "🎵", gaming: "🎮", books: "📖", movies: "🎬",
  health: "🏃", sports: "⚽", relationships: "❤️", motivation: "🔥", general: "💬",
};

const GRADIENTS = {
  fitness:  ["#0d9488","#16a34a"], food: ["#ea580c","#d97706"],
  travel:   ["#0284c7","#6d28d9"], tech: ["#0284c7","#0369a1"],
  art:      ["#7c3aed","#a21caf"], music: ["#db2777","#be185d"],
  gaming:   ["#16a34a","#15803d"], movies: ["#7c3aed","#4338ca"],
  sports:   ["#ea580c","#dc2626"], general: ["#64748b","#475569"],
};

function getGrad(cat) {
  const [a, b] = GRADIENTS[cat] || GRADIENTS.general;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export default function GroupDetailModal({ group, isMember, onClose, onJoin, onOpen }) {
  if (!group) return null;

  const statsItems = [
    { label: "Popular", value: group.member_count || 0 },
    { label: "Posts", value: group.post_count || Math.floor((group.member_count || 0) * 0.8) },
    { label: "Active", value: Math.floor((group.member_count || 0) * 0.4) },
    { label: "Events", value: group.event_count || Math.floor((group.member_count || 0) * 0.1) },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150]" onClick={onClose}
        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-[32px] overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", maxHeight: "90dvh", overflowY: "auto" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Cover gradient */}
          <div className="relative h-44" style={{ background: getGrad(group.category) }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)" }} />
            <button onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
              <X className="w-4 h-4 text-white" />
            </button>
            {/* Logo */}
            <div className="absolute bottom-[-28px] left-5 w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-3xl"
              style={{ backgroundColor: "var(--bg-card)", border: "3px solid var(--bg-card)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
              {group.logo_url
                ? <img src={group.logo_url} alt="" className="w-full h-full object-cover" />
                : <span>{group.emoji || CATEGORY_EMOJIS[group.category] || "💬"}</span>}
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-10 pb-6">
            {/* Name + badges */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-xl leading-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                  {group.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                    {CATEGORY_EMOJIS[group.category] || "💬"} {group.category}
                  </span>
                  {group.is_private && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  )}
                  {group.group_type === "realworld" && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                      style={{ backgroundColor: "#FFF7ED", color: "#C2410C" }}>
                      <MapPin className="w-3 h-3" /> Real-World
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 my-4">
              {statsItems.map(s => (
                <div key={s.label} className="flex flex-col items-center py-3 rounded-2xl"
                  style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <span className="font-bold text-lg" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {s.value}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-hint)" }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {group.description && (
              <div className="mb-4">
                <h4 className="font-bold text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>About</h4>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{group.description}</p>
              </div>
            )}

            {/* Details list */}
            <div className="space-y-3 mb-5">
              {group.created_by && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--accent-primary-light)" }}>
                    <Star className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>Owner</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {group.created_by?.split("@")[0] || "Admin"}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <Users className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>Members</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {(group.member_count || 0).toLocaleString()} members
                  </p>
                </div>
              </div>
              {group.location_city && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#FFF7ED" }}>
                    <MapPin className="w-4 h-4" style={{ color: "#C2410C" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>Location</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {[group.location_city, group.location_country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
              {group.is_paid && group.monthly_fee && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#F0FDF4" }}>
                    <DollarSign className="w-4 h-4" style={{ color: "#16A34A" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>Membership Fee</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      ${group.monthly_fee}/month
                    </p>
                  </div>
                </div>
              )}
              {group.contact_email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--bg-subtle)" }}>
                    <Mail className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>Contact</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
                      {group.contact_email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => { onClose(); onOpen(group); }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}>
                View Group
              </button>
              {!isMember ? (
                <button onClick={() => { onJoin(group); onClose(); }}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}>
                  Join Group
                </button>
              ) : (
                <button onClick={() => { onClose(); onOpen(group); }}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}>
                  Open Chat
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}