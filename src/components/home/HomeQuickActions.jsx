import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Palette, Trophy, Radio, Compass, Zap, Users } from "lucide-react";
import { motion } from "framer-motion";

const ACTIONS = [
  { icon: Palette,  label: "Gallery",    page: "Gallery",          color: "#7C69C4", bg: "#7C69C415" },
  { icon: Trophy,   label: "Challenges", page: "WeeklyChallenges", color: "#D98B62", bg: "#D98B6215" },
  { icon: Radio,    label: "Live",       page: "Live",             color: "#E05C7A", bg: "#E05C7A15" },
  { icon: Compass,  label: "Discover",   page: "Discover",         color: "#2E6B4F", bg: "#2E6B4F15" },
  { icon: Zap,      label: "Games",      page: "Games",            color: "#F59E0B", bg: "#F59E0B15" },
  { icon: Users,    label: "Explore",    page: "Explore",          color: "#4A7FC1", bg: "#4A7FC115" },
];

export default function HomeQuickActions({ user }) {
  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {ACTIONS.map((a, i) => (
          <motion.div
            key={a.page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
          >
            <Link
              to={createPageUrl(a.page)}
              className="flex flex-col items-center gap-1.5 shrink-0 active:scale-90 transition-transform"
              style={{ minWidth: 60 }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: a.bg, border: `1.5px solid ${a.color}25` }}
              >
                <a.icon className="w-5 h-5" style={{ color: a.color, strokeWidth: 2 }} />
              </div>
              <span className="text-[11px] font-semibold text-center" style={{ color: "var(--text-secondary)" }}>
                {a.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}