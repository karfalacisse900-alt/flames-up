import React from "react";
import { Coins } from "lucide-react";

export default function WalletWidget({ balance }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
      <span className="text-amber-500 text-sm">⬡</span>
      <span className="text-sm font-semibold text-amber-700">{balance ?? "…"}</span>
    </div>
  );
}