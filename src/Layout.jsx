import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Home, Compass, Palette, Radio, User, Bell, Search, Menu, X } from "lucide-react";
import AppAIAssistant from "@/components/AppAIAssistant";

const navItems = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Discover", icon: Search, page: "Discover" },
  { name: "Gallery", icon: Palette, page: "Gallery" },
  { name: "Live", icon: Radio, page: "Live" },
  { name: "Alerts", icon: Bell, page: "Notifications" },
  { name: "Profile", icon: User, page: "Profile" },
];

function EmailVerificationBanner({ onDismiss }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-900">
      Please verify your email address. <button onClick={onDismiss} className="underline font-semibold">Dismiss</button>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [screenSize, setScreenSize] = useState("desktop");
  const [swipeMode, setSwipeMode] = useState(false);

  // Track screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize("mobile");
      else if (width < 1024) setScreenSize("tablet");
      else if (width < 1200) setScreenSize("laptop");
      else setScreenSize("desktop");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch user and notifications
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
          if (event.data?.recipient_email === u.email || event.type === "update") fetchUnread();
        });
        return unsub;
      }
    }).catch(() => {});
  }, []);

  // Handle verify banner
  useEffect(() => {
    const handler = () => { setShowVerifyBanner(true); setTimeout(() => setShowVerifyBanner(false), 5000); };
    window.addEventListener("show_verify_banner", handler);
    return () => window.removeEventListener("show_verify_banner", handler);
  }, []);

  // Handle swipe mode
  useEffect(() => {
    const handler = (e) => setSwipeMode(e.detail?.active ?? false);
    window.addEventListener("swipemode", handler);
    return () => window.removeEventListener("swipemode", handler);
  }, []);

  const hideNav = swipeMode || ["PostDetail", "LiveRoomView", "GamePlay", "DiscoverForum", "Shop", "swipe", "ArtStudio", "PostComments"].includes(currentPageName);
  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";
  const isDesktopOrLaptop = !isMobile && !isTablet;

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPageName]);

  // Sidebar nav component
  const SidebarContent = ({ mobile = false }) => (
    <div className={`flex flex-col gap-2 ${mobile ? "p-4" : "p-3"}`}>
      {navItems.map((item) => {
        const isActive = currentPageName === item.page;
        const showBadge = item.page === "Notifications" && unreadCount > 0;
        return (
          <Link
            key={item.name}
            to={createPageUrl(item.page)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative group ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            style={{
              color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
              backgroundColor: isActive ? "var(--accent-primary-light)" : "transparent",
            }}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
            {!mobile && <span className="font-medium text-sm">{item.name}</span>}
            {showBadge && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
      {/* Top bar for tablet/mobile with hamburger */}
      {!isDesktopOrLaptop && !hideNav && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "var(--bg-nav)", borderColor: "var(--border-light)" }}>
          <h1 className="font-semibold text-lg">App</h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Sidebar overlay for mobile/tablet */}
      {!isDesktopOrLaptop && sidebarOpen && !hideNav && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop/Laptop */}
      {isDesktopOrLaptop && !hideNav && (
        <div
          className="fixed left-0 top-0 h-screen w-64 z-40 overflow-y-auto transition-all duration-300"
          style={{ backgroundColor: "var(--bg-nav)", borderRight: "1px solid var(--border-light)" }}
        >
          <div className="p-4 border-b" style={{ borderColor: "var(--border-light)" }}>
            <h1 className="font-bold text-xl" style={{ color: "var(--accent-primary)" }}>App</h1>
          </div>
          <SidebarContent mobile={false} />
        </div>
      )}

      {/* Sidebar - Mobile/Tablet Drawer */}
      {!isDesktopOrLaptop && sidebarOpen && !hideNav && (
        <div
          className="fixed left-0 top-12 w-64 h-screen z-40 overflow-y-auto transition-all duration-300 md:hidden"
          style={{ backgroundColor: "var(--bg-nav)", borderRight: "1px solid var(--border-light)" }}
        >
          <SidebarContent mobile={true} />
        </div>
      )}

      {/* Main content - adjusted for sidebar */}
      <main className={`flex-1 transition-all duration-300 ${isDesktopOrLaptop && !hideNav ? "ml-64" : ""}`}>
        <div className={`w-full h-full ${!isDesktopOrLaptop && !hideNav ? "pb-24" : hideNav ? "pb-0" : "pb-20"}`}>
          {children}
        </div>
      </main>

      {/* Bottom navigation - Mobile only */}
      {isMobile && !hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t"
          style={{
            backgroundColor: "var(--bg-nav)",
            backdropFilter: "blur(20px)",
            borderColor: "var(--border-light)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            height: "64px",
          }}
        >
          <div className="flex justify-around items-center h-full px-2">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              const showBadge = item.page === "Notifications" && unreadCount > 0;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 relative"
                  style={{
                    color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                  {showBadge && (
                    <span style={{
                      position: "absolute",
                      top: 2,
                      right: 4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#E05C7A",
                      border: "2px solid var(--bg-nav)",
                    }} />
                  )}
                  <span className="text-[11px] font-semibold tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Verification banner */}
      {showVerifyBanner && <EmailVerificationBanner onDismiss={() => setShowVerifyBanner(false)} />}

      {/* AI Assistant */}
      {!hideNav && <AppAIAssistant />}
    </div>
  );
}