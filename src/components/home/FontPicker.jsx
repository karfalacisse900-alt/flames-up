import React from "react";

export const FONTS = [
  { id: "serif",       label: "Classic",     style: "Georgia, serif",                         preview: "Aa" },
  { id: "sans",        label: "Modern",      style: "Inter, system-ui, sans-serif",            preview: "Aa" },
  { id: "lora",        label: "Lora",        style: "'Lora', Georgia, serif",                  preview: "Aa" },
  { id: "mono",        label: "Mono",        style: "'Courier New', Courier, monospace",        preview: "Aa" },
  { id: "cursive",     label: "Script",      style: "'Dancing Script', cursive",               preview: "Aa" },
  { id: "playfair",    label: "Playfair",    style: "'Playfair Display', Georgia, serif",       preview: "Aa" },
  { id: "raleway",     label: "Raleway",     style: "'Raleway', sans-serif",                   preview: "Aa" },
  { id: "roboto-slab", label: "Slab",        style: "'Roboto Slab', Georgia, serif",            preview: "Aa" },
];

export function getFontStyle(fontId) {
  return FONTS.find(f => f.id === fontId)?.style || FONTS[0].style;
}

export default function FontPicker({ value, onChange }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Typography
      </p>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {FONTS.map(font => (
          <button
            key={font.id}
            onClick={() => onChange(font.id)}
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "8px 10px",
              borderRadius: 12,
              border: `2px solid ${value === font.id ? "var(--accent-primary)" : "var(--border-light)"}`,
              backgroundColor: value === font.id ? "rgba(60,110,90,0.07)" : "transparent",
              cursor: "pointer",
              minWidth: 56,
            }}
          >
            <span style={{ fontFamily: font.style, fontSize: 18, color: value === font.id ? "var(--accent-primary)" : "var(--text-primary)", lineHeight: 1 }}>
              {font.preview}
            </span>
            <span style={{ fontSize: 9, fontWeight: 500, color: value === font.id ? "var(--accent-primary)" : "var(--text-hint)", whiteSpace: "nowrap" }}>
              {font.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}