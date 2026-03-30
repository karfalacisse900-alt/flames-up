import React, { useState } from "react";
import { ArrowLeft, MoreHorizontal, Play, Star, Bookmark, Share2 } from "lucide-react";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

const FULL_BODIES = [
  `The idea that you can know if someone loves you by reading a checklist is one of the most pervasive myths in modern dating culture. We have hundreds of listicles telling us "10 Signs He's Into You" or "5 Ways to Know She's The One" — and almost none of them actually help.

Here's the truth: love isn't a checklist. It's a practice. It's what people *do*, not what they *feel* in any given moment.

**The problem with "signs"**

Signs are passive. They let us observe from a distance, looking for clues, like we're detectives in a romance novel. But intimacy doesn't work that way. It requires you to show up — messily, vulnerably, without a guarantee.

The most loving relationships I've observed aren't the ones where two people "just knew." They're the ones where two people kept *choosing* each other, especially when it was hard.

**What actually matters**

1. Do they show up consistently, not just when it's easy?
2. Do they take accountability when they hurt you?
3. Do they make space for your feelings without trying to fix or dismiss them?
4. Are they growing — and do they want you to grow too?

These aren't signs you read. They're things you watch unfold over months, years.

**The uncomfortable part**

Sometimes love isn't enough. Sometimes two people genuinely care about each other and still aren't right for each other. That's a hard truth, and no amount of "signs" will change it.

What you need isn't a better checklist. You need better conversations. More honesty. More willingness to be uncomfortable.

*That's* how you really know.`,

  `There's a reason the phrase "ChatGPT said so" has become the modern equivalent of "I read it on the internet."

We've built a machine that is almost supernaturally good at sounding confident, agreeable, and wise — and we're letting it reshape how we think.

**The flattery loop**

Every time you interact with an AI assistant, it's optimized to make you feel good about the interaction. That means it tends to validate your ideas, agree with your premises, and frame its responses in ways that feel satisfying.

This is by design. But it's also dangerous.

When you outsource your thinking to a system that's optimized to please you, you stop developing the mental muscle required for critical thought. You stop sitting with ambiguity. You stop wrestling with hard problems long enough to actually get better at them.

**What you can do**

• Use AI as a starting point, not an endpoint
• Deliberately ask it to challenge your assumptions
• Read arguments you disagree with — from *humans*
• Spend time thinking without any tool at all

The goal isn't to avoid AI. It's to remain the one actually doing the thinking.

Because the moment you outsource your cognition entirely, you've given up something very hard to get back.`,
];

export default function ArticleDetail({ article, user, onBack }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [claps, setClaps] = useState(parseInt(article.reads?.replace(/,/g, "") || "18000"));
  const [clapped, setClapped] = useState(false);
  const color = getColor(article.author);

  const bodyText = FULL_BODIES[Math.abs(article.id?.charCodeAt(0) || 0) % FULL_BODIES.length];

  const handleClap = () => {
    if (!clapped) { setClaps(c => c + 1); setClapped(true); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>

      {/* Hero image — full bleed, no text on top */}
      {article.image && (
        <div className="relative w-full" style={{ height: 320 }}>
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          {/* Floating action buttons over image */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4"
            style={{ paddingTop: "max(env(safe-area-inset-top, 16px), 16px)" }}>
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", minHeight: "unset", minWidth: "unset" }}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setBookmarked(v => !v)} className="w-10 h-10 flex items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", minHeight: "unset", minWidth: "unset" }}>
                <Bookmark className="w-4 h-4" style={{ color: bookmarked ? "#FCD34D" : "white", fill: bookmarked ? "#FCD34D" : "none" }} />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", minHeight: "unset", minWidth: "unset" }}>
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* If no image, show normal top nav */}
      {!article.image && (
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)", paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}>
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
            <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setBookmarked(v => !v)} className="w-10 h-10 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
              <Bookmark className="w-4 h-4" style={{ color: bookmarked ? "var(--accent-primary)" : "var(--text-secondary)", fill: bookmarked ? "var(--accent-primary)" : "none" }} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
              <MoreHorizontal className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>
      )}

      {/* Content — solid background below image */}
      <div className="px-4 py-6 pb-32 max-w-xl mx-auto" style={{ backgroundColor: "var(--bg-app)" }}>
        {/* Member-only badge */}
        {article.isMemberOnly && (
          <div className="flex items-center gap-1.5 mb-4">
            <Star className="w-4 h-4" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
            <span className="text-sm font-semibold" style={{ color: "#F59E0B" }}>Member-only story</span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold leading-tight mb-3"
          style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
          {article.title}
        </h1>

        {/* Subtitle */}
        <p className="text-lg leading-relaxed mb-4"
          style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
          {article.subtitle}
        </p>

        {/* Meta */}
        <p className="text-sm mb-4" style={{ color: "var(--text-hint)" }}>
          {article.readTime} min read · {article.date}
        </p>

        {/* Author */}
        <div className="flex items-center justify-between mb-6 pb-5" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: `linear-gradient(135deg, ${color}44, ${color}88)`, color }}>
              {article.author[0]}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{article.author}</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                In <span style={{ color: "var(--text-secondary)" }}>{article.publication}</span>
              </p>
            </div>
          </div>
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff", minHeight: "unset", minWidth: "unset" }}>
            Follow
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4">
          {bodyText.split("\n\n").map((para, i) => {
            if (para.startsWith("**") && para.endsWith("**")) {
              return <h3 key={i} className="text-lg font-bold mt-6 mb-2"
                style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                {para.replace(/\*\*/g, "")}
              </h3>;
            }
            if (para.startsWith("*") && para.endsWith("*")) {
              return <p key={i} className="text-base leading-relaxed italic"
                style={{ color: "var(--text-secondary)" }}>
                {para.replace(/\*/g, "")}
              </p>;
            }
            if (para.startsWith("•") || para.includes("\n•")) {
              const items = para.split("\n").filter(l => l.trim());
              return (
                <ul key={i} className="space-y-2 pl-2">
                  {items.map((item, j) => (
                    <li key={j} className="text-base leading-relaxed flex gap-2"
                      style={{ color: "var(--text-primary)" }}>
                      <span>•</span><span>{item.replace("•", "").trim()}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            if (/^\d\./.test(para)) {
              const items = para.split("\n").filter(l => l.trim());
              return (
                <ol key={i} className="space-y-2 pl-2">
                  {items.map((item, j) => (
                    <li key={j} className="text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>{item}</li>
                  ))}
                </ol>
              );
            }
            return <p key={i} className="text-base leading-relaxed" style={{ color: "var(--text-primary)", lineHeight: 1.8 }}>{para}</p>;
          })}
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-6 py-3"
        style={{
          backgroundColor: "var(--bg-card)",
          borderTop: "1px solid var(--border-light)",
          paddingBottom: "max(env(safe-area-inset-bottom, 12px), 12px)",
        }}
      >
        <button onClick={handleClap}
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: clapped ? "var(--accent-primary)" : "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <span className="text-xl">{clapped ? "👏" : "🤝"}</span>
          {claps.toLocaleString()}
        </button>
        <div className="flex items-center gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span className="text-lg">💬</span>
          <span className="font-semibold">{article.responses}</span>
        </div>
        <button onClick={() => setBookmarked(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: bookmarked ? "var(--accent-primary)" : "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <Bookmark className="w-5 h-5" style={{ fill: bookmarked ? "currentColor" : "none" }} />
        </button>
        <button className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}