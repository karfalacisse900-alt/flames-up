import React, { useState } from "react";
import { X, Phone, Globe, Clock, Navigation, Flag, Star, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LocationDetailPanel({ locationData, user, onClose, onNavigate }) {
  const [reported, setReported] = useState(false);
  const [showHours, setShowHours] = useState(false);

  if (!locationData) return null;

  const { name, address, phone, website, hours, category, city, region, country } = locationData;

  const handleReport = async () => {
    if (!user || reported) return;
    await base44.entities.Report.create({
      content_type: "post",
      content_id: name,
      reason: "Incorrect location information",
      reporter_email: user.email,
      status: "pending",
    }).catch(() => {});
    setReported(true);
  };

  const categoryEmoji = {
    restaurant: "🍽️", food: "🍔", cafe: "☕", coffee: "☕",
    park: "🌳", garden: "🌿", shop: "🛍️", store: "🏪",
    library: "📚", school: "🏫", stadium: "🏟️", hotel: "🏨",
    airport: "✈️", transit: "🚌",
  }[category] || "📍";

  return (
    <div
      className="absolute bottom-4 left-3 right-3 z-30 rounded-3xl overflow-hidden"
      style={{
        backgroundColor: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
        border: "1px solid rgba(0,0,0,0.08)",
        maxHeight: "60vh",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: "#F1F5F9" }}
        >
          {categoryEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight" style={{ color: "#0F172A", fontFamily: "var(--font-serif)" }}>
            {name}
          </h3>
          {(city || region) && (
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              {[city, region, country].filter(Boolean).join(", ")}
            </p>
          )}
          {category && (
            <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
              {category.replace(/-/g, " ")}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
          style={{ backgroundColor: "#F1F5F9", minHeight: 32, minWidth: 32 }}
        >
          <X className="w-4 h-4" style={{ color: "#64748B" }} />
        </button>
      </div>

      {/* Address */}
      {address && (
        <div className="px-4 pb-2 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F8FAFC" }}>
            <span className="text-sm">📌</span>
          </div>
          <p className="text-sm pt-1.5 leading-snug" style={{ color: "#374151" }}>{address}</p>
        </div>
      )}

      {/* Phone */}
      {phone && (
        <div className="px-4 pb-2">
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold">{phone}</span>
            <span className="ml-auto text-xs font-medium opacity-70">Tap to call</span>
          </a>
        </div>
      )}

      {/* Website */}
      {website && (
        <div className="px-4 pb-2">
          <a
            href={website.startsWith("http") ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold truncate">{website.replace(/^https?:\/\//, "").split("/")[0]}</span>
            <span className="ml-auto text-xs font-medium opacity-70 shrink-0">Visit →</span>
          </a>
        </div>
      )}

      {/* Hours */}
      {hours && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowHours(v => !v)}
            className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-left"
            style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold flex-1">
              {typeof hours === "string" ? hours : "View hours"}
            </span>
            {showHours ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showHours && typeof hours === "object" && (
            <div className="mt-1.5 px-3 py-2 rounded-xl text-xs space-y-1" style={{ backgroundColor: "#FEFCE8" }}>
              {Object.entries(hours).map(([day, time]) => (
                <div key={day} className="flex justify-between">
                  <span className="font-semibold capitalize" style={{ color: "#92400E" }}>{day}</span>
                  <span style={{ color: "#78716C" }}>{time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 pb-3 flex gap-2 pt-1">
        <button
          onClick={onNavigate}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", boxShadow: "0 4px 16px rgba(79,70,229,0.35)" }}
        >
          <Navigation className="w-4 h-4" /> Directions
        </button>
        <button
          onClick={handleReport}
          disabled={reported}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold"
          style={{
            backgroundColor: reported ? "#F1F5F9" : "#FFF1F2",
            color: reported ? "#94A3B8" : "#E11D48",
          }}
        >
          <Flag className="w-4 h-4" />
          {reported ? "Reported" : "Report"}
        </button>
      </div>
    </div>
  );
}