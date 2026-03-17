import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Shield, ChevronRight, X, Check, Eye, EyeOff, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

// ── Fake animated pins for the landing background ──────────────────────────
const FAKE_PINS = [
  { id: 1, x: "20%", y: "30%", delay: 0,   color: "#4F46E5" },
  { id: 2, x: "65%", y: "20%", delay: 0.4, color: "#10B981" },
  { id: 3, x: "45%", y: "55%", delay: 0.8, color: "#F59E0B" },
  { id: 4, x: "75%", y: "60%", delay: 1.2, color: "#EF4444" },
  { id: 5, x: "15%", y: "65%", delay: 1.6, color: "#8B5CF6" },
  { id: 6, x: "55%", y: "78%", delay: 2.0, color: "#06B6D4" },
  { id: 7, x: "30%", y: "45%", delay: 0.6, color: "#F97316" },
  { id: 8, x: "82%", y: "38%", delay: 1.4, color: "#10B981" },
];

const PULSE_RINGS = [
  { x: "45%", y: "55%", delay: 0 },
  { x: "20%", y: "30%", delay: 0.8 },
  { x: "75%", y: "60%", delay: 1.6 },
];

const SLIDES = [
  {
    icon: Users,
    color: "#4F46E5",
    bgColor: "#EEF2FF",
    title: "Find people near you",
    bullets: ["See friends and nearby users on the map", "Control who can see you"],
    emoji: "👥",
  },
  {
    icon: MapPin,
    color: "#10B981",
    bgColor: "#ECFDF5",
    title: "Explore places instantly",
    bullets: ["Food, parks, events, hidden spots", "Tap any place for details"],
    emoji: "📍",
  },
  {
    icon: Shield,
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    title: "You're always in control",
    bullets: ["Choose who sees your location", "Go invisible anytime"],
    emoji: "🛡️",
  },
];

const INTERESTS = [
  { id: "food",     label: "Food",      emoji: "🍕" },
  { id: "events",   label: "Events",    emoji: "🎉" },
  { id: "fitness",  label: "Fitness",   emoji: "💪" },
  { id: "shopping", label: "Shopping",  emoji: "🛍️" },
  { id: "nightlife",label: "Nightlife", emoji: "🌙" },
  { id: "parks",    label: "Parks",     emoji: "🌿" },
  { id: "art",      label: "Art",       emoji: "🎨" },
  { id: "coffee",   label: "Coffee",    emoji: "☕" },
];

const PRIVACY_OPTIONS = [
  { id: "everyone",     label: "Everyone",              sub: "Anyone on the map can see you",    icon: "🌍" },
  { id: "friends_only", label: "Friends only",           sub: "Only people you follow",           icon: "👥" },
  { id: "selected",     label: "Only selected friends",  sub: "You choose exactly who sees you",  icon: "🎯" },
  { id: "invisible",    label: "Invisible",              sub: "No one can see your location",     icon: "👻" },
];

// ── STEP IDs ────────────────────────────────────────────────────────────────
const STEPS = ["landing", "slides", "account", "profile", "location", "privacy", "interests", "done"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState("landing");
  const [slideIdx, setSlideIdx] = useState(0);
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [profile, setProfile] = useState({ username: "", status: "", avatar: null });
  const [privacy, setPrivacy] = useState("everyone");
  const [interests, setInterests] = useState([]);
  const [locationGranted, setLocationGranted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const slideTimer = useRef(null);

  const goNext = (to) => setStep(to);

  // Auto-advance slides
  useEffect(() => {
    if (step !== "slides") return;
    slideTimer.current = setTimeout(() => {
      if (slideIdx < SLIDES.length - 1) setSlideIdx(i => i + 1);
    }, 3200);
    return () => clearTimeout(slideTimer.current);
  }, [step, slideIdx]);

  const handleSignIn = () => base44.auth.redirectToLogin(window.location.origin + "/Home");
  const handleGetStarted = () => goNext("slides");

  const handleLocationRequest = () => {
    if (!navigator.geolocation) { setLocationGranted(false); goNext("privacy"); return; }
    navigator.geolocation.getCurrentPosition(
      () => { setLocationGranted(true); goNext("privacy"); },
      () => { setLocationGranted(false); goNext("privacy"); }
    );
  };

  const handleFinish = async () => {
    setSubmitting(true);
    // Save interests + privacy prefs to user profile if logged in
    try {
      const user = await base44.auth.me().catch(() => null);
      if (user) {
        await base44.auth.updateMe({ interests, visibility_mode: privacy }).catch(() => {});
      }
    } catch {}
    setSubmitting(false);
    // Mark onboarding done in sessionStorage so it doesn't show again this session
    sessionStorage.setItem("onboarding_done", "1");
    navigate("/Places");
  };

  const toggleInterest = (id) =>
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#0B1120", fontFamily: "var(--font-sans)" }}>
      <AnimatePresence mode="wait">

        {/* ── LANDING ────────────────────────────────────────────────────── */}
        {step === "landing" && (
          <motion.div key="landing" className="absolute inset-0 flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}>

            {/* Animated map background */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Grid lines */}
              <div className="absolute inset-0" style={{
                backgroundImage: "linear-gradient(rgba(79,70,229,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.08) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }} />
              {/* Radial glow */}
              <div className="absolute inset-0" style={{
                background: "radial-gradient(circle at 50% 45%, rgba(79,70,229,0.25) 0%, rgba(16,185,129,0.12) 40%, transparent 70%)",
              }} />
              {/* Pulse rings */}
              {PULSE_RINGS.map((r, i) => (
                <motion.div key={i} className="absolute rounded-full border"
                  style={{ left: r.x, top: r.y, width: 80, height: 80, marginLeft: -40, marginTop: -40, borderColor: "rgba(79,70,229,0.4)" }}
                  animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.8, delay: r.delay, repeat: Infinity, ease: "easeOut" }} />
              ))}
              {/* Pins */}
              {FAKE_PINS.map(pin => (
                <motion.div key={pin.id} className="absolute"
                  style={{ left: pin.x, top: pin.y }}
                  initial={{ scale: 0, opacity: 0, y: -12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: pin.delay, type: "spring", stiffness: 300 }}>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: pin.color, border: "3px solid rgba(255,255,255,0.9)" }}>
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <motion.div className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: pin.color }}
                      animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: pin.delay }} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Content overlay */}
            <div className="relative z-10 flex flex-col h-full px-6">
              {/* Logo */}
              <motion.div className="pt-14 pb-2" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)" }}>
                    <span style={{ fontSize: 16 }}>🔥</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 18, color: "#F1F5F9", letterSpacing: "-0.3px" }}>flames-up</span>
                </div>
              </motion.div>

              <div className="flex-1 flex flex-col justify-center">
                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}>
                  <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2.2rem", fontWeight: 800, color: "#F1F5F9", lineHeight: 1.1, letterSpacing: "-0.04em", marginBottom: 16 }}>
                    See what's happening around you —{" "}
                    <span style={{ background: "linear-gradient(135deg, #818CF8, #34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      in real time
                    </span>
                  </h1>
                  <p style={{ color: "#94A3B8", fontSize: "1rem", lineHeight: 1.6, marginBottom: 40 }}>
                    Discover people, places, and moments near you.
                  </p>
                </motion.div>

                <motion.div className="flex flex-col gap-3" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
                  <button onClick={handleGetStarted}
                    className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", boxShadow: "0 8px 32px rgba(79,70,229,0.45)" }}>
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={handleSignIn}
                    className="w-full py-4 rounded-2xl font-semibold text-sm"
                    style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#CBD5E1" }}>
                    Sign In
                  </button>
                </motion.div>
              </div>

              <p className="pb-8 text-center text-xs" style={{ color: "#475569" }}>
                By continuing you agree to our Terms & Privacy Policy
              </p>
            </div>
          </motion.div>
        )}

        {/* ── SLIDES ─────────────────────────────────────────────────────── */}
        {step === "slides" && (
          <motion.div key="slides" className="absolute inset-0 flex flex-col"
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}>

            {/* Skip */}
            <div className="absolute top-12 right-5 z-20">
              <button onClick={() => goNext("account")}
                className="px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#94A3B8" }}>
                Skip
              </button>
            </div>

            <AnimatePresence mode="wait">
              {SLIDES.map((slide, i) => i === slideIdx && (
                <motion.div key={i} className="flex flex-col h-full px-6 pt-20 pb-10"
                  initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35 }}>

                  {/* Illustration */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <motion.div className="relative mb-10"
                      initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}>
                      {/* Big circle bg */}
                      <div className="w-52 h-52 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: slide.bgColor + "20", border: `2px solid ${slide.color}22` }}>
                        <div className="w-36 h-36 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: slide.bgColor + "40" }}>
                          <span style={{ fontSize: 72 }}>{slide.emoji}</span>
                        </div>
                      </div>
                      {/* Orbiting pins */}
                      {[0, 120, 240].map((deg, k) => (
                        <motion.div key={k} className="absolute w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                          style={{
                            backgroundColor: slide.color,
                            border: "3px solid rgba(255,255,255,0.9)",
                            top: `${50 + 47 * Math.sin((deg * Math.PI) / 180)}%`,
                            left: `${50 + 47 * Math.cos((deg * Math.PI) / 180)}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, delay: k * 0.4, repeat: Infinity }}>
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      ))}
                    </motion.div>

                    <motion.h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.9rem", fontWeight: 800, color: "#F1F5F9", textAlign: "center", lineHeight: 1.15, marginBottom: 20 }}
                      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                      {slide.title}
                    </motion.h2>

                    <motion.div className="flex flex-col gap-3 w-full max-w-xs"
                      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                      {slide.bullets.map((b, j) => (
                        <div key={j} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                          style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: slide.color }}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span style={{ color: "#CBD5E1", fontSize: "0.9rem" }}>{b}</span>
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Dots + Next */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {SLIDES.map((_, j) => (
                        <button key={j} onClick={() => setSlideIdx(j)}
                          className="rounded-full transition-all"
                          style={{
                            width: slideIdx === j ? 24 : 8,
                            height: 8,
                            backgroundColor: slideIdx === j ? slide.color : "rgba(255,255,255,0.2)",
                          }} />
                      ))}
                    </div>
                    <button
                      onClick={() => slideIdx < SLIDES.length - 1 ? setSlideIdx(i => i + 1) : goNext("account")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm"
                      style={{ backgroundColor: slide.color, color: "#fff" }}>
                      {slideIdx < SLIDES.length - 1 ? "Next" : "Let's Go"} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── ACCOUNT ────────────────────────────────────────────────────── */}
        {step === "account" && (
          <motion.div key="account" className="absolute inset-0 flex flex-col px-6 pt-14 pb-8"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 800, color: "#F1F5F9", marginBottom: 6 }}>
                Create your account
              </h2>
              <p style={{ color: "#64748B", marginBottom: 32, fontSize: "0.95rem" }}>Quick — takes under a minute</p>
            </motion.div>

            <motion.div className="flex flex-col gap-3 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              {/* Social buttons */}
              <button onClick={handleSignIn}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#F1F5F9" }}>
                <span style={{ fontSize: 20 }}>🍎</span> Continue with Apple
              </button>
              <button onClick={handleSignIn}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#F1F5F9" }}>
                <span style={{ fontSize: 20 }}>🌐</span> Continue with Google
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
                <span style={{ color: "#475569", fontSize: "0.8rem" }}>or</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Email form */}
              {["email", "password", "username"].map(field => (
                <input key={field}
                  type={field === "password" ? "password" : "text"}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9" }} />
              ))}
            </motion.div>

            <button onClick={() => goNext("profile")}
              className="w-full py-4 rounded-2xl font-bold text-base mt-auto"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", boxShadow: "0 8px 32px rgba(79,70,229,0.4)" }}>
              Continue
            </button>

            <p className="text-center mt-4 text-sm" style={{ color: "#475569" }}>
              Already have an account?{" "}
              <button onClick={handleSignIn} style={{ color: "#818CF8", fontWeight: 600 }}>Sign In</button>
            </p>
          </motion.div>
        )}

        {/* ── PROFILE ────────────────────────────────────────────────────── */}
        {step === "profile" && (
          <motion.div key="profile" className="absolute inset-0 flex flex-col px-6 pt-14 pb-8"
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}>

            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 800, color: "#F1F5F9", marginBottom: 6 }}>
              Set up your profile
            </h2>
            <p style={{ color: "#64748B", marginBottom: 32, fontSize: "0.95rem" }}>Tell the world a little about you</p>

            {/* Avatar picker */}
            <div className="flex flex-col items-center mb-8">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-24 h-24 rounded-full flex items-center justify-center mb-3 relative"
                style={{ backgroundColor: "rgba(79,70,229,0.15)", border: "2px dashed rgba(79,70,229,0.4)" }}>
                <span style={{ fontSize: 40 }}>😊</span>
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#4F46E5", border: "2px solid #0B1120" }}>
                  <span style={{ fontSize: 12 }}>+</span>
                </div>
              </motion.button>
              <span style={{ color: "#64748B", fontSize: "0.8rem" }}>Tap to add photo</span>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              <input
                type="text" placeholder="Username"
                value={profile.username}
                onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9" }} />
              <div className="relative">
                <input
                  type="text" placeholder='Short status (e.g. "Exploring NYC") — optional'
                  value={profile.status}
                  maxLength={60}
                  onChange={e => setProfile(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9" }} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#475569" }}>{profile.status.length}/60</span>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <button onClick={() => goNext("location")}
                className="w-full py-4 rounded-2xl font-bold text-base"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", boxShadow: "0 8px 32px rgba(79,70,229,0.4)" }}>
                Continue
              </button>
              <button onClick={() => goNext("location")} style={{ color: "#475569", fontSize: "0.85rem" }} className="text-center">
                Skip for now
              </button>
            </div>
          </motion.div>
        )}

        {/* ── LOCATION ───────────────────────────────────────────────────── */}
        {step === "location" && (
          <motion.div key="location" className="absolute inset-0 flex flex-col items-center px-6 pt-16 pb-10"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }}>

            {/* Animated map illustration */}
            <div className="relative w-56 h-56 mb-8">
              <div className="absolute inset-0 rounded-3xl overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.15), rgba(16,185,129,0.15))", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="absolute inset-0" style={{
                  backgroundImage: "linear-gradient(rgba(79,70,229,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.1) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }} />
              </div>
              {/* Center pin */}
              <motion.div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -60%)" }}
                animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", border: "3px solid #fff" }}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <motion.div className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: "rgba(79,70,229,0.4)" }}
                  animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }} />
              </motion.div>
              {/* Surrounding pins */}
              {[{x:"25%",y:"30%",c:"#10B981"},{x:"72%",y:"25%",c:"#F59E0B"},{x:"68%",y:"70%",c:"#EF4444"}].map((p, i) => (
                <motion.div key={i} className="absolute w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ left: p.x, top: p.y, backgroundColor: p.c, border: "2px solid rgba(255,255,255,0.8)" }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.2, type: "spring" }}>
                  <div className="w-2 h-2 rounded-full bg-white" />
                </motion.div>
              ))}
            </div>

            <motion.div className="text-center mb-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.9rem", fontWeight: 800, color: "#F1F5F9", marginBottom: 10, lineHeight: 1.15 }}>
                See what's happening near you
              </h2>
            </motion.div>

            <motion.div className="flex flex-col gap-3 w-full mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {[
                { icon: "👥", text: "Show nearby people" },
                { icon: "📍", text: "Discover places around you" },
                { icon: "⚡", text: "Real-time updates" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ color: "#CBD5E1", fontSize: "0.9rem" }}>{item.text}</span>
                </div>
              ))}
            </motion.div>

            <p className="text-center text-sm mb-6" style={{ color: "#4F46E5", fontWeight: 600 }}>
              🔒 You control who can see your location.
            </p>

            <div className="w-full flex flex-col gap-3 mt-auto">
              <button onClick={handleLocationRequest}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", boxShadow: "0 8px 32px rgba(79,70,229,0.4)" }}>
                <MapPin className="w-5 h-5" /> Allow Location
              </button>
              <button onClick={() => goNext("privacy")}
                className="w-full py-3 rounded-2xl font-semibold text-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#64748B" }}>
                Not Now
              </button>
            </div>
          </motion.div>
        )}

        {/* ── PRIVACY ────────────────────────────────────────────────────── */}
        {step === "privacy" && (
          <motion.div key="privacy" className="absolute inset-0 flex flex-col px-6 pt-14 pb-8"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(139,92,246,0.2)" }}>
                <Shield className="w-5 h-5" style={{ color: "#8B5CF6" }} />
              </div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.7rem", fontWeight: 800, color: "#F1F5F9", lineHeight: 1.2 }}>
                Who can see you?
              </h2>
            </div>
            <p style={{ color: "#64748B", marginBottom: 28, fontSize: "0.9rem" }}>You can change this anytime in settings</p>

            <div className="flex flex-col gap-3 flex-1">
              {PRIVACY_OPTIONS.map(opt => (
                <motion.button key={opt.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPrivacy(opt.id)}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all"
                  style={{
                    backgroundColor: privacy === opt.id ? "rgba(79,70,229,0.15)" : "rgba(255,255,255,0.05)",
                    border: privacy === opt.id ? "2px solid rgba(79,70,229,0.5)" : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  <span style={{ fontSize: 28 }}>{opt.icon}</span>
                  <div className="flex-1">
                    <div style={{ color: "#F1F5F9", fontWeight: 600, fontSize: "0.95rem" }}>{opt.label}</div>
                    <div style={{ color: "#64748B", fontSize: "0.8rem", marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  {privacy === opt.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#4F46E5" }}>
                      <Check className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            <button onClick={() => goNext("interests")}
              className="w-full py-4 rounded-2xl font-bold text-base mt-6"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", boxShadow: "0 8px 32px rgba(79,70,229,0.4)" }}>
              Continue
            </button>
          </motion.div>
        )}

        {/* ── INTERESTS ──────────────────────────────────────────────────── */}
        {step === "interests" && (
          <motion.div key="interests" className="absolute inset-0 flex flex-col px-6 pt-14 pb-8"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.9rem", fontWeight: 800, color: "#F1F5F9", marginBottom: 6 }}>
              What are you into?
            </h2>
            <p style={{ color: "#64748B", marginBottom: 28, fontSize: "0.9rem" }}>Helps your map feel relevant right away</p>

            <div className="grid grid-cols-2 gap-3 flex-1 content-start">
              {INTERESTS.map(item => {
                const active = interests.includes(item.id);
                return (
                  <motion.button key={item.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleInterest(item.id)}
                    className="flex items-center gap-3 px-4 py-4 rounded-2xl"
                    style={{
                      backgroundColor: active ? "rgba(79,70,229,0.18)" : "rgba(255,255,255,0.05)",
                      border: active ? "2px solid rgba(79,70,229,0.5)" : "1px solid rgba(255,255,255,0.07)",
                    }}>
                    <span style={{ fontSize: 24 }}>{item.emoji}</span>
                    <span style={{ color: active ? "#818CF8" : "#CBD5E1", fontWeight: active ? 700 : 500, fontSize: "0.9rem" }}>{item.label}</span>
                    {active && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: "#818CF8" }} />}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button onClick={handleFinish} disabled={submitting}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", boxShadow: "0 8px 32px rgba(79,70,229,0.4)", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Setting up…" : <>Explore the Map 🗺️</>}
              </button>
              <button onClick={handleFinish} style={{ color: "#475569", fontSize: "0.85rem" }} className="text-center">
                Skip
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}