import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShoppingBag, Zap, Star, Crown, Palette, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { getBalance, addCoins } from "../components/coins/coinsHelper";
import { loadStripe } from "@stripe/stripe-js";

const shopItems = [
  {
    id: "badge_verified",
    name: "✓ Verified Badge",
    description: "Show a verified checkmark on your profile",
    price: 200,
    icon: "✓",
    color: "#3C6E5A",
    bg: "rgba(60,110,90,0.1)",
    category: "badge",
  },
  {
    id: "badge_star",
    name: "⭐ Star Creator",
    description: "Star badge for active creators",
    price: 150,
    icon: "⭐",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    category: "badge",
  },
  {
    id: "badge_fire",
    name: "🔥 Hot Post",
    description: "Show your posts are fire",
    price: 100,
    icon: "🔥",
    color: "#E05C7A",
    bg: "rgba(224,92,122,0.1)",
    category: "badge",
  },
  {
    id: "boost_1d",
    name: "⚡ 1-Day Boost",
    description: "Pin your post to the top of the feed for 24 hours",
    price: 50,
    icon: "⚡",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    category: "boost",
  },
  {
    id: "boost_3d",
    name: "⚡⚡ 3-Day Boost",
    description: "Keep your post boosted for 3 days",
    price: 120,
    icon: "⚡⚡",
    color: "#D97706",
    bg: "rgba(217,119,6,0.1)",
    category: "boost",
  },
  {
    id: "theme_dark",
    name: "🌙 Dark Theme",
    description: "Unlock dark mode for the app",
    price: 300,
    icon: "🌙",
    color: "#5579A6",
    bg: "rgba(85,121,166,0.1)",
    category: "theme",
  },
  {
    id: "theme_gold",
    name: "✨ Gold Theme",
    description: "Premium golden accents across the app",
    price: 500,
    icon: "✨",
    color: "#B45309",
    bg: "rgba(180,83,9,0.1)",
    category: "theme",
  },
];

const coinBundles = [
  { id: "coins_100", coins: 100, label: "Starter", price: "$0.99", emoji: "💰", priceId: "price_1T2Fuf5bPx2iiXNaPUaZa12n" },
  { id: "coins_500", coins: 500, label: "Popular", price: "$3.99", emoji: "💎", badge: "Best Value", priceId: "price_1T2Fuf5bPx2iiXNanCtYX1oQ" },
  { id: "coins_1500", coins: 1500, label: "Pro", price: "$9.99", emoji: "👑", priceId: "price_1T2Fuf5bPx2iiXNakD2rUJdx" },
];

const categoryTabs = ["all", "badge", "boost", "theme"];

export default function Shop() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [purchasing, setPurchasing] = useState(null);
  const [toast, setToast] = useState("");
  const [stripeReady, setStripeReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    
    // Check if we're in an iframe (not published)
    if (window.self === window.top) {
      setStripeReady(true);
    }
  }, []);

  const { data: balance = 0, refetch: refetchBalance } = useQuery({
    queryKey: ["coinBalance", user?.email],
    queryFn: () => getBalance(user.email),
    enabled: !!user?.email,
  });

  const { data: ownedItems = [] } = useQuery({
    queryKey: ["ownedItems", user?.email],
    queryFn: () => base44.entities.CoinTransaction.filter({ user_email: user.email, type: "art_purchase" }, "-created_date"),
    enabled: !!user?.email,
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleBuy = async (item) => {
    if (!user?.email) return;
    if (balance < item.price) {
      showToast("❌ Not enough coins!");
      return;
    }
    setPurchasing(item.id);
    await addCoins(user.email, -item.price, "art_purchase", `Purchased: ${item.name}`);
    refetchBalance();
    queryClient.invalidateQueries({ queryKey: ["coinBalance", user?.email] });
    setPurchasing(null);
    showToast(`🎉 ${item.name} unlocked!`);
  };

  const handleBuyCoins = async (bundle) => {
    setPurchasing(bundle.id);
    try {
      // Check if in iframe (not published)
      if (window.self !== window.top) {
        showToast("⚠️ Checkout only works on published app");
        setPurchasing(null);
        return;
      }

      const response = await base44.functions.invoke("createCoinCheckout", {
        priceId: bundle.priceId,
      });
      
      if (!response.data?.sessionId) {
        throw new Error(response.data?.error || "Failed to create checkout session");
      }

      const stripe = await loadStripe("pk_live_51SxzwC3vUrZIHCwo4WAd4Q5L0p4dZ3jhHWrCN6gLk6ofqeiXfN76tbPUQT0fHRWMhpHXkXWWzWvFycIZx0b3owbE000mxwkAKN");
      if (!stripe) throw new Error("Stripe failed to load");
      
      const result = await stripe.redirectToCheckout({ sessionId: response.data.sessionId });
      if (result?.error) throw result.error;
    } catch (error) {
      console.error("Checkout error:", error);
      showToast("❌ Unable to start checkout. Please try again.");
      setPurchasing(null);
    }
  };

  const filtered = activeTab === "all" ? shopItems : shopItems.filter(i => i.category === activeTab);

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Profile")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)" }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Shop</h1>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Spend your coins</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(111,143,114,0.12)" }}>
          <span className="text-sm">⬡</span>
          <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>{balance}</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-sm font-medium text-white shadow-lg" style={{ backgroundColor: "var(--accent-primary)" }}>
          {toast}
        </div>
      )}

      {/* Buy Coins section */}
      <div className="mx-5 mt-5">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>💳 Buy Coins</h2>
        <div className="grid grid-cols-3 gap-3">
          {coinBundles.map((bundle) => (
            <button
              key={bundle.id}
              onClick={() => handleBuyCoins(bundle)}
              className="relative rounded-2xl p-3 text-center flex flex-col items-center gap-1 transition-all active:scale-95"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
            >
              {bundle.badge && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] px-2 py-0.5 rounded-full font-bold text-white whitespace-nowrap" style={{ backgroundColor: "var(--accent-secondary)" }}>{bundle.badge}</span>
              )}
              {purchasing === bundle.id ? (
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
              ) : (
                <span className="text-2xl">{bundle.emoji}</span>
              )}
              <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{bundle.coins} ⬡</p>
              <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{bundle.label}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: "var(--accent-primary)" }}>{bundle.price}</p>
            </button>
          ))}
        </div>
        {!stripeReady && <p className="text-[10px] mt-2 text-center text-red-500">⚠️ Publish the app to purchase coins</p>}
      </div>

      {/* Category tabs */}
      <div className="mx-5 mt-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categoryTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeTab === tab ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeTab === tab ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${activeTab === tab ? "var(--accent-primary)" : "var(--border-light)"}`,
              }}
            >
              {tab === "all" ? "All Items" : tab === "badge" ? "🏅 Badges" : tab === "boost" ? "⚡ Boosts" : "🎨 Themes"}
            </button>
          ))}
        </div>
      </div>

      {/* Shop items */}
      <div className="mx-5 mt-4 space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: item.bg }}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{item.description}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs">⬡</span>
                <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>{item.price}</span>
              </div>
            </div>
            <button
              onClick={() => handleBuy(item)}
              disabled={purchasing === item.id || balance < item.price}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shrink-0"
              style={{
                backgroundColor: balance >= item.price ? "var(--accent-primary)" : "#ccc",
                opacity: purchasing === item.id ? 0.7 : 1,
              }}
            >
              {purchasing === item.id ? "..." : balance >= item.price ? "Buy" : "Need more ⬡"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}