import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client"; // v2
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import WelcomePopup from "../components/home/WelcomePopup";
import WelcomePage from "../components/home/WelcomePage";
import HomeHeader from "@/components/home/HomeHeader";
import DidYouKnowSection from "@/components/home/DidYouKnowSection";
import CommunityFeed from "../components/community/CommunityFeed";
import StatusBar from "@/components/home/StatusBar";

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