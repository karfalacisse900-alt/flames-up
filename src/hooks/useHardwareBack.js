import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * useHardwareBack — Android hardware back button / swipe-back handling.
 *
 * Pushes a single sentinel state once. On popstate:
 *  - If we're at the root, let the browser handle it (app exit).
 *  - Otherwise, navigate(-1) via React Router, then re-push the sentinel once.
 *
 * Rate-limiting prevents the >100 pushState/10s SecurityError.
 */
export function useHardwareBack(onBack) {
  const navigate = useNavigate();
  const location = useLocation();
  const rootPath = useRef(location.pathname);
  const sentinelPushed = useRef(false);
  const lastPushTime = useRef(0);

  // Push sentinel once on mount
  useEffect(() => {
    if (!sentinelPushed.current) {
      window.history.pushState({ __hwback: true }, "");
      sentinelPushed.current = true;
    }
  }, []);

  useEffect(() => {
    const handlePopState = (e) => {
      // Rate-limit: ignore if last push was < 500ms ago
      const now = Date.now();
      if (now - lastPushTime.current < 500) return;

      if (onBack) {
        onBack();
        // Re-push sentinel so we keep catching back presses
        lastPushTime.current = Date.now();
        window.history.pushState({ __hwback: true }, "");
        return;
      }

      const atRoot =
        location.pathname === "/" ||
        location.pathname === rootPath.current;

      if (atRoot) {
        // Let the OS handle it (app exit / browser back)
        sentinelPushed.current = false;
        return;
      }

      navigate(-1);

      // Re-push sentinel after navigation
      lastPushTime.current = Date.now();
      setTimeout(() => {
        window.history.pushState({ __hwback: true }, "");
      }, 50);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, location.pathname, onBack]);
}