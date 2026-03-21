import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import React from "react";

/**
 * usePullToRefresh — attach to a scrollable container.
 * Returns { containerRef, pullIndicator, handleTouchStart, handleTouchMove, handleTouchEnd }
 */
export function usePullToRefresh(onRefresh) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    const el = containerRef.current;
    if (el && el.scrollTop > 0) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && dy < 100) setPullY(dy);
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullY > 60) {
      setRefreshing(true);
      setPullY(0);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    } else {
      setPullY(0);
    }
  }, [pullY, onRefresh]);

  const PullIndicator = () => (
    <motion.div
      animate={{ height: pullY > 0 ? Math.min(pullY * 0.6, 56) : 0, opacity: pullY > 20 ? 1 : 0 }}
      className="flex items-center justify-center overflow-hidden"
    >
      <motion.div
        animate={{ rotate: refreshing ? 360 : pullY * 3 }}
        transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: "linear" } : {}}
      >
        <RefreshCw className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
      </motion.div>
    </motion.div>
  );

  return {
    containerRef,
    PullIndicator,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}