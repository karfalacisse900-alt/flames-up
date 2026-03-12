import React, { useState } from "react";
import { AlertCircle, DollarSign, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GroupPaymentFlow({ group, user, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinPaid = async () => {
    if (!user) return;
    
    // Check if running from iframe (published app only)
    if (window.self !== window.top) {
      alert("⚠️ Checkout only works from the published app. Please visit the app directly.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("createGroupCheckout", {
        group_id: group.id,
        group_name: group.name,
        monthly_fee: group.monthly_fee,
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError(res.data?.error || "Failed to create checkout session");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Failed to start payment. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border-light)" }}>
      <div className="p-4 rounded-2xl" style={{ backgroundColor: "var(--accent-primary-light)", border: `1px solid var(--accent-primary)` }}>
        <div className="flex items-start gap-3 mb-3">
          <Lock className="w-5 h-5 flex-shrink-0" style={{ color: "var(--accent-primary)" }} />
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--accent-primary)" }}>Join Premium Group</p>
            <p className="text-xs mt-1" style={{ color: "var(--accent-primary)" }}>
              <strong>${group.monthly_fee.toFixed(2)}/month</strong> for exclusive access
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg flex items-start gap-2" style={{ backgroundColor: "rgba(229, 62, 62, 0.1)", border: "1px solid rgba(229, 62, 62, 0.3)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#E53E3E" }} />
            <p className="text-xs" style={{ color: "#E53E3E" }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleJoinPaid}
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: "var(--accent-primary)",
            opacity: loading ? 0.6 : 1,
          }}>
          <DollarSign className="w-4 h-4" />
          {loading ? "Processing..." : "Subscribe Now"}
        </button>
        
        <p className="text-[10px] text-center mt-2" style={{ color: "var(--accent-primary)" }}>
          🔒 Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
}