import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import WelcomePopup from "../components/home/WelcomePopup";
import CommunityFeed from "../components/community/CommunityFeed";
import HomeHeader from "@/components/home/HomeHeader";
import DidYouKnowSection from "@/components/home/DidYouKnowSection";
import DesktopFeed from "@/components/feed/DesktopFeed";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      {/* ── Mobile layout (< lg) ── */}
      <div className="lg:hidden overflow-y-auto scrollbar-hide" style={{ height: "calc(100dvh - 64px)" }}>
        <HomeHeader user={user} />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}>
          <DidYouKnowSection user={user} />
        </motion.div>
        <div style={{ height: 1, background: "linear-gradient(to right, transparent, var(--border-light) 20%, var(--border-medium) 50%, var(--border-light) 80%, transparent)", margin: "0 0 4px" }} />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <CommunityFeed user={user} />
        </motion.div>
      </div>

      {/* ── Desktop layout (>= lg) ── */}
      <div className="hidden lg:block px-6 pt-6 max-w-2xl mx-auto">
        <DesktopFeed user={user} />
      </div>

      <WelcomePopup />
    </div>
  );
}