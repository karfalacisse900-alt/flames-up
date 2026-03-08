import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const CACHE_PREFIX = "smart_text_v2_";
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export const SMART_LINKS_PREF_KEY = "smart_links_enabled";

export function getSmartLinksEnabled() {
  try {
    const val = localStorage.getItem(SMART_LINKS_PREF_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

export function setSmartLinksEnabled(val) {
  try {
    localStorage.setItem(SMART_LINKS_PREF_KEY, String(val));
  } catch {}
}

function getCacheKey(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return CACHE_PREFIX + Math.abs(hash);
}

function getFromCache(text) {
  try {
    const raw = localStorage.getItem(getCacheKey(text));
    if (!raw) return null;
    const { entities, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_MAX_AGE) {
      localStorage.removeItem(getCacheKey(text));
      return null;
    }
    return entities;
  } catch {
    return null;
  }
}

function saveToCache(text, entities) {
  try {
    localStorage.setItem(getCacheKey(text), JSON.stringify({ entities, timestamp: Date.now() }));
  } catch {}
}

// Quick pre-filter: skip very short texts or pure URLs
function mightHaveEntities(text) {
  return text.length >= 15 && !/^https?:\/\/\S+$/.test(text.trim());
}

function extractHashtags(text) {
  const out = [];
  const re = /#(\w+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ phrase: m[0], start: m.index, end: m.index + m[0].length, type: "hashtag" });
  }
  return out;
}

async function detectEntities(text) {
  const cached = getFromCache(text);
  if (cached !== null) return cached;

  if (!mightHaveEntities(text)) {
    return [];
  }

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Identify specific named entities in this text that users would want to search. Only return real proper nouns: songs, artists, movies, TV shows, books, albums, locations (parks, cities, landmarks), brands, apps, events.

Text: "${text}"

Rules:
- Only specific named things (not generic words)
- Return exact substrings from the text
- Multi-word phrases preferred
- Skip pronouns, adjectives, verbs, common nouns
- If nothing qualifies, return empty array

Examples of GOOD: "Billie Jean", "Michael Jackson", "Avatar", "Bryant Park", "Netflix", "iPhone"
Examples of BAD: "today", "watching", "listening", "really", "the", "my"`,
      response_json_schema: {
        type: "object",
        properties: {
          entities: { type: "array", items: { type: "string" } }
        }
      }
    });

    const entities = Array.isArray(result?.entities) ? result.entities.filter(e => e && e.length > 1) : [];
    saveToCache(text, entities);
    return entities;
  } catch (e) {
    console.error("SmartText entity detection failed:", e);
    return [];
  }
}

function buildSegments(text, entityPhrases) {
  const matches = [];

  for (const phrase of entityPhrases) {
    let idx = 0;
    while (true) {
      const pos = text.indexOf(phrase, idx);
      if (pos === -1) break;
      matches.push({ phrase, start: pos, end: pos + phrase.length, type: "entity" });
      idx = pos + 1;
      break; // only first occurrence per phrase
    }
  }

  for (const ht of extractHashtags(text)) {
    matches.push(ht);
  }

  if (!matches.length) return [{ type: "text", text }];

  // Sort by position, remove overlaps
  matches.sort((a, b) => a.start - b.start);
  const clean = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      clean.push(m);
      lastEnd = m.end;
    }
  }

  const segments = [];
  let cursor = 0;
  for (const m of clean) {
    if (m.start > cursor) segments.push({ type: "text", text: text.slice(cursor, m.start) });
    segments.push({ type: m.type, text: m.phrase });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ type: "text", text: text.slice(cursor) });
  return segments;
}

function buildHashtagOnly(text) {
  const hts = extractHashtags(text);
  if (!hts.length) return [{ type: "text", text }];
  const segments = [];
  let cursor = 0;
  for (const ht of hts) {
    if (ht.start > cursor) segments.push({ type: "text", text: text.slice(cursor, ht.start) });
    segments.push({ type: "hashtag", text: ht.phrase });
    cursor = ht.end;
  }
  if (cursor < text.length) segments.push({ type: "text", text: text.slice(cursor) });
  return segments;
}

export default function SmartText({ text, className, style }) {
  const [segments, setSegments] = useState(null);
  const enabled = getSmartLinksEnabled();

  useEffect(() => {
    if (!text) { setSegments([{ type: "text", text: "" }]); return; }
    if (!enabled) { setSegments([{ type: "text", text }]); return; }

    // Immediately show hashtags
    setSegments(buildHashtagOnly(text));

    // Async entity detection
    detectEntities(text).then(entities => {
      if (entities.length > 0) {
        setSegments(buildSegments(text, entities));
      }
    });
  }, [text, enabled]);

  const handleClick = (phrase, type) => {
    const q = type === "hashtag" ? phrase.slice(1) : phrase;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer");
  };

  if (!segments) return <span className={className} style={style}>{text}</span>;

  return (
    <span className={className} style={style}>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.text}</span>;
        return (
          <span
            key={i}
            onClick={e => { e.stopPropagation(); e.preventDefault(); handleClick(seg.text, seg.type); }}
            style={{
              color: "#7C69C4",
              cursor: "pointer",
              borderBottom: "1px dotted rgba(124,105,196,0.5)",
              transition: "color 0.15s ease, background 0.15s ease",
              borderRadius: 2,
              padding: "0 1px",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "#5D4DB0";
              e.currentTarget.style.background = "rgba(124,105,196,0.1)";
              e.currentTarget.style.borderBottomStyle = "solid";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "#7C69C4";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderBottomStyle = "dotted";
            }}
          >
            {seg.text}
          </span>
        );
      })}
    </span>
  );
}