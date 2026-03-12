import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WelcomePopup from "../components/home/WelcomePopup";
import WelcomePage from "../components/home/WelcomePage";
import HomeHeader from "@/components/home/HomeHeader";
import DidYouKnowSection from "@/components/home/DidYouKnowSection";
import CommunityFeed from "../components/community/CommunityFeed";
import StatusBar from "@/components/home/StatusBar";
import LiveActivityFeed from "@/components/feed/LiveActivityFeed";

export default function Home() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setAuthChecked(true));
  }, []);

  // Show nothing while checking auth to avoid flash
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)" }} />
      </div>
    );
  }

  // Show welcome page for unauthenticated users
  if (!user) {
    return <WelcomePage />;
  }

  const divider = <div style={{ height: 1, background: "linear-gradient(to right, transparent, var(--border-light) 20%, var(--border-medium) 50%, var(--border-light) 80%, transparent)" }} />;

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      <HomeHeader user={user} />
      <StatusBar user={user} />
      {divider}
      <DidYouKnowSection user={user} />
      {divider}
      <CommunityFeed user={user} />
      <WelcomePopup />
      {user && <LiveActivityFeed maxItems={8} autoRefreshMs={4000} />}
    </div>
  );
}