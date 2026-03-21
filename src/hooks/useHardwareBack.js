import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * useHardwareBack — proper Android hardware back button / swipe-back handling.
 *
 * Strategy:
 * - Tracks a "stack depth" counter in a ref so we know how deep we are.
 * - On every navigation (location change), increments depth.
 * - When back is pressed:
 *   - If depth > 0: navigate(-1) and decrement depth.
 *   - If depth === 0 (at root): do nothing — let the WebView exit naturally.
 * - This avoids the infinite sentinel-push loop that broke previous implementations.
 */
export function useHardwareBack(onBack) {
  const navigate = useNavigate();
  const location = useLocation();
  const stackDepth = useRef(0);
  const rootPath = useRef(location.pathname);

  // Track navigation depth: increment when we navigate away from root
  useEffect(() => {
    if (location.pathname !== rootPath.current) {
      stackDepth.current = Math.max(stackDepth.current, window.history.length - 1);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Push one sentinel so popstate fires on first back press
    window.history.pushState({ __hwback: true }, "");

    const handlePopState = (e) => {
      // Always re-push the sentinel to keep catching back presses
      window.history.pushState({ __hwback: true }, "");

      if (onBack) {
        onBack();
        return;
      }

      // At root path — nothing to pop, allow natural exit
      if (location.pathname === "/" || location.pathname === rootPath.current) {
        // Remove our sentinel and let the browser handle it (exits app)
        window.history.back();
        return;
      }

      navigate(-1);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location.pathname, onBack]);
}