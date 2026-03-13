import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Edit3, ArrowLeft, MessageSquare, Users, Inbox, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import ConversationListTab from "../components/messages/ConversationListTab";
import GroupsTab from "../components/messages/GroupsTab";
import DMChatView from "../components/messages/DMChatView";
import GroupChatView from "../components/messages/GroupChatView";
import { useQuery } from "@tanstack/react-query";

const COLORS = ["#25D366", "#128C7E", "#075E54", "#34B7F1", "#7B68EE", "#FF6B6B"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

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
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl" style={{ backgroundColor: "#fff", maxHeight: "80dvh", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F0F0F0" }}>
          <h3 className="font-bold text-lg" style={{ color: "#111" }}>New Chat</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F5F5F5" }}>
            <X className="w-4 h-4" style={{ color: "#666" }} />
          </button>
        </div>
        <div className="px-4 py-3 border-b" style={{ borderColor: "#F0F0F0" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: "#F5F5F5" }}>
            <Search className="w-4 h-4" style={{ color: "#999" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#111" }} autoFocus />
          </div>
        </div>
        <div style={{ overflowY: "auto", maxHeight: "55dvh" }}>
          {filtered.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "#999" }}>
              {follows.length === 0 ? "Follow someone to start chatting" : "No contacts found"}
            </p>
          ) : filtered.map(f => (
            <button key={f.email} onClick={() => { onSelect({ type: "dm", data: { email: f.email, name: f.name } }); onClose(); }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
              style={{ borderBottom: "1px solid #F9F9F9" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ backgroundColor: avatarColor(f.email), color: "#fff" }}>
                {f.name[0]?.toUpperCase()}
              </div>
              <p className="font-medium text-[15px]" style={{ color: "#111" }}>{f.name}</p>
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

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const withEmail = params.get("with");
    const withName = params.get("name");
    if (withEmail) setActiveChat({ type: "dm", data: { email: withEmail, name: getName(withName, withEmail) } });
  }, []);

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#fff" }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#25D366", borderTopColor: "transparent" }} />
    </div>
  );

  if (activeChat?.type === "dm") return <DMChatView user={user} conversation={activeChat.data} onBack={() => setActiveChat(null)} />;
  if (activeChat?.type === "group") return <GroupChatView user={user} group={activeChat.data} onBack={() => setActiveChat(null)} />;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fff" }}>
      {/* Header */}
      <div className="shrink-0"
        style={{ backgroundColor: "#075E54", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Profile")}>
              <ArrowLeft className="w-5 h-5" style={{ color: "#fff" }} />
            </Link>
            <h1 className="text-xl font-bold" style={{ color: "#fff", letterSpacing: 0.3 }}>Messages</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNewMsg(true)}>
              <Edit3 className="w-5 h-5" style={{ color: "#fff" }} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <Search className="w-4 h-4" style={{ color: "rgba(255,255,255,0.7)" }} />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Search…</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-2">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 text-sm font-semibold text-center transition-all"
              style={{
                color: "#fff",
                borderBottom: activeTab === tab ? "3px solid #25D366" : "3px solid transparent",
                opacity: activeTab === tab ? 1 : 0.65,
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "Groups" ? (
          <GroupsTab user={user} onSelect={setActiveChat} />
        ) : (
          <ConversationListTab user={user} tab={activeTab === "Requests" ? "requests" : "all"} onSelect={setActiveChat} />
        )}
      </div>

      {showNewMsg && <NewMessageSheet user={user} onSelect={setActiveChat} onClose={() => setShowNewMsg(false)} />}
    </div>
  );
}