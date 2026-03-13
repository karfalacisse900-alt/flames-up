import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Search, Send, Sparkles } from "lucide-react";
import PageIntroCard from "@/components/shared/PageIntroCard";
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
      <PageIntroCard eyebrow="Messages redesign" title="More like a communication studio" description="This version uses a wider composition, floating conversation cards, and a stronger split between inbox, chat, and contact focus." />

      {!user ? (
        <div className="rounded-[30px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <p style={{ color: "var(--text-secondary)" }}>Log in to view your conversations.</p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] p-5" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(79,70,229,0.04))" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Inbox</div>
              <div className="mt-3 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{conversations.length}</div>
            </div>
            <div className="rounded-[28px] p-5" style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(20,184,166,0.04))" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Messages</div>
              <div className="mt-3 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{messages.length}</div>
            </div>
            <div className="rounded-[28px] p-5" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.06), rgba(15,23,42,0.02))" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Style</div>
              <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}><Sparkles className="h-4 w-4" /> Less list-heavy</div>
            </div>
          </section>

          <div className="flex gap-3 overflow-x-auto pb-1 xl:hidden">
            {filteredConversations.map((conversation) => (
              <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: activeConversation?.id === conversation.id ? "var(--accent-primary)" : "var(--bg-subtle)", color: activeConversation?.id === conversation.id ? "white" : "var(--text-secondary)" }}>
                {conversation.name}
              </button>
            ))}
          </div>

          <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_280px]">
            <div className="hidden xl:block rounded-[32px] border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
              <div className="relative mb-5">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-hint)" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" className="w-full pl-11 pr-4 py-3 text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {filteredConversations.map((conversation) => (
                  <ConversationListItem key={conversation.id} conversation={conversation} isActive={activeConversation?.id === conversation.id} onClick={() => setSelectedId(conversation.id)} />
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border p-5 md:p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
              {activeConversation ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border-light)" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl font-bold" style={{ backgroundColor: "rgba(79,70,229,0.12)", color: "var(--accent-primary)" }}>
                        {activeConversation.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="h4" style={{ color: "var(--text-primary)" }}>{activeConversation.name}</h2>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Focused conversation view</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 max-h-[460px] overflow-y-auto pr-1">
                    {activeConversation.messages.slice().reverse().map((item) => {
                      const mine = item.sender_email === user.email;
                      return (
                        <div key={item.id} className={`flex ${mine ? "justify-end md:col-start-2 xl:col-start-auto" : "justify-start"}`}>
                          <div className="max-w-[92%] rounded-[24px] px-4 py-3 text-sm leading-6" style={{ backgroundColor: mine ? "var(--accent-primary)" : "var(--bg-subtle)", color: mine ? "white" : "var(--text-primary)", boxShadow: "var(--elevation-1)" }}>
                            {item.text || "Shared media"}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 border-t pt-4" style={{ borderColor: "var(--border-light)" }}>
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message" className="flex-1 px-4 py-3 text-sm" />
                    <button onClick={handleSend} className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "var(--accent-primary)", color: "white" }}>
                      <Send className="h-4 w-4" /> Send
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center rounded-[24px]" style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-8 w-8" style={{ color: "var(--accent-primary)" }} />
                    <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>Choose a conversation to start reading messages.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[32px] border p-5" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-1)" }}>
              <h3 className="h4" style={{ color: "var(--text-primary)" }}>Conversation focus</h3>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>The layout is now wider and more magazine-like, with the inbox separated from the active chat so it doesn’t read like one long stacked list.</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}