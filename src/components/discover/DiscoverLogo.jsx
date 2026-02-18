import React from "react";

export default function DiscoverLogo({ item, size = "md" }) {
  const dim = size === "lg" ? "w-16 h-16" : size === "sm" ? "w-10 h-10" : "w-14 h-14";
  const fallbackText = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-xl";
  const hostname = (() => { try { return item.link ? new URL(item.link).hostname : null; } catch { return null; } })();
  const faviconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=64` : null;
  const [imgSrc] = React.useState(item.logo_url || faviconUrl);
  const [failed, setFailed] = React.useState(false);

  return (
    <div className={`${dim} rounded-2xl overflow-hidden shrink-0 flex items-center justify-center font-bold ${fallbackText}`}
      style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
      {imgSrc && !failed ? (
        <img src={imgSrc} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span style={{ color: "var(--accent-primary)" }}>{item.title?.[0]?.toUpperCase()}</span>
      )}
    </div>
  );
}