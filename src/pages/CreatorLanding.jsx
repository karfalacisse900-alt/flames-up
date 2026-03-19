import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, MapPin, Star, Users, ArrowRight, CheckCircle, Clock, XCircle } from "lucide-react";
import CreatorApplyForm from "@/components/creators/CreatorApplyForm.jsx";
import { Link } from "react-router-dom";

const HOW_IT_WORKS = [
  { emoji: "📋", title: "Apply", desc: "Fill out your creator profile with your category, description, pricing, and social links." },
  { emoji: "✅", title: "Get Approved", desc: "Our admin team reviews your application and approves qualified creators within 24–48 hrs." },
  { emoji: "📍", title: "Go Live on the Map", desc: "Once approved, open your Creator Dashboard and toggle OPEN to appear on the map for nearby users to discover you." },
  { emoji: "💸", title: "Get Hired", desc: "Users can find you, view your profile, and reach out directly to book your services." },
];

export default function CreatorLanding() {
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u?.email) {
        const existing = await base44.entities.Creator.filter({ user_email: u.email });
        if (existing[0]) setCreator(existing[0]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  // Already applied — show status
  if (creator) {
    const statusMap = {
      pending: { icon: <Clock className="w-6 h-6 text-amber-500" />, title: "Application Under Review", desc: "Our team is reviewing your application. You'll gain access to the Creator Dashboard once approved.", color: "#FEF3C7", border: "#F59E0B" },
      approved: { icon: <CheckCircle className="w-6 h-6 text-green-500" />, title: "You're an Approved Creator!", desc: "Head to your Creator Dashboard to manage your profile and go live on the map.", color: "#DCFCE7", border: "#16A34A" },
      rejected: { icon: <XCircle className="w-6 h-6 text-red-500" />, title: "Application Declined", desc: "Unfortunately your application wasn't approved. You may reapply with updated information.", color: "#FEE2E2", border: "#DC2626" },
    };
    const s = statusMap[creator.approval_status] || statusMap.pending;

    return (
      <div className="min-h-screen px-4 pt-8 pb-16 max-w-lg mx-auto" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="rounded-3xl p-6 mb-6" style={{ backgroundColor: s.color, border: `1.5px solid ${s.border}` }}>
          <div className="flex items-center gap-3 mb-2">
            {s.icon}
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{s.title}</h2>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
        </div>
        {creator.approval_status === "approved" && (
          <Link to="/CreatorDashboard"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-white text-base"
            style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)", boxShadow: "0 8px 24px rgba(224,92,42,0.3)" }}>
            Go to Creator Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
        )}
        {creator.approval_status === "rejected" && (
          <button onClick={() => setShowApply(true)}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-white text-base"
            style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)", boxShadow: "0 8px 24px rgba(224,92,42,0.3)" }}>
            Reapply <ArrowRight className="w-5 h-5" />
          </button>
        )}
        {showApply && (
          <CreatorApplyForm user={user} onClose={() => setShowApply(false)} onCreated={(c) => { setCreator(c); setShowApply(false); }} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-12 pb-10 text-center"
        style={{ background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)" }}>
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)", boxShadow: "0 8px 24px rgba(224,92,42,0.35)" }}>
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)", color: "#1C1917" }}>
          Become a Street Creator
        </h1>
        <p className="text-base max-w-sm mx-auto" style={{ color: "#78716C" }}>
          Join our community of artists, musicians, and performers. Get discovered by people nearby and grow your audience.
        </p>
        <div className="flex justify-center gap-6 mt-6">
          {[{ icon: <MapPin className="w-4 h-4" />, label: "Live on Map" }, { icon: <Users className="w-4 h-4" />, label: "Get Discovered" }, { icon: <Star className="w-4 h-4" />, label: "Grow Your Brand" }].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(224,92,42,0.12)", color: "#E05C2A" }}>{icon}</div>
              <span className="text-xs font-semibold" style={{ color: "#78716C" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="px-4 py-8 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-5 text-center" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>How It Works</h2>
        <div className="space-y-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <span className="text-2xl">{step.emoji}</span>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{i + 1}. {step.title}</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={() => setShowApply(true)}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-white text-base mt-8"
          style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)", boxShadow: "0 8px 24px rgba(224,92,42,0.35)" }}>
          Apply to Be a Creator <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-center text-xs mt-3" style={{ color: "var(--text-hint)" }}>Free to apply · Reviewed within 24–48 hours</p>
      </div>

      {showApply && (
        <CreatorApplyForm user={user} onClose={() => setShowApply(false)} onCreated={(c) => { setCreator(c); setShowApply(false); }} />
      )}
    </div>
  );
}