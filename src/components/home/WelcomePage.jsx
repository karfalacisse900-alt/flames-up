import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Flame } from "lucide-react";

const SLIDES = [
  {
    emoji: "🌍",
    title: "Explore the World",
    desc: "See posts, events, and live moments from cities around the globe.",
    gradient: "from-emerald-500 to-teal-600",
    bg: "#E8F5EC",
  },
  {
    emoji: "📍",
    title: "Discover Nearby",
    desc: "Find what's happening near you — events, communities, and local creators.",
    gradient: "from-orange-400 to-rose-500",
    bg: "#FFF0EA",
  },
  {
    emoji: "🎥",
    title: "Create & Share",
    desc: "Post videos, photos, and stories. Go live and connect with your community.",
    gradient: "from-violet-500 to-indigo-600",
    bg: "#F0EEFF",
  },
];

const FLOATING_ITEMS = [
  { emoji: "📍", label: "Tokyo, Japan", top: "8%", left: "6%", delay: "0s" },
  { emoji: "🎤", label: "Live Music", top: "18%", right: "5%", delay: "0.4s" },
  { emoji: "📸", label: "New York", top: "30%", left: "2%", delay: "0.8s" },
  { emoji: "🌆", label: "London Event", top: "42%", right: "4%", delay: "0.2s" },
  { emoji: "🎨", label: "Art Show", top: "55%", left: "5%", delay: "1s" },
  { emoji: "🍜", label: "Seoul, Korea", top: "65%", right: "6%", delay: "0.6s" },
];

export default function WelcomePage() {
  const [slide, setSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [showLocation, setShowLocation] = useState(false);
  const intervalRef = useRef(null);

  // Auto-advance slides
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, 3200);
    return () => clearInterval(intervalRef.current);
  }, []);

  const goToSlide = (i) => {
    clearInterval(intervalRef.current);
    setSlide(i);
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      goToSlide(diff > 0 ? (slide + 1) % SLIDES.length : (slide - 1 + SLIDES.length) % SLIDES.length);
    }
    setTouchStart(null);
  };

  const handleSignIn = () => base44.auth.redirectToLogin();
  const handleSignUp = () => base44.auth.redirectToLogin();
  const handleGuest = () => {
    // Show location prompt before guest access
    setShowLocation(true);
  };
  const handleLocationAllow = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {}, () => {});
    }
    setShowLocation(false);
    // Redirect to login anyway — guest browsing requires auth in this app
    base44.auth.redirectToLogin();
  };
  const handleLocationSkip = () => {
    setShowLocation(false);
    base44.auth.redirectToLogin();
  };

  // Location permission overlay
  if (showLocation) {
    return (
      <div className="fixed inset-0 flex items-end justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <div className="w-full max-w-sm mx-auto rounded-t-3xl p-6 pb-10" style={{ backgroundColor: "var(--bg-card)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-center mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            Discover What's Near You
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: "var(--text-secondary)" }}>
            Allow location access to see events, posts, and creators around you.
          </p>
          <button
            onClick={handleLocationAllow}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-base mb-3"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            📍 Allow Location
          </button>
          <button
            onClick={handleLocationSkip}
            className="w-full py-3 text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Not Now
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = SLIDES[slide];

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-app)" }}>

      {/* ── Hero Section ─────────────────────────────────────── */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: "46vh", minHeight: 280 }}>
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: slide === 0
              ? "linear-gradient(145deg, #1a4731 0%, #2E6B4F 50%, #4CAF7D 100%)"
              : slide === 1
              ? "linear-gradient(145deg, #7C2D12 0%, #C2410C 50%, #FB923C 100%)"
              : "linear-gradient(145deg, #3730A3 0%, #6D28D9 50%, #A78BFA 100%)",
          }}
        />

        {/* Soft blob */}
        <div
          className="absolute rounded-full opacity-20 transition-all duration-1000"
          style={{
            width: 280, height: 280,
            top: -80, right: -80,
            backgroundColor: "#fff",
            filter: "blur(60px)",
          }}
        />

        {/* Floating location/activity chips */}
        {FLOATING_ITEMS.map((item, i) => (
          <div
            key={i}
            className="absolute flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              backgroundColor: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.25)",
              animationName: "floatChip",
              animationDuration: "3s",
              animationDelay: item.delay,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDirection: "alternate",
              whiteSpace: "nowrap",
              fontSize: 11,
            }}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </div>
        ))}

        {/* Center logo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)" }}>
              <Flame className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-serif)", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
              flames-up
            </span>
          </div>
          <p className="text-white/70 text-xs tracking-widest uppercase font-medium">Discover · Connect · Share</p>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: "linear-gradient(to bottom, transparent, var(--bg-app))" }} />
      </div>

      {/* ── Content Section ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-5 pt-2 pb-6 overflow-y-auto">

        {/* Headline */}
        <div className="text-center mb-1 mt-1">
          <h1 className="text-2xl font-bold leading-tight mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            Explore Communities &amp; Creators Everywhere
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Find events, discover communities, share experiences, and explore what people are doing in cities around the world.
          </p>
        </div>

        {/* Feature Slider */}
        <div
          className="mt-4 mb-4 rounded-2xl overflow-hidden flex-shrink-0 cursor-grab"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ backgroundColor: currentSlide.bg, border: "1px solid var(--border-light)", minHeight: 120 }}
        >
          <div className="px-5 py-5 text-center transition-all duration-500">
            <div className="text-4xl mb-2">{currentSlide.emoji}</div>
            <h3 className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {currentSlide.title}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {currentSlide.desc}
            </p>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mb-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === slide ? 20 : 7,
                height: 7,
                backgroundColor: i === slide ? "var(--accent-primary)" : "var(--border-medium)",
              }}
            />
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 flex-shrink-0">
          <button
            onClick={handleSignUp}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-base shadow-lg"
            style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 6px 20px rgba(46,107,79,0.3)" }}
          >
            Create Account
          </button>
          <button
            onClick={handleSignIn}
            className="w-full py-3.5 rounded-2xl font-bold text-base"
            style={{
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1.5px solid var(--border-medium)",
            }}
          >
            Sign In
          </button>
          <button
            onClick={handleGuest}
            className="w-full py-3 text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Explore as Guest →
          </button>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <a href="#" className="text-xs" style={{ color: "var(--text-hint)" }}>Terms of Service</a>
          <span style={{ color: "var(--border-medium)" }}>·</span>
          <a href="#" className="text-xs" style={{ color: "var(--text-hint)" }}>Privacy Policy</a>
        </div>
      </div>

      {/* Float animation keyframes injected via style tag */}
      <style>{`
        @keyframes floatChip {
          from { transform: translateY(0px); }
          to   { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}