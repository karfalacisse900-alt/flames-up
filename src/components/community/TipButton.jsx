import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TIP_PRESETS = [10, 25, 50, 100];

export default function TipButton({ postAuthorEmail, postId, isMenu }) {
  const [showTipModal, setShowTipModal] = useState(false);
  const [customCoins, setCustomCoins] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTip = async () => {
    if (!postAuthorEmail) {
      alert("Cannot tip this post");
      return;
    }

    const tipAmount = selectedPreset || (customCoins ? parseInt(customCoins) : null);

    if (!tipAmount || tipAmount < 1) {
      alert("Please select or enter a valid tip amount");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke("createCoinTipCheckout", {
        coins: tipAmount,
        recipientEmail: postAuthorEmail,
        postId: postId,
      });

      if (response.data?.url) {
        // Check if running in iframe (preview)
        if (window.self !== window.top) {
          alert("💳 Checkout only works in published app. Open in full app to complete payment.");
          setIsProcessing(false);
          return;
        }

        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        alert("Failed to create checkout. Please try again.");
      }
    } catch (error) {
      console.error("Error creating tip:", error);
      alert("Failed to process tip. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {isMenu ? (
        <button
          onClick={() => setShowTipModal(true)}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left"
          style={{ color: "#ef4444" }}
        >
          <Heart className="w-3.5 h-3.5 fill-current" /> Send Tip
        </button>
      ) : (
        <button
          onClick={() => setShowTipModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
        >
          <Heart className="w-3.5 h-3.5 fill-current" /> Tip
        </button>
      )}

      <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Send a Tip 💝</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Support this creator! 1 Coin = $0.01
            </p>

            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-2">
              {TIP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setSelectedPreset(selectedPreset === preset ? null : preset);
                    setCustomCoins("");
                  }}
                  className="py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={{
                    backgroundColor: selectedPreset === preset ? "var(--accent-primary)" : "var(--bg-subtle)",
                    color: selectedPreset === preset ? "#fff" : "var(--text-primary)",
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Custom Amount
              </label>
              <Input
                type="number"
                placeholder="Enter coins"
                value={customCoins}
                onChange={(e) => {
                  setCustomCoins(e.target.value);
                  setSelectedPreset(null);
                }}
                min="1"
                className="rounded-xl"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Total display */}
            {(selectedPreset || customCoins) && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--accent-primary-light)" }}>
                <p className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                  Total: {selectedPreset || customCoins} coins (${((selectedPreset || customCoins) * 0.01).toFixed(2)})
                </p>
              </div>
            )}

            <Button
              onClick={handleTip}
              disabled={isProcessing || (!selectedPreset && !customCoins)}
              className="w-full rounded-xl text-white font-bold py-3"
              style={{ backgroundColor: isProcessing ? "var(--text-hint)" : "var(--accent-primary)" }}
            >
              {isProcessing ? "Processing..." : "Send Tip 💝"}
            </Button>

            <p className="text-[11px] text-center" style={{ color: "var(--text-hint)" }}>
              You'll be redirected to secure payment
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}