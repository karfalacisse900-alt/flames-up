import { useEffect } from "react";

let stabiliserMounted = false;

/**
 * Bulletproof Layout Stabilizer
 * - Prevents zoom accumulation
 * - Snaps scale > 1.0 back with spring animation
 * - Kills horizontal overflow instantly
 * - Fires on touchend, visibilitychange, resize, orientationchange
 */
export function useLayoutStabilizer() {
  useEffect(() => {
    if (stabiliserMounted) return;
    stabiliserMounted = true;

    // ── 1. Lock viewport meta hard ────────────────────────────────
    const setViewport = () => {
      let mv = document.querySelector("meta[name=viewport]");
      if (!mv) {
        mv = document.createElement("meta");
        mv.name = "viewport";
        document.head.appendChild(mv);
      }
      mv.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover";
    };
    setViewport();

    // ── 2. Real viewport height var ───────────────────────────────
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();

    // ── 3. Inject global CSS rules ────────────────────────────────
    if (!document.getElementById("layout-stabilizer-css")) {
      const style = document.createElement("style");
      style.id = "layout-stabilizer-css";
      style.textContent = `
        html, body, #root {
          overflow-x: clip !important;
          overflow-y: visible !important;
          max-width: 100vw !important;
          width: 100% !important;
        }
        body {
          touch-action: pan-y !important;
          overscroll-behavior-x: none !important;
          -webkit-text-size-adjust: 100% !important;
          text-size-adjust: 100% !important;
        }
        * { box-sizing: border-box; min-width: 0; }
        .flex, [class*="flex-"] { min-width: 0; min-height: 0; }
        img, video, canvas, svg { max-width: 100%; }
        input, textarea, select { font-size: 16px !important; }
      `;
      document.head.appendChild(style);
    }

    // ── 4. Spring-reset overscaled elements ───────────────────────
    const SPRING = "transform 260ms cubic-bezier(0.34,1.56,0.64,1)";

    const resetOverscaled = () => {
      try {
        document.querySelectorAll("*").forEach(el => {
          if (!(el instanceof HTMLElement)) return;
          // Skip framer-motion managed elements
          if (el.hasAttribute("data-projection-id") || el.hasAttribute("data-framer-component-type")) return;
          const t = window.getComputedStyle(el).transform;
          if (!t || t === "none") return;
          const m = new DOMMatrixReadOnly(t);
          const sx = Math.sqrt(m.a * m.a + m.b * m.b);
          const sy = Math.sqrt(m.c * m.c + m.d * m.d);
          if (sx > 1.05 || sy > 1.05) {
            el.style.transition = SPRING;
            el.style.transform = "scale(1) translate(0,0)";
            setTimeout(() => { if (el) el.style.transition = ""; }, 320);
          }
        });
      } catch (_) {}
    };

    // ── 5. Clamp any element wider than viewport ──────────────────
    const lockHorizontalOverflow = () => {
      const vw = window.innerWidth;
      // Fast exit: if page isn't overflowing, do nothing
      if (document.documentElement.scrollWidth <= vw + 2) return;
      document.querySelectorAll("*").forEach(el => {
        if (!(el instanceof HTMLElement)) return;
        try {
          if (el.scrollWidth <= vw + 2) return;
          const cs = window.getComputedStyle(el);
          if (cs.position === "fixed") return;
          if (cs.overflowX === "hidden" || cs.overflowX === "clip") return;
          el.style.overflowX = "clip";
          el.style.maxWidth = "100%";
          // Never override overflow-y — it breaks vertical scrolling
          if (!el.style.overflowY) el.style.overflowY = "visible";
        } catch (_) {}
      });
    };

    // ── 6. Detect browser-level pinch zoom and reset ──────────────
    let lastScale = 1;
    const onTouchMove = (e) => {
      if (e.touches.length >= 2) {
        // pinch gesture detected — we'll reset on touchend
      }
    };

    const onTouchEnd = () => {
      setTimeout(() => {
        resetOverscaled();
        // Also reset visual viewport zoom if it drifted
        if (window.visualViewport && Math.abs(window.visualViewport.scale - 1) > 0.05) {
          // Force scroll into view resets the zoom on most browsers
          document.documentElement.style.zoom = "1";
          setTimeout(() => { document.documentElement.style.zoom = ""; }, 50);
        }
      }, 80);
    };

    // ── 7. Visual viewport change handler ────────────────────────
    const onVisualViewportChange = () => {
      setVh();
      if (window.visualViewport && window.visualViewport.scale > 1.02) {
        // User pinch-zoomed → reset after brief delay
        setTimeout(() => {
          resetOverscaled();
          lockHorizontalOverflow();
        }, 200);
      }
    };

    // ── 8. ResizeObserver on #root ────────────────────────────────
    let ro;
    const root = document.getElementById("root") || document.body;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => {
        setVh();
        lockHorizontalOverflow();
      });
      ro.observe(root);
    }

    // ── 9. Wire up all listeners ──────────────────────────────────
    window.addEventListener("resize", () => { setVh(); lockHorizontalOverflow(); }, { passive: true });
    window.addEventListener("orientationchange", () => { setTimeout(setVh, 120); }, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("visibilitychange", () => { setVh(); lockHorizontalOverflow(); });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onVisualViewportChange);
      window.visualViewport.addEventListener("scroll", onVisualViewportChange);
    }

    // ── 10. Initial passes ────────────────────────────────────────
    lockHorizontalOverflow();

    return () => {
      stabiliserMounted = false;
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("visibilitychange", setVh);
      ro?.disconnect();
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", onVisualViewportChange);
        window.visualViewport.removeEventListener("scroll", onVisualViewportChange);
      }
      document.getElementById("layout-stabilizer-css")?.remove();
    };
  }, []);
}

/** Per-element spring reset on touch */
export function useSpringReset(ref) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return;
    const handler = () => {
      el.style.transition = "transform 260ms cubic-bezier(0.34,1.56,0.64,1)";
      el.style.transform = "scale(1) translate(0,0)";
      setTimeout(() => { if (el) el.style.transition = ""; }, 320);
    };
    el.addEventListener("touchend", handler, { passive: true });
    return () => el.removeEventListener("touchend", handler);
  }, [ref]);
}