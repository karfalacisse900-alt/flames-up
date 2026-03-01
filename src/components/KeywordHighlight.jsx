import React from "react";

/**
 * Smart keyword highlighter for Did You Know posts.
 * Auto-detects: money ($, %), freebies, numbers, locations, brands.
 * Premium look — bold chips, not childish labels.
 */

// ── Patterns ──────────────────────────────────────────────
const RULES = [
  // Money & deals — caramel accent
  {
    pattern: /\$[\d,.]+[MBKk]?|\d+[\d,.]*%\s*(OFF|DISCOUNT|BACK|CASHBACK)?|FREE|FREEMIUM|\bFREE\b|\bDISCOUNT\b|\bSAVE\b|\bDEAL\b|\bCASHBACK\b|\bREFUND\b/gi,
    style: { backgroundColor: "#BF9E7922", color: "#9A7240", fontWeight: "700", borderRadius: "5px", padding: "0 4px" },
    badge: true,
  },
  // Numbers and quantities — slightly bolder
  {
    pattern: /\b\d+(\.\d+)?\s*(million|billion|trillion|M|B|K|GB|TB|hours?|days?|weeks?|months?|years?|mins?|seconds?|x)\b|\b\d{4}\b/gi,
    style: { fontWeight: "700", color: "var(--text-primary)" },
    badge: false,
  },
  // Percentages not already caught
  {
    pattern: /\b\d+(\.\d+)?%/g,
    style: { backgroundColor: "#2E6B4F18", color: "#2E6B4F", fontWeight: "700", borderRadius: "5px", padding: "0 4px" },
    badge: true,
  },
  // Brands / well-known companies (expandable list)
  {
    pattern: /\b(Spotify|Apple|Google|Netflix|Amazon|Meta|Tesla|Twitter|TikTok|YouTube|Instagram|OpenAI|ChatGPT|Nike|Adidas|Samsung|Microsoft|Uber|Airbnb|Snapchat|Discord|Reddit|LinkedIn|Shopify|PayPal|Venmo|Coinbase|Robinhood|Walmart|Target|Costco|McDonald|Starbucks|Chipotle)\b/gi,
    style: { fontWeight: "700", color: "var(--text-primary)" },
    badge: false,
  },
  // Locations — soft teal
  {
    pattern: /\b(NYC|LA|SF|DC|Chicago|London|Paris|Tokyo|Berlin|Dubai|Canada|USA|US|UK|EU|Europe|Asia|Africa|California|Texas|Florida|New York|Los Angeles|San Francisco)\b/g,
    style: { backgroundColor: "#3B82F618", color: "#1D4ED8", fontWeight: "600", borderRadius: "5px", padding: "0 4px" },
    badge: true,
  },
  // Political terms — always neutral gray (no color bias)
  {
    pattern: /\b(Republican|Democrat|Liberal|Conservative|GOP|Congress|Senate|President|Government|Federal|White House)\b/gi,
    style: { backgroundColor: "#88888818", color: "#555", fontWeight: "600", borderRadius: "5px", padding: "0 3px" },
    badge: false,
  },
];

// ── Parse text into segments ──────────────────────────────
function parseSegments(text) {
  if (!text) return [{ type: "text", value: text }];

  // Build a flat list of all matches with their rule
  const allMatches = [];
  RULES.forEach((rule, ruleIdx) => {
    let match;
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = re.exec(text)) !== null) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, value: match[0], rule, ruleIdx });
    }
  });

  if (allMatches.length === 0) return [{ type: "text", value: text }];

  // Sort by start position, prefer earlier match; on tie prefer higher priority rule
  allMatches.sort((a, b) => a.start - b.start || a.ruleIdx - b.ruleIdx);

  // Remove overlapping matches (keep first)
  const clean = [];
  let cursor = 0;
  for (const m of allMatches) {
    if (m.start >= cursor) { clean.push(m); cursor = m.end; }
  }

  // Build segments
  const segments = [];
  cursor = 0;
  for (const m of clean) {
    if (m.start > cursor) segments.push({ type: "text", value: text.slice(cursor, m.start) });
    segments.push({ type: "keyword", value: m.value, style: m.rule.style, badge: m.rule.badge });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ type: "text", value: text.slice(cursor) });
  return segments;
}

// ── Component ─────────────────────────────────────────────
export default function KeywordHighlight({ text, className = "", baseStyle = {} }) {
  const segments = parseSegments(text);

  return (
    <span className={className} style={baseStyle}>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.value}</span>;
        return (
          <span key={i} style={{ display: "inline", ...seg.style, lineHeight: "inherit" }}>
            {seg.value}
          </span>
        );
      })}
    </span>
  );
}