import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WelcomePopup from "../components/home/WelcomePopup";
import HomeHeader from "@/components/home/HomeHeader";
import DidYouKnowSection from "@/components/home/DidYouKnowSection";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const divider = <div style={{ height: 1, background: "linear-gradient(to right, transparent, var(--border-light) 20%, var(--border-medium) 50%, var(--border-light) 80%, transparent)" }} />;

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      <HomeHeader user={user} />
      <DidYouKnowSection user={user} />
      {divider}
      <WelcomePopup />
    </div>
  );
}