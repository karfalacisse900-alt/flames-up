import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import WelcomePopup from "../components/home/WelcomePopup";
import CommunityFeed from "../components/community/CommunityFeed";
import HomeHeader from "@/components/home/HomeHeader";
import DidYouKnowSection from "@/components/home/DidYouKnowSection";
import HomeQuickActions from "@/components/home/HomeQuickActions";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      <div className="scrollbar-hide" style={{ overflowY: "auto", height: "calc(100dvh - 64px)" }}>
        <HomeHeader user={user} />
        <HomeQuickActions user={user} />
        <DidYouKnowSection user={user} />
        <CommunityFeed user={user} />
      </div>
      <WelcomePopup />
    </div>
  );
}