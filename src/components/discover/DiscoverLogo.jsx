import React from "react";

const colorPalette = [
  { bg: "#EEF3F0", text: "#3C6E5A" },
  { bg: "#EDF2F7", text: "#5579A6" },
  { bg: "#FDF3ED", text: "#D98B62" },
  { bg: "#F2F0EC", text: "#6E6E6E" },
  { bg: "#F5EEF5", text: "#9B59B6" },
  { bg: "#FEF9E7", text: "#B7950B" },
];

function getColor(title = "") {
  const idx = (title.charCodeAt(0) || 0) % colorPalette.length;
  return colorPalette[idx];
}

export default function DiscoverLogo({ item, size = "md" }) {
  const dim = size === "lg" ? "w-16 h-16" : size === "sm" ? "w-10 h-10" : "w-14 h-14";
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const pixelSize = size === "lg" ? 64 : size === "sm" ? 40 : 56;

  const hostname = (() => { try { return item.link ? new URL(item.link).hostname : null; } catch { return null; } })();
  const faviconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=${pixelSize * 2}` : null;
  const src = item.logo_url || faviconUrl;

  const [failed, setFailed] = React.useState(false);
  const color = getColor(item.title);

  return (
    <div
      className={`${dim} rounded-2xl overflow-hidden shrink-0 flex items-center justify-center font-bold ${textSize}`}
      style={{
        backgroundColor: (src && !failed) ? "var(--bg-app)" : color.bg,
        border: "1px solid var(--border-light)",
      }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={{ color: color.text, fontFamily: "var(--font-serif)" }}>
          {item.title?.[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}