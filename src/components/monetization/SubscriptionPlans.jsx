import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SUBSCRIPTION_TIERS = [
  {
    name: "Free",
    tier: "free",
    coins: 0,
    features: ["Basic access", "Standard themes", "Community features"],
  },
  {
    name: "Creator Pro",
    tier: "creator_pro",
    coins: 50,
    period: "month",
    features: [
      "Everything in Free",
      "Ad-free experience",
      "Analytics dashboard",
      "Premium creator themes",
      "Early access to new features",
      "Higher post boost limits",
    ],
    recommended: true,
  },
  {
    name: "Premium Plus",
    tier: "premium_plus",
    coins: 100,
    period: "month",
    features: [
      "Everything in Creator Pro",
      "Priority support",
      "Custom profile page",
      "Exclusive badges",
      "Advanced analytics",
      "Live room monetization tools",
      "Premium content creation",
    ],
  },
];

export default function SubscriptionPlans({ currentTier, onSubscribe }) {
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (tier) => {
    if (tier === "free") return; // Can't subscribe to free

    setLoading(tier);
    try {
      const user = await base44.auth.me();
      const planData = SUBSCRIPTION_TIERS.find(p => p.tier === tier);

      await base44.entities.UserSubscription.create({
        user_email: user.email,
        tier,
        coin_price: planData.coins,
        features: planData.features.slice(1), // Exclude "Everything in..." line
        auto_renew: true,
      });

      // Deduct coins
      await base44.functions.invoke("subscribeUser", {
        tier,
        coin_cost: planData.coins,
      });

      onSubscribe?.(tier);
    } catch (err) {
      console.error("Subscription failed:", err);
      alert("Failed to subscribe. Check your coin balance.");
    }
    setLoading(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 text-center mb-6">
        Unlock exclusive features and support the app
      </p>

      <div className="grid gap-3">
        {SUBSCRIPTION_TIERS.map((plan) => (
          <motion.div
            key={plan.tier}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-2xl border-2 transition-all ${
              currentTier === plan.tier
                ? "border-green-500 bg-green-50"
                : plan.recommended
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                {plan.coins > 0 && (
                  <p className="text-sm text-gray-600">
                    {plan.coins} 🪙 per {plan.period || "month"}
                  </p>
                )}
              </div>
              {plan.recommended && (
                <span className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                  Popular
                </span>
              )}
              {currentTier === plan.tier && (
                <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                  Active
                </span>
              )}
            </div>

            <ul className="space-y-2 mb-4">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {plan.tier !== "free" && currentTier !== plan.tier && (
              <button
                onClick={() => handleSubscribe(plan.tier)}
                disabled={loading === plan.tier}
                className="w-full py-2 rounded-xl font-semibold text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: plan.recommended ? "#3B82F6" : "#6B7280" }}
              >
                {loading === plan.tier ? "Subscribing..." : "Subscribe"}
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}