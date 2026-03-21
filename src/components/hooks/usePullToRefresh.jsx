import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import React from "react";

/**
 * usePullToRefresh — attaches to any scrollable view.
 * Uses window.scrollY for page-level pull detection.
 * Returns { containerProps, PullIndicator, isRefreshing }
 */
export function usePullToRefresh(onRefresh) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e) => {
    // Only start pull if page is scrolled to top
    if (window.scrollY <= 0) {
      touchStartY.current = e.touches[0].clientY;
      pulling.current = true;
    } else {
      pulling.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && dy < 120) {
      setPullY(dy);
    } else if (dy <= 0) {
      setPullY(0);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullY > 60 && !refreshing) {
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
  }, [pullY, onRefresh, refreshing]);

  const containerProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  const PullIndicator = () => {
    const showSpinner = refreshing;
    const showPull = pullY > 10;
    if (!showSpinner && !showPull) return null;

    return (
      <motion.div
        initial={false}
        animate={{
          height: showSpinner ? 48 : Math.min(pullY * 0.5, 48),
          opacity: showSpinner ? 1 : pullY > 20 ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center justify-center overflow-hidden"
      >
        <motion.div
          animate={{ rotate: showSpinner ? 360 : pullY * 3 }}
          transition={
            showSpinner
              ? { repeat: Infinity, duration: 0.6, ease: "linear" }
              : { type: "spring", stiffness: 200, damping: 20 }
          }
        >
          <RefreshCw className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
        </motion.div>
      </motion.div>
    );
  };

  // Legacy compat — also export old-style individual refs/handlers
  const containerRef = useRef(null);

  return {
    containerProps,
    containerRef,
    PullIndicator,
    isRefreshing: refreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}