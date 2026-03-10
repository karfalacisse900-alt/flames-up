import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export default function TipNotification({ sender, amount }) {
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="px-3 py-2 rounded-xl flex items-center gap-2 text-white font-bold text-sm transition-all"
      style={{
        backgroundColor: "#ef4444",
        opacity: animate ? 1 : 0,
        transform: animate ? "translateY(0)" : "translateY(-20px)",
        transitionDuration: "300ms",
      }}>
      <Heart className="w-4 h-4 fill-current" />
      <div>
        <p>{sender}</p>
        <p className="text-xs opacity-90">+{amount} coins</p>
      </div>
    </div>
  );
}