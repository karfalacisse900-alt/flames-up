import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Home, Palette, User, Search, Flame, Users } from "lucide-react";
import AppAIAssistant from "@/components/AppAIAssistant";
import MiniPlayerWrapper from "@/components/discover/MiniPlayerWrapper.jsx";
import { useLayoutStabilizer } from "@/components/hooks/useLayoutStabilizer";

const navItems = [
{ name: "Home",    icon: Home,    page: "Home" },
{ name: "Discover", icon: Search,  page: "Discover" },
{ name: "Groups",  icon: Users,   page: "Groups" },
{ name: "Gallery", icon: Palette, page: "Gallery" },
{ name: "Profile", icon: User,    page: "Profile" },
];

const ADMIN_PAGES = ["AdminContentManager", "AdminAnalytics", "AdminModeration"];
const WIDE_PAGES = ["Gallery", "Discover", "WeeklyChallenges", "HallOfFame", "Art", "ArtStudio", "Explore", "Groups"];


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

  const isAdminPage = ADMIN_PAGES.includes(currentPageName);
  const hideNav = swipeMode || isAdminPage || ["PostDetail", "LiveRoomView", "GamePlay", "DiscoverForum", "Shop", "swipe", "ArtStudio", "PostComments", "Live"].includes(currentPageName);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", overflowX: "hidden", width: "100%", maxWidth: "100%" }}>
        <div
      className={isAdminPage ? "w-full relative" : "relative"}
      style={{
        paddingBottom: hideNav ? 0 : "72px",
        minHeight: "100dvh",
        overflowX: "hidden",
        maxWidth: isAdminPage ? "100%" : WIDE_PAGES.includes(currentPageName) ? "1400px" : "512px",
        width: "100%",
        marginLeft: "auto",
        marginRight: "auto",
      }}
      data-page={currentPageName}
    >
          {children}
        </div>

      {!hideNav &&
      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: "var(--bg-nav)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border-light)", paddingBottom: "env(safe-area-inset-bottom, 0px)", height: "64px", maxWidth: "100vw", overflow: "hidden" }}>
          <div className="max-w-lg mx-auto flex justify-around items-center h-full px-2" style={{ maxWidth: "min(512px, 100vw)" }}>
                {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                const showBadge = item.page === "Notifications" && unreadCount > 0;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.page)}
                    onClick={isActive ? (e) => { e.preventDefault(); navigate(createPageUrl(item.page), { replace: true }); } : undefined}
                    className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 relative"
                    style={{ color: isActive ? "var(--accent-primary)" : "var(--text-secondary)", fontWeight: isActive ? 600 : 400 }}>

                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                  {showBadge &&
                <span style={{ position: "absolute", top: 2, right: 4, width: 8, height: 8, borderRadius: "50%", backgroundColor: "#E05C7A", border: "2px solid var(--bg-nav)" }} />
                }
                  <span className="text-[11px] font-semibold tracking-wide">{item.name}</span>
                </Link>);

          })}
          </div>
        </nav>
      }

      {!hideNav && <AppAIAssistant />}
      <MiniPlayerWrapper />
    </div>);

}