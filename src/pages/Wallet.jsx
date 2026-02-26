import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Gift, Gamepad2, Palette, Radio, Star, Zap, Users, ShoppingCart, Coins } from "lucide-react";
import { addCoins } from "../components/coins/coinsHelper";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { getWallet, claimDailyCheckin } from "../components/coins/coinsHelper";
import { motion, AnimatePresence } from "framer-motion";

const typeConfig = {
  daily_checkin: { icon: CheckCircle, color: "text-emerald-500", label: "Daily Check-in" },
  boost_post: { icon: Zap, color: "text-amber-500", label: "Post Boosted" },
  referral_bonus: { icon: Users, color: "text-violet-500", label: "Referral Bonus" },
  post_liked: { icon: Star, color: "text-amber-500", label: "Post Liked" },
  game_win: { icon: Gamepad2, color: "text-violet-500", label: "Game Won" },
  live_host: { icon: Radio, color: "text-blue-500", label: "Hosted Live" },
  art_sale: { icon: Palette, color: "text-emerald-500", label: "Art Sold" },
  art_purchase: { icon: Palette, color: "text-rose-500", label: "Art Bought" },
  gift_sent: { icon: Gift, color: "text-pink-500", label: "Gift Sent" },
  gift_received: { icon: Gift, color: "text-pink-500", label: "Gift Received" },
  signup_bonus: { icon: Star, color: "text-amber-500", label: "Welcome Bonus" },
};

const COIN_PACKAGES = [
  { coins: 100, price: "$0.99", bonus: "", popular: false },
  { coins: 500, price: "$3.99", bonus: "+50 bonus", popular: false },
  { coins: 1200, price: "$7.99", bonus: "+200 bonus", popular: true },
  { coins: 3000, price: "$17.99", bonus: "+600 bonus", popular: false },
];

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMsg, setClaimMsg] = useState("");
  const [buyMsg, setBuyMsg] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const refCode = sessionStorage.getItem("ref_code");
      if (refCode && u?.email) {
        sessionStorage.removeItem("ref_code");
        const existing = await base44.entities.Referral.filter({ referred_email: u.email });
        if (existing.length === 0) {
          await base44.entities.Referral.create({
            referrer_email: refCode,
            referred_email: u.email,
            referral_code: refCode,
            reward_claimed: true,
          });
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

  const handleBuyCoins = (pkg) => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      alert("Coin purchases are only available from the published app.");
      return;
    }
    setBuyMsg(`Coming soon! You selected ${pkg.coins} coins for ${pkg.price}`);
    setTimeout(() => setBuyMsg(""), 3000);
  };

  const balance = wallet?.balance ?? 0;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <Link to={createPageUrl("Profile")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </Link>
        <h2 className="font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>My Wallet</h2>
      </div>

      {/* Balance card */}
      <div className="mx-5 mt-5">
        <div className="rounded-3xl p-6" style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-hover) 100%)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Balance</p>
              <p className="text-4xl font-bold text-white mt-1">⬡ {balance}</p>
              <p className="text-white/60 text-xs mt-1">Coins</p>
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <span className="text-3xl">⬡</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCheckin}
              disabled={claimLoading}
              className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition-all border border-white/25"
            >
              {claimLoading ? "Claiming…" : "✅ Daily Check-in +10"}
            </button>
            <Link
              to={createPageUrl("Referral")}
              className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition-all border border-white/25 text-center"
            >
              🎁 Refer Friends
            </Link>
          </div>

          <AnimatePresence>
            {claimMsg && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-white text-xs mt-2 text-center">
                {claimMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Buy Coins */}
      <div className="mx-5 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Buy Coins</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {COIN_PACKAGES.map((pkg, i) => (
            <button
              key={i}
              onClick={() => handleBuyCoins(pkg)}
              className="relative rounded-2xl p-4 text-left transition-all active:scale-95"
              style={{
                backgroundColor: pkg.popular ? "var(--accent-primary)" : "var(--bg-card)",
                border: `1px solid ${pkg.popular ? "var(--accent-primary)" : "var(--border-light)"}`,
              }}
            >
              {pkg.popular && (
                <span className="absolute -top-2 left-3 text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: "var(--accent-secondary)" }}>
                  BEST VALUE
                </span>
              )}
              <p className="text-xl font-bold" style={{ color: pkg.popular ? "#fff" : "var(--text-primary)" }}>⬡ {pkg.coins.toLocaleString()}</p>
              {pkg.bonus && <p className="text-[11px] font-medium mt-0.5" style={{ color: pkg.popular ? "rgba(255,255,255,0.8)" : "var(--accent-secondary)" }}>{pkg.bonus}</p>}
              <p className="text-sm font-semibold mt-2" style={{ color: pkg.popular ? "#fff" : "var(--accent-primary)" }}>{pkg.price}</p>
            </button>
          ))}
        </div>
        {buyMsg && (
          <p className="text-xs text-center mt-3 px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)" }}>{buyMsg}</p>
        )}
      </div>

      {/* Transaction history */}
      <div className="mx-5 mt-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-3xl mb-2">💰</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No transactions yet</p>
          </div>
        ) : (
          <div className="rounded-2xl divide-y" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            {transactions.map((txn) => {
              const cfg = typeConfig[txn.type] || { icon: Star, color: "text-gray-400", label: txn.type };
              const Icon = cfg.icon;
              const isPositive = txn.amount > 0;
              return (
                <div key={txn.id} className="flex items-center gap-3 px-4 py-3" style={{ borderColor: "var(--border-light)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-subtle)" }}>
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