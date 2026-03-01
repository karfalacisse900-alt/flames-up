import { useEffect, useRef } from "react";

let stabiliserMounted = false; // singleton guard — only one instance ever runs

/**
 * Global layout stabilization hook.
 * Mount ONCE in the root Layout component.
 * - Locks --vh CSS var (iOS keyboard fix)
 * - Detects & spring-resets overscaled elements on touchend
 * - Clamps horizontal overflow on any element that escapes
 * - ResizeObserver watches the #root wrapper, not just body
 */
export function useLayoutStabilizer() {
  useEffect(() => {
    if (stabiliserMounted) return;
    stabiliserMounted = true;

    // ── 1. Real viewport height ──────────────────────────────────
    const setVh = () => {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    };
    setVh();

    // ── 2. Spring-reset any element whose scale drifted > 1.0 ────
    const SPRING = "transform 240ms cubic-bezier(0.34,1.56,0.64,1)";
    const resetOverscaled = () => {
      // Query all elements that have an inline or computed transform
      document.querySelectorAll("*").forEach(el => {
        if (!(el instanceof HTMLElement)) return;
        try {
          const t = window.getComputedStyle(el).transform;
          if (!t || t === "none") return;
          const m = new DOMMatrixReadOnly(t);
          const scaleX = Math.sqrt(m.a * m.a + m.b * m.b);
          const scaleY = Math.sqrt(m.c * m.c + m.d * m.d);
          if (scaleX > 1.04 || scaleY > 1.04) {
            // Don't touch framer-motion animated elements (they manage their own transforms)
            if (el.hasAttribute("data-projection-id") || el.hasAttribute("data-framer-component-type")) return;
            el.style.transition = SPRING;
            el.style.transform = "scale(1) translate(0px,0px)";
            setTimeout(() => { if (el) el.style.transition = ""; }, 280);
          }
        } catch { /* DOMMatrix can throw on unusual values */ }
      });
    };

    // ── 3. Clamp horizontal overflow ─────────────────────────────
    const lockOverflow = () => {
      const vw = window.innerWidth;
      if (document.documentElement.scrollWidth <= vw + 1) return;
      document.querySelectorAll("*").forEach(el => {
        if (!(el instanceof HTMLElement)) return;
        if (el.scrollWidth > vw + 4) {
          const cs = window.getComputedStyle(el);
          if (cs.overflowX !== "hidden" && cs.overflowX !== "clip" && cs.position !== "fixed") {
            el.style.overflowX = "hidden";
            el.style.maxWidth = "100%";
          }
        }
      });
    };

    // ── 4. Touch end handler ──────────────────────────────────────
    const onTouchEnd = () => setTimeout(resetOverscaled, 60);

    // ── 5. ResizeObserver on #root ────────────────────────────────
    let ro;
    const root = document.getElementById("root") || document.body;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => { setVh(); lockOverflow(); });
      ro.observe(root);
    }

    // ── 6. Viewport meta (belt + suspenders) ─────────────────────
    let mv = document.querySelector("meta[name=viewport]");
    if (!mv) { mv = document.createElement("meta"); mv.name = "viewport"; document.head.appendChild(mv); }
    mv.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover";

    // ── 7. CSS: ensure flex children never blow out ───────────────
    const style = document.createElement("style");
    style.id = "layout-stabilizer-css";
    style.textContent = `
      * { min-width: 0; box-sizing: border-box; }
      html, body, #root { overflow-x: hidden !important; max-width: 100% !important; }
      body { touch-action: manipulation; overscroll-behavior: none; }
      .flex, [class*="flex-"] { min-width: 0; min-height: 0; }
    `;
    if (!document.getElementById("layout-stabilizer-css")) document.head.appendChild(style);

    window.addEventListener("resize", setVh, { passive: true });
    window.addEventListener("orientationchange", setVh, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    lockOverflow();

    return () => {
      stabiliserMounted = false;
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
      document.removeEventListener("touchend", onTouchEnd);
      ro?.disconnect();
      document.getElementById("layout-stabilizer-css")?.remove();
    };
  }, []);
}

/** Attach to a ref to spring-reset that specific element on touch end */
export function useSpringReset(ref) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return;
    const handler = () => {
      el.style.transition = "transform 260ms cubic-bezier(0.34,1.56,0.64,1)";
      el.style.transform = "scale(1) translate(0px,0px)";
      setTimeout(() => { if (el) el.style.transition = ""; }, 300);
    };
    el.addEventListener("touchend", handler, { passive: true });
    return () => el.removeEventListener("touchend", handler);
  }, [ref]);
}