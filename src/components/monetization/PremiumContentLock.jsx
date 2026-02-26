import React, { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PremiumContentLock({ contentId, contentType, creatorEmail, creatorName, coinPrice, isOwner, isPurchased, onPurchase }) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();

      // Create purchase record
      await base44.entities.PremiumContent.update(contentId, {
        purchases: [...(await base44.entities.PremiumContent.filter({ id: contentId }))?.[0]?.purchases || [], user.email],
      });

      // Deduct coins from buyer, add to creator
      await base44.functions.invoke("purchasePremiumContent", {
        content_id: contentId,
        creator_email: creatorEmail,
        coin_amount: coinPrice,
        buyer_email: user.email,
      });

      onPurchase?.();
    } catch (err) {
      console.error("Purchase failed:", err);
      alert("Failed to purchase. Check your coin balance.");
    }
    setLoading(false);
  };

  if (isOwner) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
        <Unlock className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-medium text-blue-700">Premium • {coinPrice} 🪙</span>
      </div>
    );
  }

  if (isPurchased) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
        <Unlock className="w-4 h-4 text-green-600" />
        <span className="text-xs font-medium text-green-700">Purchased</span>
      </div>
    );
  }

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 transition-all disabled:opacity-40 hover:bg-amber-100"
    >
      <Lock className="w-4 h-4 text-amber-600" />
      <span className="text-xs font-medium text-amber-700">
        {loading ? "Unlocking..." : `Unlock • ${coinPrice} 🪙`}
      </span>
    </button>
  );
}