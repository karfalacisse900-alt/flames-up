import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DiscoverLogo from "./DiscoverLogo";

const catColors = {
  productivity: { bg: "rgba(111,143,114,0.15)", text: "#5C7A5F" },
  finance: { bg: "rgba(111,143,114,0.15)", text: "#5C7A5F" },
  learning: { bg: "rgba(85,121,166,0.12)", text: "#5579A6" },
  lifestyle: { bg: "rgba(184,107,75,0.12)", text: "#B86B4B" },
  entertainment: { bg: "rgba(184,107,75,0.12)", text: "#B86B4B" },
  health: { bg: "rgba(111,143,114,0.15)", text: "#5C7A5F" },
  social: { bg: "rgba(85,121,166,0.12)", text: "#5579A6" },
  developer_tools: { bg: "rgba(183,166,122,0.15)", text: "#8A7060" },
};

// Fallback: seeded shuffle for when AI is loading or fails
function seededShuffle(arr, seed) {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function emailToSeed(email) {
  if (!email) return Math.floor(Date.now() / 86400000);
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (Math.imul(31, h) + email.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fallbackPick(items, user, count = 8) {
  if (!items.length) return [];
  const seed = emailToSeed(user?.email);
  const sponsored = items.filter(i => i.is_sponsored);
  const featured = items.filter(i => i.is_featured && !i.is_sponsored);
  const newOnes = items.filter(i => i.is_new && !i.is_featured && !i.is_sponsored);
  const rest = items.filter(i => !i.is_sponsored && !i.is_featured && !i.is_new && i.is_approved);
  const pool = [
    ...seededShuffle(sponsored, seed),
    ...seededShuffle(featured, seed + 1),
    ...seededShuffle(newOnes, seed + 2),
    ...seededShuffle(rest, seed + 3),
  ];
  const seen = new Set();
  const result = [];
  for (const item of pool) {
    if (!seen.has(item.id)) { seen.add(item.id); result.push(item); }
    if (result.length >= count) break;
  }
  if (result.length < 3) {
    const fallback = seededShuffle(items.filter(i => !seen.has(i.id)), seed + 4);
    for (const item of fallback) {
      if (result.length >= count) break;
      result.push(item);
    }
  }
  return result;
}

export default function DiscoverBillboard({ items, user, onItemClick }) {
  const [slides, setSlides] = useState([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [aiLoading, setAiLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);
  const hasFetched = useRef(false);

  // Load AI-curated billboard once items are ready
  useEffect(() => {
    if (!items.length || hasFetched.current) return;
    hasFetched.current = true;

    // Show fallback immediately while AI loads
    setSlides(fallbackPick(items, user));
    setAiLoading(true);

    base44.functions.invoke("aiCurateBillboard", {})
      .then(res => {
        const data = res?.data;
        if (data?.items?.length >= 3) {
          setSlides(data.items);
          setIsPersonalized(!!data.personalized);
        }
      })
      .catch(() => {/* keep fallback */})
      .finally(() => setAiLoading(false));
  }, [items.length]);

  const go = useCallback((newDir, newIndex) => {
    setDirection(newDir);
    setIndex(newIndex);
    setPaused(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPaused(false), 4000);
  }, []);

  const prev = useCallback(() => {
    go(-1, (index - 1 + slides.length) % slides.length);
  }, [index, slides.length, go]);

  const next = useCallback(() => {
    go(1, (index + 1) % slides.length);
  }, [index, slides.length, go]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = setTimeout(() => {
      setDirection(1);
      setIndex(i => (i + 1) % slides.length);
    }, 7000);
    return () => clearTimeout(id);
  }, [index, paused, slides.length]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  if (!slides.length) return null;

  const item = slides[index];
  const catStyle = catColors[item.category] || { bg: "rgba(183,166,122,0.15)", text: "#8A7060" };
  const catLabel = item.category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 32 : -32 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -32 : 32 }),
  };

  return (
    <div className="px-5 mb-4">
      {/* Personalized label */}
      {isPersonalized && (
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Sparkles className="w-3 h-3" style={{ color: "var(--accent-secondary)" }} />
          <span className="text-[10px] font-medium" style={{ color: "var(--text-hint)" }}>
            Curated for you
          </span>
        </div>
      )}

      <div
        className="relative overflow-hidden rounded-3xl"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 4px 20px rgba(74,58,42,0.07)" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={item.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="p-5">
              {/* Top badges */}
              <div className="flex items-center gap-2 mb-4">
                {item.is_sponsored && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: "rgba(183,166,122,0.18)", color: "var(--accent-secondary)", border: "1px solid rgba(183,166,122,0.3)" }}>
                    Sponsored
                  </span>
                )}
                {item.is_featured && !item.is_sponsored && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: "rgba(111,143,114,0.14)", color: "var(--accent-primary)", border: "1px solid rgba(111,143,114,0.25)" }}>
                    ✦ Editor's Pick
                  </span>
                )}
                {item.is_new && !item.is_featured && !item.is_sponsored && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: "rgba(184,107,75,0.12)", color: "#B86B4B", border: "1px solid rgba(184,107,75,0.25)" }}>
                    New
                  </span>
                )}
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: catStyle.bg, color: catStyle.text }}>
                  {catLabel}
                </span>
              </div>

              {/* Logo + Info */}
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <DiscoverLogo item={item} size="xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold leading-snug"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                    {item.title}
                  </h2>
                  <p className="text-xs mt-0.5 mb-2" style={{ color: "var(--text-hint)" }}>{item.brand_name}</p>
                  <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {item.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {item.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="text-[10px] px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--bg-app)", color: "var(--text-hint)", border: "1px solid var(--border-medium)" }}>
                      {tag}
                    </span>
                  ))}
                  {item.pricing && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(183,166,122,0.12)", color: "#8A7060", border: "1px solid rgba(183,166,122,0.25)" }}>
                      {item.pricing}
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onItemClick(item)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition-colors"
                  style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-medium)" }}>
                  Read More
                </button>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold"
                    style={{ backgroundColor: "var(--accent-primary)", color: "#fff", boxShadow: "0 2px 10px rgba(111,143,114,0.3)" }}>
                    Visit <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* AI loading shimmer bar */}
        {aiLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden" style={{ backgroundColor: "var(--border-light)" }}>
            <motion.div
              className="h-full"
              style={{ backgroundColor: "var(--accent-primary)", width: "40%" }}
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* Left / Right nav arrows */}
        {slides.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(244,236,228,0.9)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(244,236,228,0.9)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-4">
            {slides.map((_, i) => (
              <button key={i} onClick={() => go(i > index ? 1 : -1, i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  backgroundColor: i === index ? "var(--accent-primary)" : "var(--border-medium)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}