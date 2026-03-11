import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Edit, Users, MessageCircle, Inbox } from "lucide-react";
import ConversationList from "@/components/messaging/ConversationList";
import ChatView from "@/components/messaging/ChatView";
import CreateGroupModal from "@/components/messaging/CreateGroupModal";

const TABS = [
  { id: "all", label: "All", icon: MessageCircle },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "groups", label: "Groups", icon: Users },
];

export default function Messages() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [activeConversation, setActiveConversation] = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => { base44.auth.redirectToLogin(); });
  }, []);

  // Check for URL param to open a specific conversation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const withEmail = params.get("with");
    const withName = params.get("name");
    const withAvatar = params.get("avatar");
    if (withEmail && user?.email) {
      const convId = [user.email, withEmail].sort().join("_");
      setActiveConversation({
        id: convId,
        type: "dm",
        otherEmail: withEmail,
        otherName: decodeURIComponent(withName || withEmail),
        otherAvatar: withAvatar ? decodeURIComponent(withAvatar) : "",
      });
    }
  }, [user?.email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // Full-screen chat on mobile when a conversation is selected
  if (activeConversation) {
    return (
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "var(--bg-app)" }}>
        <ChatView
          user={user}
          conversation={activeConversation}
          onBack={() => setActiveConversation(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), 48px)",
          paddingBottom: 12,
          backgroundColor: "var(--bg-card)",
          borderBottom: "1px solid var(--border-light)",
        }}>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Messages</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowNewGroup(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <Users className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
          <button onClick={() => {
            const email = prompt("Enter email or username to message:");
            if (email && user?.email) {
              const convId = [user.email, email.trim()].sort().join("_");
              setActiveConversation({ id: convId, type: "dm", otherEmail: email.trim(), otherName: email.trim(), otherAvatar: "" });
            }
          }} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <Edit className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-3 pb-1 gap-2 flex-shrink-0">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? "var(--accent-primary)" : "var(--bg-card)",
              color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${activeTab === tab.id ? "var(--accent-primary)" : "var(--border-light)"}`,
            }}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === "requests" && requestCount > 0 && (
              <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                {requestCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-hidden">
        <ConversationList
          user={user}
          activeTab={activeTab}
          activeConvId={activeConversation?.id}
          onSelectConversation={setActiveConversation}
        />
      </div>

      {showNewGroup && (
        <CreateGroupModal
          user={user}
          onClose={() => setShowNewGroup(false)}
          onCreate={group => {
            setShowNewGroup(false);
            setActiveConversation({ id: group.id, type: "group", name: group.name, photo: group.photo_url, group });
            setActiveTab("groups");
          }}
        />
      )}
    </div>
  );
}