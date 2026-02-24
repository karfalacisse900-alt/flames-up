import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, BookOpen, MessageSquare, Compass, Palette, Radio, User, Star, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const FAQ_SECTIONS = [
  {
    icon: "🏠",
    title: "Home Feed",
    items: [
      { q: "What is the Home feed?", a: "The Home feed is where you see posts from the community — questions, quotes, and concerns shared anonymously or openly. You can like, reply, and interact with them." },
      { q: "What does the swipe mode do?", a: "Swipe mode lets you swipe through posts like cards. Swipe right to like, or use the buttons at the bottom. It's a fun, focused way to explore thoughts one at a time." },
      { q: "How do I post something?", a: "Tap the green '+ Post' button at the top right of the Home page. Choose your post type (Question, Quote, or Concern), write your text, pick a font, and publish." },
      { q: "Can I post anonymously?", a: "Yes! When creating a post, toggle the 'Anonymous' option. Your name won't be shown to anyone — only you know it's yours." },
      { q: "What are Boosted posts?", a: "Boosted posts are pinned to the top of the feed for a limited time. You can boost your own posts using Coins from your Wallet." },
    ]
  },
  {
    icon: "🧭",
    title: "Discover",
    items: [
      { q: "What is the Discover page?", a: "Discover is your hub for finding apps, products, services, and local recommendations. Browse, filter, vote, and save things you love." },
      { q: "How do I filter apps or products?", a: "Use the category chips at the top to filter by type (Laptop, Headphones, etc.), then tap 'Filters' to narrow by price range, brand, or specific features." },
      { q: "What are Smart Filters?", a: "Smart Filters like 'Underrated', 'Just Launched', and 'Hidden Gems' help you discover content you wouldn't normally find through regular browsing." },
      { q: "How does the Quick Vote (👍🤔🔥) work?", a: "Tap any reaction under an app or product card to quickly share your opinion. Votes are tallied and shown as social proof to help others decide." },
      { q: "Can I save items for later?", a: "Yes! Tap the bookmark icon on any app or product card to save it. Find all saved items in your Profile under the Saved tab." },
    ]
  },
  {
    icon: "🎨",
    title: "Art",
    items: [
      { q: "What is the Art section?", a: "Art is a creative gallery where community members share digital artwork. You can browse, like pieces, and even buy or sell art using Coins." },
      { q: "How do I sell my art?", a: "Upload your artwork, set a Coin price, and toggle 'For Sale'. Others can purchase it, and the Coins transfer to your wallet instantly." },
      { q: "What is Art Fight?", a: "Art Fight is a fun community challenge where two art pieces go head-to-head. Users vote for their favorite, and the winner advances in the bracket." },
    ]
  },
  {
    icon: "📻",
    title: "Live Rooms",
    items: [
      { q: "What are Live Rooms?", a: "Live Rooms are real-time chat spaces hosted by community members. Join a room to discuss topics, share thoughts, or just hang out." },
      { q: "How do I start a Live Room?", a: "Go to the Live page and tap 'Start a Room'. Give it a title, choose a category, optionally set a Coin entry price, and go live." },
      { q: "What are gifts in Live Rooms?", a: "While in a Live Room, you can send virtual gifts (powered by Coins) to the host. It's a way to show appreciation for great content." },
    ]
  },
  {
    icon: "🪙",
    title: "Coins & Wallet",
    items: [
      { q: "What are Coins?", a: "Coins are the in-app currency. You earn them by checking in daily, having posts liked, hosting live rooms, and selling art. Spend them on boosts, gifts, and paid rooms." },
      { q: "How do I earn Coins?", a: "Daily check-in (+10), post liked (+1 each), art sold (sale price), hosting a live room, referrals, and signup bonus all earn you Coins." },
      { q: "How do I buy Coins?", a: "Go to your Wallet page and tap 'Buy Coins'. You can purchase coin packs securely through the app." },
    ]
  },
  {
    icon: "👤",
    title: "Profile",
    items: [
      { q: "How do I edit my profile?", a: "Go to Profile → tap 'Edit Profile'. You can update your display name, bio, avatar, skills, and interests." },
      { q: "What are Badges?", a: "Badges are earned by reaching milestones — like posting, getting likes, or being active. They appear on your profile and show your community standing." },
      { q: "How do followers work?", a: "Visit someone's profile by tapping their name on a post, then tap 'Follow'. Their posts will appear in your 'Following' feed tab on the Home page." },
      { q: "How do I follow someone?", a: "Tap on any post author's name to visit their profile, then tap the 'Follow' button. You can also follow from the post detail view." },
    ]
  },
];

const ONBOARDING_STEPS = [
  {
    step: 1,
    emoji: "👋",
    title: "Welcome to the Community",
    description: "This is a safe space to share thoughts, questions, and quotes — anonymously or openly. No judgment here.",
    color: "#E6EFEA",
    accent: "#3C6E5A",
  },
  {
    step: 2,
    emoji: "📝",
    title: "Share Your Thoughts",
    description: "Tap '+ Post' on the Home page to share a Question, Quote, or Concern. Choose a font, toggle anonymity, and publish.",
    color: "#FFF3E8",
    accent: "#BF9E79",
  },
  {
    step: 3,
    emoji: "🧭",
    title: "Discover Apps & Products",
    description: "Head to Discover to find curated tools, products, and local services. Vote on what you love and save things for later.",
    color: "#EEF3F0",
    accent: "#3C6E5A",
  },
  {
    step: 4,
    emoji: "🎨",
    title: "Explore Art & Live Rooms",
    description: "Browse the Art gallery or drop into a Live Room for real-time conversation. Express yourself, connect, and be inspired.",
    color: "#F5F0E8",
    accent: "#BF9E79",
  },
  {
    step: 5,
    emoji: "🪙",
    title: "Earn & Spend Coins",
    description: "Check in daily, get likes, and host rooms to earn Coins. Use them to boost posts, send gifts, and buy art.",
    color: "#EEF3F0",
    accent: "#3C6E5A",
  },
  {
    step: 6,
    emoji: "✦",
    title: "You're All Set!",
    description: "Explore freely, connect genuinely, and remember — here, we listen and we don't judge. Welcome aboard.",
    color: "#E6EFEA",
    accent: "#3C6E5A",
  },
];

function OnboardingGuide() {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];

  return (
    <div>
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        {ONBOARDING_STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className="rounded-full transition-all"
            style={{
              width: i === step ? 20 : 7,
              height: 7,
              backgroundColor: i === step ? "var(--accent-primary)" : "var(--border-medium)",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.28 }}
          className="rounded-2xl p-6 text-center mb-6"
          style={{ backgroundColor: current.color, border: `1px solid ${current.accent}22` }}
        >
          <p className="text-5xl mb-4">{current.emoji}</p>
          <p className="font-semibold text-lg mb-2" style={{ color: "#243D33", fontFamily: "var(--font-serif)" }}>{current.title}</p>
          <p className="text-sm leading-relaxed" style={{ color: "#4a6659" }}>{current.description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-30"
          style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}
        >
          Back
        </button>
        {step < ONBOARDING_STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            Next →
          </button>
        ) : (
          <Link
            to={createPageUrl("Home")}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center transition-all active:scale-95"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            Start Exploring ✦
          </Link>
        )}
      </div>
    </div>
  );
}

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden border transition-all"
      style={{ borderColor: open ? "var(--accent-primary)" : "var(--border-light)", backgroundColor: "var(--bg-card)" }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <p className="text-sm font-medium flex-1 pr-3" style={{ color: "var(--text-primary)" }}>{item.q}</p>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform"
          style={{ color: "var(--accent-primary)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-subtle)" }}>
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpCenter() {
  const [activeTab, setActiveTab] = useState("guide");
  const [openSection, setOpenSection] = useState(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl("Home")} className="p-2 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Guidance & Support</h1>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Learn how everything works</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[["guide", "🗺️ How It Works"], ["faq", "💬 FAQ"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: activeTab === key ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: activeTab === key ? "#fff" : "var(--text-secondary)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 pb-24">
        {activeTab === "guide" ? (
          <div>
            <p className="text-sm mb-5 text-center" style={{ color: "var(--text-secondary)" }}>
              New here? This quick guide walks you through everything.
            </p>
            <OnboardingGuide />
          </div>
        ) : (
          <div className="space-y-4">
            {FAQ_SECTIONS.map((section) => (
              <div key={section.title}>
                <button
                  onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{section.icon}</span>
                    {section.title}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 transition-transform"
                    style={{ color: "var(--accent-primary)", transform: openSection === section.title ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                <AnimatePresence>
                  {openSection === section.title && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-2 pl-1">
                        {section.items.map((item, i) => (
                          <FAQItem key={i} item={item} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}