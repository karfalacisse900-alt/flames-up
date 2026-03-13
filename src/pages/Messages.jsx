import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Search, Send, Sparkles } from "lucide-react";
import ConversationListItem from "@/components/messages/ConversationListItem";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["direct-messages", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const all = await base44.entities.DirectMessage.list("-created_date", 120);
      return all.filter((item) => item.sender_email === user.email || item.receiver_email === user.email);
    },
    initialData: [],
  });

  const conversations = useMemo(() => {
    if (!user?.email) return [];
    const map = new Map();
    messages.forEach((item) => {
      const otherEmail = item.sender_email === user.email ? item.receiver_email : item.sender_email;
      const otherName = item.sender_email === user.email ? (item.receiver_name || item.receiver_email) : (item.sender_name || item.sender_email);
      if (!map.has(item.conversation_id)) {
        map.set(item.conversation_id, {
          id: item.conversation_id,
          email: otherEmail,
          name: otherName || "Conversation",
          preview: item.text || "Shared media",
          messages: [],
        });
      }
      map.get(item.conversation_id).messages.push(item);
    });
    return Array.from(map.values());
  }, [messages, user]);

  const filteredConversations = useMemo(() => conversations.filter((item) => item.name?.toLowerCase().includes(search.toLowerCase())), [conversations, search]);
  const activeConversation = filteredConversations.find((item) => item.id === selectedId) || filteredConversations[0];

  useEffect(() => {
    if (!selectedId && filteredConversations[0]) setSelectedId(filteredConversations[0].id);
  }, [filteredConversations, selectedId]);

  const handleSend = async () => {
    if (!user || !activeConversation || !draft.trim()) return;
    await base44.entities.DirectMessage.create({
      conversation_id: activeConversation.id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      receiver_email: activeConversation.email,
      text: draft.trim(),
      message_type: "text",
      is_read: false,
    });
    setDraft("");
    refetch();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <section className="overflow-hidden rounded-[40px] border" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(20,184,166,0.08), #fff)", borderColor: "rgba(148,163,184,0.18)", boxShadow: "var(--elevation-4)" }}>
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.74)", color: "var(--accent-primary)" }}>
              <Sparkles className="h-3.5 w-3.5" /> Messages redesigned
            </div>
            <h1 className="mt-6 h1" style={{ color: "var(--text-primary)" }}>A workspace, not a stacked inbox</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 md:text-base" style={{ color: "var(--text-secondary)" }}>The structure now separates discovery, selection, and conversation so the page feels broader and more intentional.</p>
          </div>
          <div className="grid gap-4 p-6 md:p-8 md:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[28px] border p-5" style={{ backgroundColor: "rgba(255,255,255,0.78)", borderColor: "rgba(148,163,184,0.16)" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Conversations</div>
              <div className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{conversations.length}</div>
            </div>
            <div className="rounded-[28px] border p-5" style={{ backgroundColor: "rgba(255,255,255,0.78)", borderColor: "rgba(148,163,184,0.16)" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Messages</div>
              <div className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{messages.length}</div>
            </div>
            <div className="rounded-[28px] border p-5" style={{ backgroundColor: "rgba(255,255,255,0.78)", borderColor: "rgba(148,163,184,0.16)" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Selected</div>
              <div className="mt-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{activeConversation?.name || "No chat"}</div>
            </div>
          </div>
        </div>
      </section>

      {!user ? (
        <div className="rounded-[32px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
          <p style={{ color: "var(--text-secondary)" }}>Log in to view your conversations.</p>
        </div>
      ) : (
        <>
          <section className="rounded-[34px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="h3" style={{ color: "var(--text-primary)" }}>Choose a conversation</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>A card grid replaces the old inbox list.</p>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-hint)" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" className="w-full pl-11 pr-4 py-3 text-sm" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredConversations.map((conversation) => (
                <ConversationListItem key={conversation.id} conversation={conversation} isActive={activeConversation?.id === conversation.id} onClick={() => setSelectedId(conversation.id)} />
              ))}
              {!filteredConversations.length ? <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No conversations yet.</p> : null}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_280px]">
            <div className="overflow-hidden rounded-[36px] border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-3)" }}>
              {activeConversation ? (
                <>
                  <div className="border-b px-6 py-5" style={{ borderColor: "var(--border-light)", background: "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(20,184,166,0.05))" }}>
                    <h2 className="h4" style={{ color: "var(--text-primary)" }}>{activeConversation.name}</h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Focused conversation stage</p>
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="rounded-[30px] p-4 md:p-5" style={{ background: "linear-gradient(180deg, rgba(248,250,252,0.95), rgba(241,245,249,0.82))" }}>
                      <div className="grid gap-3 max-h-[460px] overflow-y-auto pr-1">
                        {activeConversation.messages.slice().reverse().map((item) => {
                          const mine = item.sender_email === user.email;
                          return (
                            <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                              <div className="max-w-[85%] rounded-[24px] px-4 py-3 text-sm leading-7" style={{ backgroundColor: mine ? "var(--accent-primary)" : "white", color: mine ? "white" : "var(--text-primary)", boxShadow: "var(--elevation-1)" }}>
                                {item.text || "Shared media"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-5 flex gap-3 border-t pt-4" style={{ borderColor: "var(--border-light)" }}>
                      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message" className="flex-1 px-4 py-3 text-sm" />
                      <button onClick={handleSend} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
                        <Send className="h-4 w-4" /> Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center p-6">
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-8 w-8" style={{ color: "var(--accent-primary)" }} />
                    <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>Choose a conversation to start reading messages.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <div className="rounded-[30px] border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-1)" }}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Current chat</div>
                <p className="mt-3 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{activeConversation?.name || "No chat selected"}</p>
              </div>
              <div className="rounded-[30px] border p-5" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.10), rgba(20,184,166,0.08))", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-1)" }}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Why this is different</div>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>The old inbox list is gone — this now uses a selection gallery plus a single large conversation stage.</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}