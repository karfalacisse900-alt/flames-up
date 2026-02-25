import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import WelcomePopup from "../components/home/WelcomePopup";
import CommunityFeed from "../components/community/CommunityFeed";
import TrendingCarousel from "../components/home/TrendingCarousel";
import CreateCommunityPost from "../components/community/CreateCommunityPost";

export default function Home() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      <div className="overflow-y-auto scrollbar-hide relative" style={{ height: "calc(100dvh - 64px)" }}>
        <TrendingCarousel />
        <CommunityFeed user={user} />
      </div>
      
      {/* Floating create button */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all active:scale-95 z-30"
        style={{ backgroundColor: "var(--accent-primary)" }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create modal */}
      <CreateCommunityPost open={showCreate} onClose={() => setShowCreate(false)} user={user} onCreated={() => {}} />
      
      <WelcomePopup />
    </div>
  );
}