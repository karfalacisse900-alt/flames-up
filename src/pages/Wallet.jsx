import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, TrendingUp, TrendingDown, Gift, Gamepad2, Palette, Radio, Star, Zap, Users } from "lucide-react";
import { addCoins } from "../components/coins/coinsHelper";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { getWallet, claimDailyCheckin } from "../components/coins/coinsHelper";
import { motion, AnimatePresence } from "framer-motion";

const typeConfig = {
  daily_checkin: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50", label: "Daily Check-in" },
  boost_post: { icon: Zap, color: "text-amber-500", bg: "bg-amber-50", label: "Post Boosted" },
  referral_bonus: { icon: Users, color: "text-violet-500", bg: "bg-violet-50", label: "Referral Bonus" },
  post_liked: { icon: Star, color: "text-amber-500", bg: "bg-amber-50", label: "Post Liked" },
  game_win: { icon: Gamepad2, color: "text-violet-500", bg: "bg-violet-50", label: "Game Won" },
  live_host: { icon: Radio, color: "text-blue-500", bg: "bg-blue-50", label: "Hosted Live" },
  art_sale: { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", label: "Art Sold" },
  art_purchase: { icon: Palette, color: "text-rose-500", bg: "bg-rose-50", label: "Art Bought" },
  gift_sent: { icon: Gift, color: "text-pink-500", bg: "bg-pink-50", label: "Gift Sent" },
  gift_received: { icon: Gift, color: "text-pink-500", bg: "bg-pink-50", label: "Gift Received" },
  signup_bonus: { icon: Star, color: "text-amber-500", bg: "bg-amber-50", label: "Welcome Bonus" },
};

const earnWays = [
  { emoji: "✅", title: "Daily Check-in", desc: "+10 coins every day", amount: "+10" },
  { emoji: "❤️", title: "Post gets liked", desc: "+2 coins per like", amount: "+2" },
  { emoji: "🏆", title: "Win a game", desc: "+15 coins per win", amount: "+15" },
  { emoji: "🎙️", title: "Host a live session", desc: "+20 coins per session", amount: "+20" },
  { emoji: "🎨", title: "Sell art", desc: "Earn the listed price", amount: "varies" },
  { emoji: "🤝", title: "Refer a friend", desc: "+50 coins each when they join", amount: "+50" },
  { emoji: "⚡", title: "Boost a post", desc: "Costs coins, gets more views", amount: "-20~120" },
];

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMsg, setClaimMsg] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      // Handle referral reward for newly joined users
      const refCode = sessionStorage.getItem("ref_code");
      if (refCode && u?.email) {
        sessionStorage.removeItem("ref_code");
        // Find the referrer by checking all referrals with this code
        const existing = await base44.entities.Referral.filter({ referred_email: u.email });
        if (existing.length === 0) {
          // Create referral record
          const ref = await base44.entities.Referral.create({
            referrer_email: refCode, // we'll resolve below
            referred_email: u.email,
            referral_code: refCode,
            reward_claimed: true,
          });
          // Give both users 50 coins
          await addCoins(u.email, 50, "referral_bonus", "Referral bonus - you joined via a friend's link! 🎁");
        }
      }
    }).catch(() => {});
  }, []);

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ["wallet", user?.email],
    queryFn: () => getWallet(user.email),
    enabled: !!user?.email,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", user?.email],
    queryFn: () => base44.entities.CoinTransaction.filter({ user_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const handleCheckin = async () => {
    if (!user?.email) return;
    setClaimLoading(true);
    const result = await claimDailyCheckin(user.email);
    setClaimMsg(result.success ? "✅ +10 coins claimed!" : "Already claimed today");
    setTimeout(() => setClaimMsg(""), 3000);
    setClaimLoading(false);
    refetchWallet();
    queryClient.invalidateQueries({ queryKey: ["transactions", user.email] });
  };

  const balance = wallet?.balance ?? 0;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-warm)" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 bg-white border-b border-[#EDE9E3]">
        <Link to={createPageUrl("Profile")} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="font-semibold" style={{ fontFamily: "var(--font-serif)" }}>My Wallet</h2>
      </div>

      {/* Balance card */}
      <div className="mx-5 mt-5">
        <div className="rounded-3xl p-6 text-center" style={{ background: "linear-gradient(135deg, #7C8C6E 0%, #A8B89E 100%)" }}>
          <p className="text-white/70 text-sm font-medium">Coin Balance</p>
          <p className="text-5xl font-bold text-white mt-1">⬡ {balance}</p>
          <p className="text-white/60 text-xs mt-2">Use coins to buy art or send gifts in live</p>

          <button
            onClick={handleCheckin}
            disabled={claimLoading}
            className="mt-4 px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-sm font-medium transition-all border border-white/30"
          >
            {claimLoading ? "Claiming..." : "Daily Check-in (+10 ⬡)"}
          </button>
          <AnimatePresence>
            {claimMsg && (
              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-white text-xs mt-2">
                {claimMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Ways to earn */}
      <div className="mx-5 mt-5">
        <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3">Ways to Earn</h3>
        <div className="bg-white rounded-2xl border border-[#EDE9E3] divide-y divide-[#EDE9E3]">
          {earnWays.map((way, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl">{way.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#2C2C2C]">{way.title}</p>
                <p className="text-xs text-[#9B9B9B]">{way.desc}</p>
              </div>
              <span className="text-sm font-bold text-[#7C8C6E]">{way.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="mx-5 mt-5">
        <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3">Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EDE9E3] p-8 text-center">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-sm text-[#9B9B9B]">No transactions yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EDE9E3] divide-y divide-[#EDE9E3]">
            {transactions.map((txn) => {
              const cfg = typeConfig[txn.type] || { icon: Star, color: "text-gray-400", bg: "bg-gray-50", label: txn.type };
              const Icon = cfg.icon;
              const isPositive = txn.amount > 0;
              return (
                <div key={txn.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2C2C]">{txn.description || cfg.label}</p>
                    <p className="text-xs text-[#9B9B9B]">{new Date(txn.created_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-bold ${isPositive ? "text-emerald-600" : "text-rose-500"}`}>
                    {isPositive ? "+" : ""}{txn.amount} ⬡
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}