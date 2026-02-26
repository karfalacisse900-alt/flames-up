import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Twitter, Facebook, MessageCircle, Check, Link } from "lucide-react";

const TYPE_EMOJI = { movie: "🎬", show: "📺", book: "📚", game: "🎮", music: "🎵" };

function getShareText(item) {
  const emoji = TYPE_EMOJI[item.media_type] || "✨";
  const name = item.title || item.name;
  const creator = item.creator || item.artist;
  return `${emoji} Check out "${name}"${creator ? ` by ${creator}` : ""} on Vibe! #discover`;
}

function getShareUrl(item) {
  const base = window.location.origin;
  const id = item.id || encodeURIComponent(item.title || item.name);
  return `${base}/Discover?media=${id}&type=${item.media_type || "item"}`;
}

export default function ShareModal({ item, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = getShareText(item);
  const url = getShareUrl(item);
  const fullText = `${text}\n${url}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, "_blank");
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, "_blank");
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title: item.title || item.name, text, url }).catch(() => {});
    } else {
      copyLink();
    }
  };

  const cover = item.cover_url || item.image_url || item.logo_url;

  return (
    <div className="fixed inset-0 z-[60] flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-modal)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Share</p>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Item preview card */}
        <div className="mx-5 mb-4 p-3 rounded-2xl flex gap-3 items-center"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
          {cover ? (
            <img src={cover} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: "var(--bg-card)" }}>
              {TYPE_EMOJI[item.media_type] || "✨"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.title || item.name}</p>
            {(item.creator || item.artist) && (
              <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{item.creator || item.artist}</p>
            )}
            <p className="text-[10px] mt-0.5 capitalize" style={{ color: "var(--accent-primary)" }}>{item.media_type || "item"}</p>
          </div>
        </div>

        {/* Share buttons */}
        <div className="px-5 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-hint)" }}>Share to</p>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {/* Twitter/X */}
            <button onClick={shareTwitter} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "#000", border: "1px solid #333" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>X / Twitter</span>
            </button>

            {/* Facebook */}
            <button onClick={shareFacebook} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "#1877F2" }}>
                <Facebook className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Facebook</span>
            </button>

            {/* WhatsApp */}
            <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "#25D366" }}>
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>WhatsApp</span>
            </button>

            {/* More / Native */}
            <button onClick={shareNative} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: "var(--accent-primary)" }}>
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>More</span>
            </button>
          </div>

          {/* Copy link */}
          <button onClick={copyLink}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-6 transition-all active:scale-[0.99]"
            style={{ backgroundColor: copied ? "var(--accent-primary-light)" : "var(--bg-subtle)", border: `1px solid ${copied ? "var(--accent-primary)" : "var(--border-light)"}` }}>
            <div className="flex items-center gap-2.5">
              <Link className="w-4 h-4" style={{ color: copied ? "var(--accent-primary)" : "var(--text-secondary)" }} />
              <div className="text-left">
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Copy link</p>
                <p className="text-[10px] truncate max-w-[200px]" style={{ color: "var(--text-hint)" }}>{url}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold shrink-0"
              style={{ color: copied ? "var(--accent-primary)" : "var(--text-secondary)" }}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}