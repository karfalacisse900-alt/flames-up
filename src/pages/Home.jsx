import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Plus, RefreshCw, List, Layers, Zap, Search, X } from "lucide-react";
import { usePullToRefresh } from "../components/hooks/usePullToRefresh";
import { createPageUrl } from "../utils";
import FullScreenSwipeCard from "../components/home/FullScreenSwipeCard";
import CreatePostModal from "../components/home/CreatePostModal";
import { getFontStyle } from "../components/home/FontPicker";
import WelcomePopup from "../components/home/WelcomePopup";
import CommunityFeed from "../components/community/CommunityFeed";
import TrendingCarousel from "../components/home/TrendingCarousel";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 64px)", backgroundColor: "var(--bg-app)" }}>
      <div className="h-full overflow-y-auto">
        <TrendingCarousel />
        <CommunityFeed user={user} />
      </div>
      <WelcomePopup />
    </div>
  );
}