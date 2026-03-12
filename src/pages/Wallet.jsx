import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, TrendingUp, TrendingDown, Gift, Gamepad2, Palette, Radio, Star, Zap, Users, Coins, CreditCard, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { getWallet, claimDailyCheckin } from "../components/coins/coinsHelper";
import { motion, AnimatePresence } from "framer-motion";
import UniqueStatusBadge from "../components/coins/UniqueStatusBadge";

const typeConfig = {
  daily_checkin: { icon: CheckCircle, color: "text-emerald-500", label: "Daily Check-in" },
  boost_post: { icon: Zap, color: "text-amber-500", label: "Post Boosted" },
  referral_bonus: { icon: Users, color: "text-violet-500", label: "Referral Bonus" },
  post_liked: { icon: Star, color: "text-amber-500", label: "Post Liked" },
  game_win: { icon: Gamepad2, color: "text-violet-500", label: "Game Won" },
  live_host: { icon: Radio, color: "text-blue-500", label: "Hosted Live" },
  art_sale: { icon: TrendingUp, color: "text-emerald-500", label: "Art Sold" },
  art_purchase: { icon: Palette, color: "text-rose-500", label: "Art Bought" },
  gift_sent: { icon: Gift, color: "text-pink-500", label: "Gift Sent" },
  gift_received: { icon: Gift, color: "text-pink-500", label: "Gift Received" },
  signup_bonus: { icon: Star, color: "text-amber-500", label: "Welcome Bonus" },
};

const COIN_PACKAGES = [
  { id: "starter", coins: 100, price: "$0.99", bonus: null, label: "Starter", emoji: "⬡", popular: false },
  { id: "basic", coins: 500, price: "$3.99", bonus: "+50 bonus", label: "Basic", emoji: "⬡⬡", popular: false },
  { id: "popular", coins: 1200, price: "$7.99", bonus: "+200 bonus", label: "Popular", emoji: "⬡⬡⬡", popular: true },
  { id: "pro", coins: 3000, price: "$14.99", bonus: "+600 bonus", label: "Pro", emoji: "💎", popular: false },
];

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMsg, setClaimMsg] = useState("");
  const [buyLoading, setBuyLoading] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ["wallet", user?.email],
    queryFn: () => getWallet(user.email),
    enabled: !!user?.email,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", user?.email],
    queryFn: () => base44.entities.CoinTransaction.filter({ user_email: user.email }, "-created_date", 30),
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

  const handleBuy = async (pkg) => {
    if (window.self !== window.top) {
      alert("Purchases only work from the published app.");
      return;
    }
    setBuyLoading(pkg.id);
    try {
      const res = await base44.functions.invoke("createCoinCheckout", { package_id: pkg.id, user_email: user?.email });
      if (res.data?.url) window.location.href = res.data.url;
    } catch (e) {
      alert("Unable to start checkout. Please try again.");
    }
    setBuyLoading(null);
  };

  const balance = wallet?.balance ?? 0;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <Link to={createPageUrl("Profile")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </Link>
        <h2 className="font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Coins</h2>
      </div>

      {/* Balance hero */}
       <div className="mx-5 mt-5 space-y-4">
         <div className="rounded-3xl p-8 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-hover) 100%)" }}>
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 0%, transparent 50%)" }} />
           <div className="absolute top-4 right-4 w-24 h-24 rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3), transparent)" }} />

           <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-2">Your Balance</p>
           <div className="flex items-baseline justify-center gap-2 mb-1">
             <p className="text-7xl font-black text-white">{balance}</p>
             <p className="text-2xl text-white/80 font-bold mb-1">⬡</p>
           </div>
           <p className="text-white/60 text-xs tracking-wider">coins available</p>

           <div className="mt-6 flex gap-3 justify-center flex-wrap">
             <button
               onClick={handleCheckin}
               disabled={claimLoading}
               className="px-6 py-3 rounded-2xl text-sm font-bold transition-all border-2 border-white/40 hover:border-white/60"
               style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }}
             >
               {claimLoading ? "Claiming..." : "✅ Daily Bonus"}
             </button>
             <Link
               to={createPageUrl("Referral")}
               className="px-6 py-3 rounded-2xl text-sm font-bold transition-all border-2 border-white/40 hover:border-white/60"
               style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }}
             >
               🎁 Refer & Earn
             </Link>
           </div>

          <AnimatePresence>
            {claimMsg && (
              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-white text-xs mt-3">
                {claimMsg}
              </motion.p>
            )}
          </AnimatePresence>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
          <UniqueStatusBadge balance={balance} />
          </div>
          </div>

      {/* Buy coins */}
      <div className="mx-5 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Get More Coins</h3>
        </div>
        <div className="space-y-3">
          {COIN_PACKAGES.map(pkg => (
            <motion.button
              key={pkg.id}
              onClick={() => handleBuy(pkg)}
              disabled={buyLoading === pkg.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative rounded-2xl p-5 text-left transition-all flex items-center justify-between"
              style={{
                backgroundColor: pkg.popular ? "var(--accent-primary)" : "var(--bg-card)",
                border: pkg.popular ? "2px solid var(--accent-primary-hover)" : "1px solid var(--border-light)",
                boxShadow: pkg.popular ? "var(--elevation-3)" : "var(--elevation-1)",
              }}
            >
              {pkg.popular && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: "#D98B62", color: "#fff" }}>
                  ⭐ POPULAR
                </motion.span>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-3xl">{pkg.emoji}</p>
                  <div>
                    <p className="text-lg font-black" style={{ color: pkg.popular ? "#fff" : "var(--text-primary)" }}>
                      {pkg.coins.toLocaleString()} ⬡
                    </p>
                    <p className="text-xs" style={{ color: pkg.popular ? "rgba(255,255,255,0.6)" : "var(--text-hint)" }}>
                      {pkg.label}
                    </p>
                  </div>
                </div>
                {pkg.bonus && (
                  <p className="text-[10px] font-bold px-2 py-0.5 rounded inline-block" style={{ color: pkg.popular ? "rgba(255,255,255,0.9)" : "var(--accent-secondary)", backgroundColor: pkg.popular ? "rgba(255,255,255,0.15)" : "var(--accent-primary-light)" }}>
                    ✨ {pkg.bonus}
                  </p>
                )}
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <span className="text-base font-black" style={{ color: pkg.popular ? "#fff" : "var(--accent-primary)" }}>
                  {pkg.price}
                </span>
                {buyLoading === pkg.id ? (
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: pkg.popular ? "#fff" : "var(--accent-primary)", borderTopColor: "transparent" }} />
                ) : (
                  <Sparkles className="w-5 h-5" style={{ color: pkg.popular ? "rgba(255,255,255,0.8)" : "var(--accent-primary)" }} />
                )}
              </div>
            </motion.button>
          ))}
        </div>
        <p className="text-[10px] text-center mt-4" style={{ color: "var(--text-hint)" }}>
          🎁 Coins earned through activities never expire • Use for gifts, art, boosts & more
        </p>
      </div>

      {/* Recent transactions */}
      <div className="mx-5 mt-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Recent Activity</h3>
        {transactions.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-3xl mb-2">💰</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No transactions yet</p>
          </div>
        ) : (
          <div className="rounded-2xl divide-y" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            {transactions.slice(0, 15).map((txn) => {
              const cfg = typeConfig[txn.type] || { icon: Star, color: "text-gray-400", label: txn.type };
              const Icon = cfg.icon;
              const isPositive = txn.amount > 0;
              return (
                <div key={txn.id} className="flex items-center gap-3 px-4 py-3" style={{ borderColor: "var(--border-light)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-subtle)" }}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{txn.description || cfg.label}</p>
                    <p className="text-xs" style={{ color: "var(--text-hint)" }}>{new Date(txn.created_date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: isPositive ? "var(--accent-primary)" : "#E05C7A" }}>
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