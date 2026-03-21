import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Edit3, Search, X, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import ConversationListTab from "../components/messages/ConversationListTab";
import GroupsTab from "../components/messages/GroupsTab";
import DMChatView from "../components/messages/DMChatView";
import GroupChatView from "../components/messages/GroupChatView";
import { useQuery } from "@tanstack/react-query";
import { usePullToRefresh } from "@/components/hooks/usePullToRefresh";
import { useRef, useMemo } from "react";

const COLORS = ["#25D366", "#128C7E", "#075E54", "#34B7F1", "#7B68EE", "#FF6B6B"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

function StoryAvatar({ name, email, avatarUrl, isLive }) {
  const initials = (name || "?")[0]?.toUpperCase();
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 64 }}>
      <div className="relative">
        <div
          className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold"
          style={{
            background: avatarUrl ? "transparent" : `linear-gradient(135deg, ${avatarColor(email)}, ${avatarColor(email)}bb)`,
            color: "#fff",
            border: isLive ? "2.5px solid #FF3B3B" : "2.5px solid transparent",
            boxShadow: isLive ? "0 0 0 2px #FF3B3B33" : "none",
          }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            : initials}
        </div>
        {isLive && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: "#FF3B3B", transform: "translateX(-50%) translateY(30%)" }}>
            Live
          </div>
        )}
      </div>
      <p className="text-[11px] font-medium truncate text-center w-full" style={{ color: "var(--text-secondary)" }}>{name}</p>
    </div>
  );
}

function StoriesRow({ user }) {
  const { data: following = [] } = useQuery({
    queryKey: ["storiesFollowing", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: liveRooms = [] } = useQuery({
    queryKey: ["activeLiveRooms"],
    queryFn: () => base44.entities.LiveRoom.filter({ is_active: true }),
    staleTime: 30000,
  });

  const liveEmails = new Set(liveRooms.map(r => r.host_email));

  if (following.length === 0) return null;

  return (
    <div className="px-4 py-3 flex gap-4 overflow-x-auto scrollbar-hide">
      {following.slice(0, 12).map(f => (
        <StoryAvatar
          key={f.following_email}
          name={getName(f.following_name, f.following_email)}
          email={f.following_email}
          avatarUrl={null}
          isLive={liveEmails.has(f.following_email)}
        />
      ))}
    </div>
  );
}

function NewMessageSheet({ user, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const { data: follows = [] } = useQuery({
    queryKey: ["msgFollows", user?.email],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.Follow.filter({ follower_email: user.email }),
        base44.entities.Follow.filter({ following_email: user.email }),
      ]);
      const map = {};
      sent.forEach(f => { map[f.following_email] = f.following_name || f.following_email; });
      received.forEach(f => { map[f.follower_email] = f.follower_name || f.follower_email; });
      return Object.entries(map).map(([email, name]) => ({ email, name: getName(name, email) }));
    },
    enabled: !!user?.email,
  });

  const filtered = follows.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="w-full rounded-t-[28px]" style={{ backgroundColor: "var(--bg-card)", maxHeight: "80dvh", overflow: "hidden", boxShadow: "var(--elevation-5)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-light)" }}>
          <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>New Chat</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-light)" }}>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <Search className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} autoFocus />
          </div>
        </div>
        <div style={{ overflowY: "auto", maxHeight: "55dvh" }}>
          {filtered.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--text-hint)" }}>
              {follows.length === 0 ? "Follow someone to start chatting" : "No contacts found"}
            </p>
          ) : filtered.map(f => (
            <button key={f.email} onClick={() => { onSelect({ type: "dm", data: { email: f.email, name: f.name } }); onClose(); }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${avatarColor(f.email)}, ${avatarColor(f.email)}bb)`, color: "#fff" }}>
                {f.name[0]?.toUpperCase()}
              </div>
              <p className="font-semibold text-[15px]" style={{ color: "var(--text-primary)" }}>{f.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const TABS = ["All", "Groups", "Requests"];

export default function Messages() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [activeChat, setActiveChat] = useState(null);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const { containerProps, RefreshIndicator } = usePullToRefresh(() => {
    window.location.reload();
  });

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const withEmail = params.get("with");
    const withName = params.get("name");
    if (withEmail) setActiveChat({ type: "dm", data: { email: withEmail, name: getName(withName, withEmail) } });
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      Object.assign(containerRef.current, containerProps);
    }
  }, [containerProps]);

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (activeChat?.type === "dm") return <DMChatView user={user} conversation={activeChat.data} onBack={() => setActiveChat(null)} />;
  if (activeChat?.type === "group") return <GroupChatView user={user} group={activeChat.data} onBack={() => setActiveChat(null)} />;

  return (
     <div ref={containerRef} className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)" }}>
       <RefreshIndicator />
       {/* Header */}
       <div
         className="shrink-0 px-5 pt-5 pb-3"
         style={{
           paddingTop: "max(env(safe-area-inset-top, 0px), 20px)",
           backgroundColor: "var(--bg-app)",
         }}
       >
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
             <button onClick={() => window.history.back()} style={{ minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-primary)" }}>
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
               </svg>
             </button>
             <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
               Messages
             </h1>
           </div>
          <div className="flex items-center gap-2">
            <Link
              to={createPageUrl("Notifications")}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
            >
              <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18, color: "var(--text-secondary)" }} />
            </Link>
            <button
              onClick={() => setShowNewMsg(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
            >
              <Edit3 className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-4"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeTab === tab ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeTab === tab ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${activeTab === tab ? "var(--accent-primary)" : "var(--border-light)"}`,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stories row — only on "All" tab */}
      {activeTab === "All" && (
        <div style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)" }}>
          <StoriesRow user={user} />
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
        {activeTab === "Groups" ? (
          <GroupsTab user={user} onSelect={setActiveChat} />
        ) : (
          <ConversationListTab
            user={user}
            tab={activeTab === "Requests" ? "requests" : "all"}
            onSelect={setActiveChat}
            searchQuery={searchQuery}
          />
        )}
      </div>

      {showNewMsg && <NewMessageSheet user={user} onSelect={setActiveChat} onClose={() => setShowNewMsg(false)} />}
    </div>
  );
}