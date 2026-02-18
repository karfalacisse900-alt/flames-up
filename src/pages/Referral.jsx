import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, CheckCheck, Users, Gift, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { addCoins } from "../components/coins/coinsHelper";
import { motion, AnimatePresence } from "framer-motion";

function generateCode(email) {
  return btoa(email).replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
}

export default function Referral() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});

    // Check if this user was referred
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    if (refCode) {
      sessionStorage.setItem("ref_code", refCode);
    }
  }, []);

  const referralCode = user ? generateCode(user.email) : "";
  const referralLink = user
    ? `${window.location.origin}?ref=${referralCode}`
    : "";

  const { data: myReferrals = [] } = useQuery({
    queryKey: ["referrals", user?.email],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user.email }),
    enabled: !!user?.email,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join me on this app!",
        text: "Check out this awesome community app. Use my referral link and we both get 50 coins!",
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  const rewardedCount = myReferrals.filter((r) => r.reward_claimed).length;
  const pendingCount = myReferrals.filter((r) => !r.reward_claimed).length;
  const totalEarned = rewardedCount * 50;

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: "var(--bg-warm)" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 bg-white border-b border-[#EDE9E3]">
        <Link to={createPageUrl("Profile")} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="font-semibold" style={{ fontFamily: "var(--font-serif)" }}>Refer & Earn</h2>
      </div>

      {/* Hero */}
      <div className="mx-5 mt-5">
        <div className="rounded-3xl p-6 text-center" style={{ background: "linear-gradient(135deg, #D98B62 0%, #E8A882 100%)" }}>
          <div className="text-5xl mb-3">🎁</div>
          <h3 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>Invite Friends, Earn Coins</h3>
          <p className="text-white/80 text-sm mt-1">You and your friend each get <span className="font-bold text-white">50 ⬡ coins</span> when they join!</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-5 mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Total Invited", value: myReferrals.length, emoji: "👥" },
          { label: "Rewarded", value: rewardedCount, emoji: "✅" },
          { label: "Coins Earned", value: `${totalEarned} ⬡`, emoji: "💰" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-4 text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-lg">{stat.emoji}</p>
            <p className="text-lg font-bold mt-1" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="mx-5 mt-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Your Referral Link</h3>
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--text-hint)" }}>Your unique code: <span className="font-mono font-bold" style={{ color: "var(--accent-primary)" }}>{referralCode}</span></p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl px-3 py-2.5 text-xs font-mono truncate" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
              {referralLink}
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-2.5 rounded-xl text-white text-xs font-medium transition-all flex items-center gap-1.5"
              style={{ backgroundColor: copied ? "#16A34A" : "var(--accent-primary)" }}
            >
              {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={handleShare}
            className="w-full mt-3 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{ borderColor: "var(--accent-secondary)", color: "var(--accent-secondary)" }}
          >
            <Share2 className="w-4 h-4" /> Share with Friends
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-5 mt-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>How It Works</h3>
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {[
            { step: "1", text: "Share your unique referral link with friends" },
            { step: "2", text: "Friend signs up using your link" },
            { step: "3", text: "Both of you receive 50 ⬡ coins instantly!" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b last:border-0" style={{ borderColor: "var(--border-light)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: "var(--accent-secondary)" }}>
                {item.step}
              </div>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referred users list */}
      {myReferrals.length > 0 && (
        <div className="mx-5 mt-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>People You Invited</h3>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            {myReferrals.map((ref) => (
              <div key={ref.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: "var(--border-light)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)" }}>
                  {ref.referred_email?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{ref.referred_email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ref.reward_claimed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  {ref.reward_claimed ? "+50 ⬡ earned" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}