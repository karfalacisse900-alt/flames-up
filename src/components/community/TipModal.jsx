import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, Coins, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const TIP_AMOUNTS = [1, 5, 10, 25, 50, 100];

export default function TipModal({ open, onClose, post, user }) {
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: wallet = {} } = useQuery({
    queryKey: ["wallet", user?.email],
    queryFn: () => base44.entities.CoinWallet.filter({ user_email: user?.email }).then((w) => w[0] || {}),
    enabled: !!user?.email,
  });

  const tipAmount = customAmount ? parseInt(customAmount) : selectedAmount;
  const hasEnoughCoins = wallet.balance >= tipAmount;

  const handleSendTip = async () => {
    if (!hasEnoughCoins || !tipAmount) return;

    setLoading(true);
    try {
      const response = await base44.functions.invoke("sendTip", {
        postId: post.id,
        creatorEmail: post.author_email,
        coinsAmount: tipAmount,
        message: message || "Love your post!",
      });

      if (response.data?.success) {
        onClose();
        setSelectedAmount(10);
        setCustomAmount("");
        setMessage("");
        alert("Tip sent! Thank you for supporting this creator!");
      }
    } catch (error) {
      console.error("Tip error:", error);
      alert("Failed to send tip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "var(--font-serif)" }}>
            <Heart className="w-5 h-5" style={{ color: "#E05C7A" }} />
            Send a Tip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance */}
          <div className="p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <Coins className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Your Balance</p>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {wallet.balance || 0} coins
              </p>
            </div>
          </div>

          {/* Tip Amount Selection */}
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Quick Amounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TIP_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedAmount === amt && !customAmount ? "text-white" : ""
                  }`}
                  style={{
                    backgroundColor:
                      selectedAmount === amt && !customAmount ? "var(--accent-primary)" : "var(--bg-card)",
                    border: selectedAmount === amt && !customAmount ? "none" : "1px solid var(--border-light)",
                    color: selectedAmount === amt && !customAmount ? "#fff" : "var(--text-primary)",
                  }}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Custom Amount
            </p>
            <Input
              type="number"
              placeholder="Enter coins"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="1"
              className="rounded-lg"
              style={{
                backgroundColor: "var(--bg-subtle)",
                borderColor: "var(--border-light)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Message */}
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Message (Optional)
            </p>
            <Textarea
              placeholder="Leave a kind message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-lg resize-none"
              rows={2}
              style={{
                backgroundColor: "var(--bg-subtle)",
                borderColor: "var(--border-light)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Warning if not enough coins */}
          {!hasEnoughCoins && (
            <div className="p-3 rounded-lg flex gap-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <p className="text-sm" style={{ color: "#ef4444" }}>
                You don't have enough coins. Buy more coins to send this tip.
              </p>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendTip}
            disabled={loading || !hasEnoughCoins}
            className="w-full rounded-lg py-3 font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            {loading ? "Sending..." : `Send ${tipAmount} Coins`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}