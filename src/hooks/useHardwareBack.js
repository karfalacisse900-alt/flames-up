import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * useHardwareBack — intercepts the Android hardware back button / browser back gesture.
 *
 * On mobile WebViews (Android), the hardware back button fires a `popstate` event.
 * This hook pushes a sentinel history entry on mount so there's always something to
 * pop back to, then intercepts the popstate event to call `navigate(-1)` (pop the
 * React Router stack) rather than letting the WebView exit the app.
 *
 * Usage:
 *   Call once at the top of your app (e.g. inside AuthenticatedApp or App).
 *   Optionally pass `onBack` to override default behaviour for specific screens.
 */
export function useHardwareBack(onBack) {
  const navigate = useNavigate();

  useEffect(() => {
    // Push a sentinel state so there's always a "previous" entry to pop back to.
    // This prevents the WebView from exiting the app on the very first back press.
    if (!window.history.state?.__sentinel) {
      window.history.pushState({ __sentinel: true }, "");
    }

    const handlePopState = (e) => {
      // Re-push the sentinel so subsequent back presses are also caught
      window.history.pushState({ __sentinel: true }, "");

      if (onBack) {
        onBack();
      } else {
        navigate(-1);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, onBack]);
}