import { useEffect } from "react";

/**
 * Global layout stabilization hook.
 * - Locks viewport scale to 1.0
 * - Detects & resets overflowed / over-scaled elements
 * - Recalculates --vh on resize / orientation change
 * - Spring-animates scale back on touch end
 */
export function useLayoutStabilizer() {
  useEffect(() => {
    // ── 1. CSS custom property for real viewport height (fixes iOS keyboard push) ──
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();

    // ── 2. Reset any element whose computed scale drifted above 1.0 ──
    const resetOverscaledElements = () => {
      const all = document.querySelectorAll("[style*='scale'], [style*='transform']");
      all.forEach(el => {
        const style = window.getComputedStyle(el);
        const matrix = new DOMMatrixReadOnly(style.transform);
        // scaleX component > 1.05 = unintended zoom
        if (matrix.a > 1.05 || matrix.d > 1.05) {
          el.style.transition = "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)";
          el.style.transform = "scale(1) translate(0,0)";
          setTimeout(() => { el.style.transition = ""; }, 300);
        }
      });
    };

    // ── 3. Prevent document-level horizontal overflow ──
    const lockOverflow = () => {
      if (document.documentElement.scrollWidth > window.innerWidth + 2) {
        // Find & clip the offending element
        document.querySelectorAll("*").forEach(el => {
          if (el.scrollWidth > window.innerWidth + 4) {
            const cs = window.getComputedStyle(el);
            if (cs.overflowX !== "hidden" && cs.overflowX !== "clip") {
              el.style.overflowX = "hidden";
              el.style.maxWidth = "100%";
            }
          }
        });
      }
    };

    // ── 4. Touch end → spring back any stretched element ──
    const handleTouchEnd = () => {
      setTimeout(resetOverscaledElements, 80);
    };

    // ── 5. ResizeObserver for continuous correction ──
    let resizeObserver;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        setVh();
        lockOverflow();
      });
      resizeObserver.observe(document.body);
    }

    // ── 6. Viewport meta enforcement ──
    let metaViewport = document.querySelector("meta[name=viewport]");
    if (!metaViewport) {
      metaViewport = document.createElement("meta");
      metaViewport.name = "viewport";
      document.head.appendChild(metaViewport);
    }
    // Allow user-scalable but clamp max to 1 to prevent persistent zoom drift
    metaViewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

    window.addEventListener("resize", setVh, { passive: true });
    window.addEventListener("orientationchange", setVh, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Run once on mount
    lockOverflow();

    return () => {
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
      window.removeEventListener("touchend", handleTouchEnd);
      resizeObserver?.disconnect();
    };
  }, []);
}

/**
 * Hook for individual components that may stretch.
 * Attach ref to the element — it will spring back on touch end.
 */
export function useSpringReset(ref) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return;

    const handleTouchEnd = () => {
      el.style.transition = "transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.transform = "scale(1) translate(0px, 0px)";
      setTimeout(() => { if (el) el.style.transition = ""; }, 300);
    };

    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => el.removeEventListener("touchend", handleTouchEnd);
  }, [ref]);
}