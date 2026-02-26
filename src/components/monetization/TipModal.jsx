import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TIP_AMOUNTS = [5, 10, 25, 50, 100];

export default function TipModal({ contentCreator, contentType, contentId, onClose, onSuccess }) {
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTip = async () => {
    const amount = custom ? parseInt(custom) : selected;
    if (!amount || amount < 1) return;

    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.CreatorTip.create({
        creator_email: contentCreator.email,
        creator_name: contentCreator.name,
        tipper_email: user.email,
        tipper_name: user.full_name,
        coin_amount: amount,
        content_type: contentType,
        content_id: contentId,
        message: message.trim() || null,
      });

      // Add coins to creator wallet
      await base44.functions.invoke("addCreatorTip", {
        creator_email: contentCreator.email,
        amount,
        tipper_name: user.full_name,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Tip failed:", err);
      alert("Failed to send tip. Try again.");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        onClick={e => e.stopPropagation()}
        className="w-full bg-white rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Send a Tip 💜</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Show your appreciation to {contentCreator.name}
        </p>

        {/* Preset amounts */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {TIP_AMOUNTS.map(amt => (
            <button
              key={amt}
              onClick={() => { setSelected(amt); setCustom(""); }}
              className={`py-3 rounded-xl font-semibold transition-all ${
                selected === amt
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {amt} 🪙
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <input
          type="number"
          value={custom}
          onChange={e => { setCustom(e.target.value); setSelected(null); }}
          placeholder="Custom amount"
          className="w-full px-3 py-2.5 border rounded-xl text-sm mb-4 outline-none focus:border-red-500"
        />

        {/* Message */}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Add a message (optional)"
          className="w-full px-3 py-2.5 border rounded-xl text-sm mb-4 outline-none focus:border-red-500 resize-none"
          rows={3}
        />

        {/* Send button */}
        <button
          onClick={handleTip}
          disabled={!(selected || custom) || loading}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#E05C7A" }}
        >
          <Heart className="w-4 h-4" />
          {loading ? "Sending..." : `Send Tip`}
        </button>
      </motion.div>
    </motion.div>
  );
}