import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Home, Palette, User, Search, Flame, Users, MapPin } from "lucide-react";

import AppAIAssistant from "@/components/AppAIAssistant";
import MiniPlayerWrapper from "@/components/discover/MiniPlayerWrapper.jsx";
import { useLayoutStabilizer } from "@/components/hooks/useLayoutStabilizer";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";

const navItems = [
{ name: "Home",    icon: Home,    page: "Home" },
{ name: "Places", icon: MapPin,  page: "Places" },
{ name: "Discover", icon: Search,  page: "Discover" },
{ name: "Groups",  icon: Users,   page: "Groups" },
{ name: "Profile", icon: User,    page: "Profile" },
];

const ADMIN_PAGES = ["AdminContentManager", "AdminAnalytics", "AdminModeration"];
const WIDE_PAGES = ["Gallery", "Discover", "WeeklyChallenges", "HallOfFame", "Art", "ArtStudio", "Explore", "Groups", "Places"];


// Flames-Up Logo component
function FlamesUpLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #E05C2A, #F97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Flame style={{ width: 16, height: 16, color: "#fff", fill: "#fff" }} />
      </div>
      <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>flames-up</span>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  useLayoutStabilizer();
  const navigate = useNavigate();

  // Disable pinch-zoom and double-tap zoom globally
  useEffect(() => {
    const preventZoom = (e) => { if (e.touches && e.touches.length > 1) e.preventDefault(); };
    const preventDblTapZoom = (e) => { e.preventDefault(); };

    document.addEventListener("touchmove", preventZoom, { passive: false });
    document.addEventListener("gesturestart", preventDblTapZoom, { passive: false });
    document.addEventListener("gesturechange", preventDblTapZoom, { passive: false });
    document.addEventListener("gestureend", preventDblTapZoom, { passive: false });

    // Prevent ctrl+scroll zoom on desktop
    const preventWheelZoom = (e) => { if (e.ctrlKey) e.preventDefault(); };
    document.addEventListener("wheel", preventWheelZoom, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventZoom);
      document.removeEventListener("gesturestart", preventDblTapZoom);
      document.removeEventListener("gesturechange", preventDblTapZoom);
      document.removeEventListener("gestureend", preventDblTapZoom);
      document.removeEventListener("wheel", preventWheelZoom);
    };
  }, []);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.email) {
        const fetchUnread = () =>
          base44.entities.Notification.filter({ recipient_email: u.email, is_read: false }, "-created_date", 50)
            .then((ns) => setUnreadCount(ns.length))
            .catch(() => {});
        fetchUnread();
        const unsub = base44.entities.Notification.subscribe((event) => {
          if (event.data?.recipient_email === u.email || event.type === "update") {
            fetchUnread();
          }
        });
        return unsub;
      }
    }).catch(() => {});
  }, []);

  const [swipeMode, setSwipeMode] = useState(false);

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY.current;
        if (diff > 6 && currentY > 80) {
          setNavVisible(false);
        } else if (diff < -4) {
          setNavVisible(true);
        }
        lastScrollY.current = currentY;
        scrollTicking.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = () => { setShowVerifyBanner(true); setTimeout(() => setShowVerifyBanner(false), 5000); };
    window.addEventListener("show_verify_banner", handler);
    return () => window.removeEventListener("show_verify_banner", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setSwipeMode(e.detail?.active ?? false);
    window.addEventListener("swipemode", handler);
    return () => window.removeEventListener("swipemode", handler);
  }, []);

  const [statusViewerActive, setStatusViewerActive] = useState(false);
  const [postViewerActive, setPostViewerActive] = useState(false);
  
  useEffect(() => {
    const handler = (e) => setStatusViewerActive(e.detail?.active ?? false);
    window.addEventListener("statusviewermode", handler);
    return () => window.removeEventListener("statusviewermode", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setPostViewerActive(e.detail?.active ?? false);
    window.addEventListener("postviewermode", handler);
    return () => window.removeEventListener("postviewermode", handler);
  }, []);

  const isAdminPage = ADMIN_PAGES.includes(currentPageName);
  const hideNav = statusViewerActive || postViewerActive || swipeMode || isAdminPage || ["PostDetail", "LiveRoomView", "GamePlay", "DiscoverForum", "Shop", "swipe", "ArtStudio", "PostComments", "Live", "CreatePostFlow", "StatusViewer", "Messages", "EditProfile", "Settings"].includes(currentPageName);

  const showSidebars = !isAdminPage && !hideNav;

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(circle at top left, rgba(79, 70, 229, 0.08), transparent 34%), radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.08), transparent 30%), var(--bg-app)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", overflowX: "clip", width: "100%", maxWidth: "100%" }}>

      {/* Left sidebar — desktop only */}
      {showSidebars && <LeftSidebar currentPageName={currentPageName} unreadCount={unreadCount} />}

      {/* Right sidebar — desktop only */}
      {showSidebars && <RightSidebar />}

      {/* Main content — offset by sidebars on large screens */}
      <div
        className={isAdminPage ? "w-full relative" : "relative"}
        style={{
          paddingBottom: hideNav ? 0 : "72px",
          minHeight: "100dvh",
          overflowX: "clip",
          maxWidth: isAdminPage ? "100%" : undefined,
          width: "100%",
        }}
        data-page={currentPageName}
      >
        {/* Inner content width cap */}
        <div
          className={
            isAdminPage
              ? "w-full"
              : showSidebars
              ? "lg:ml-60 xl:mr-64"
              : "max-w-lg mx-auto"
          }
          style={
            !isAdminPage && !showSidebars
              ? { maxWidth: WIDE_PAGES.includes(currentPageName) ? "1400px" : "512px" }
              : {}
          }
        >
        <div className="app-page-shell">
          {children}
        </div>
        </div>
      </div>

      {!hideNav &&
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden fixed-bottom-safe"
        style={{
          backgroundColor: "var(--bg-nav)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border-light)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
          height: "64px",
          maxWidth: "100vw",
          overflow: "hidden",
          transform: navVisible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}>
          <div className="max-w-lg mx-auto flex justify-around items-center h-full px-1" style={{ maxWidth: "min(512px, 100vw)" }}>
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              const showBadge = item.page === "Notifications" && unreadCount > 0;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={isActive ? (e) => { e.preventDefault(); navigate(createPageUrl(item.page), { replace: true }); } : undefined}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-200 relative"
                  style={{
                    color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 400,
                    minWidth: 52,
                    minHeight: 52,
                    flex: 1,
                  }}>
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                  {showBadge &&
                    <span style={{ position: "absolute", top: 6, right: "50%", transform: "translateX(10px)", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#E05C7A", border: "2px solid var(--bg-nav)" }} />
                  }
                  <span className="text-[11px] font-semibold tracking-wide leading-none">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      }

      <MiniPlayerWrapper />
    </div>);

}