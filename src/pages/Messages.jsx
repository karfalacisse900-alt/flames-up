import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Edit, MessageSquare, Users, Inbox, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import ConversationListTab from "../components/messages/ConversationListTab";
import GroupsTab from "../components/messages/GroupsTab";
import DMChatView from "../components/messages/DMChatView";
import GroupChatView from "../components/messages/GroupChatView";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const TABS = [
  { key: "all", label: "All", icon: MessageSquare },
  { key: "requests", label: "Requests", icon: Inbox },
  { key: "groups", label: "Groups", icon: Users },
];

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
      return Object.entries(map).map(([email, name]) => ({ email, name }));
    },
    enabled: !!user?.email,
  });

  const filtered = follows.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.email.includes(search)
  );

  const COLORS = ["#2E6B4F", "#D98B62", "#6B4F2E", "#4A6B9F", "#8B4F6B"];
  const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-4" style={{ backgroundColor: "var(--bg-modal)", maxHeight: "75dvh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mb-4" style={{ backgroundColor: "var(--border-medium)" }} />
        <p className="font-bold mb-3" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>New Message</p>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people…"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        {filtered.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--text-hint)" }}>
            {follows.length === 0 ? "Follow someone to start a conversation" : "No results"}
          </p>
        ) : filtered.map(f => (
          <button key={f.email} onClick={() => { onSelect({ type: "dm", data: { email: f.email, name: f.name } }); onClose(); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl mb-1 text-left"
            style={{ backgroundColor: "var(--bg-subtle)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ backgroundColor: avatarColor(f.email), color: "#fff" }}>
              {f.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.name}</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>{f.email}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Messages() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [activeChat, setActiveChat] = useState(null); // { type: "dm"|"group", data: {...} }
  const [showNewMsg, setShowNewMsg] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Deep link: ?with=email&name=name
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const withEmail = params.get("with");
    const withName = params.get("name");
    if (withEmail) setActiveChat({ type: "dm", data: { email: withEmail, name: withName || withEmail } });
  }, []);

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  // Show active chat
  if (activeChat) {
    if (activeChat.type === "dm") {
      return (
        <DMChatView
          user={user}
          conversation={activeChat.data}
          onBack={() => setActiveChat(null)}
        />
      );
    }
    if (activeChat.type === "group") {
      return (
        <GroupChatView
          user={user}
          group={activeChat.data}
          onBack={() => setActiveChat(null)}
        />
      );
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-40"
        style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to={createPageUrl("Profile")} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-subtle)" }}>
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
          </Link>
          <h2 className="font-bold flex-1 text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            Messages
          </h2>
          <button onClick={() => setShowNewMsg(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            <Edit className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-0 gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-xl whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeTab === key ? "var(--accent-primary)" : "transparent",
                color: activeTab === key ? "#fff" : "var(--text-secondary)",
              }}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="pt-3 pb-28">
        {activeTab === "groups" ? (
          <GroupsTab user={user} onSelect={setActiveChat} />
        ) : (
          <ConversationListTab user={user} tab={activeTab} onSelect={setActiveChat} />
        )}
      </div>

      {showNewMsg && (
        <NewMessageSheet user={user} onSelect={setActiveChat} onClose={() => setShowNewMsg(false)} />
      )}
    </div>
  );
}