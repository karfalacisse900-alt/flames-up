import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import WelcomePopup from "../components/home/WelcomePopup";
import CommunityFeed from "../components/community/CommunityFeed";
import TrendingCarousel from "../components/home/TrendingCarousel";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      <div className="overflow-y-auto scrollbar-hide" style={{ height: "calc(100dvh - 64px)" }}>
        <TrendingCarousel />
        <CommunityFeed user={user} />
      </div>
      <WelcomePopup />
    </div>
  );
}