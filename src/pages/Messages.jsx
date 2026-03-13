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
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="w-full rounded-t-[28px]" style={{ backgroundColor: "var(--bg-card)", maxHeight: "80dvh", overflow: "hidden", boxShadow: "var(--elevation-5)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-light)" }}>
          <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>New Chat</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-light)" }}>
          <div className="flex items-center gap-2 px-3 py-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <Search className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} autoFocus />
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="shrink-0 px-4 pt-4 pb-3" style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 16px)" }}>
        <div className="rounded-[28px] px-4 py-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl("Profile")} className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}>
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Messages</h1>
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>Private chats and group conversations</p>
              </div>
            </div>
            <button onClick={() => setShowNewMsg(true)} className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: "var(--accent-primary)", boxShadow: "var(--elevation-1)" }}>
              <Edit3 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-3" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
            <Search className="w-4 h-4" />
            <span className="text-sm">Search conversations</span>
          </div>

          <div className="flex gap-2">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-sm font-semibold text-center rounded-2xl transition-all"
                style={{
                  backgroundColor: activeTab === tab ? "var(--accent-primary)" : "var(--bg-subtle)",
                  color: activeTab === tab ? "#fff" : "var(--text-secondary)",
                }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
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