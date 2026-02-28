import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WelcomePopup from "../components/home/WelcomePopup";
import CommunityFeed from "../components/community/CommunityFeed";
import HomeHeader from "@/components/home/HomeHeader";
import DidYouKnowSection from "@/components/home/DidYouKnowSection";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      <div className="overflow-y-auto scrollbar-hide" style={{ height: "calc(100dvh - 64px)" }}>
        <HomeHeader user={user} />
        <DidYouKnowSection user={user} />
        <TrendingCarousel />
        <CommunityFeed user={user} />
      </div>
      <WelcomePopup />
    </div>
  );
}