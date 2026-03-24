import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client"; // v2
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

import WelcomePopup from "../components/home/WelcomePopup";
import WelcomePage from "../components/home/WelcomePage";
import HomeHeader from "@/components/home/HomeHeader";
import DidYouKnowSection from "@/components/home/DidYouKnowSection";
import CommunityFeed from "../components/community/CommunityFeed";
import StatusBar from "@/components/home/StatusBar";

export default function Home() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 rounded-full border-2"
          style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user) {
    return <WelcomePage />;
  }

  const divider = (
    <div style={{ height: 1, background: "linear-gradient(to right, transparent, var(--border-light) 20%, var(--border-medium) 50%, var(--border-light) 80%, transparent)" }} />
  );

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      <HomeHeader user={user} />
      <StatusBar user={user} />
      {divider}
      <div className="px-4 py-4">
        <Link
          to={createPageUrl("ListenDontJudge")}
          className="block rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 12px 32px rgba(99,102,241,0.25)",
          }}
        >
          <motion.div
            className="px-5 py-6 flex items-center gap-4"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              🤍
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base mb-1" style={{ fontFamily: "var(--font-serif)" }}>
                Listen, Don't Judge
              </h3>
              <p className="text-white/80 text-xs leading-relaxed">
                Share openly in a judgment-free space
              </p>
            </div>
            <div className="shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>
        </Link>
      </div>
      {divider}
      <DidYouKnowSection user={user} />
      {divider}
      <CommunityFeed user={user} />
      <WelcomePopup />
    </div>
  );
}