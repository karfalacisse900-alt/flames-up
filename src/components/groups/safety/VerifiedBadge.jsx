import React from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";

/**
 * type: "host" | "event" | "icon"
 * size: "xs" | "sm" | "md" | "lg"
 */
export default function VerifiedBadge({ type = "host", size = "sm" }) {
  const iconSizes = { xs: "w-3 h-3", sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" };
  const textSizes = { xs: "text-[9px]", sm: "text-[10px]", md: "text-xs", lg: "text-sm" };
  const iconCls = iconSizes[size] || iconSizes.sm;
  const textCls = textSizes[size] || textSizes.sm;

  if (type === "event") {
    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${textCls}`}
        style={{ backgroundColor: "#E8F2EC", color: "#2E6B4F", border: "1px solid #2E6B4F25" }}
      >
        <ShieldCheck className={iconCls} />
        Verified Event
      </span>
    );
  }

  if (type === "icon") {
    return <BadgeCheck className={`${iconCls} shrink-0`} style={{ color: "#0284C7" }} />;
  }

  // host badge
  return (
    <span className={`inline-flex items-center gap-0.5 font-bold ${textCls}`} style={{ color: "#0284C7" }}>
      <BadgeCheck className={iconCls} style={{ color: "#0284C7" }} />
      Verified Host
    </span>
  );
}