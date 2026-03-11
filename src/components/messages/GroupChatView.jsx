import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, Settings, UserPlus, UserMinus, X, Crown } from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChatInputBar from "./ChatInputBar";

const COLORS = ["#2E6B4F", "#D98B62", "#6B4F2E", "#4A6B9F", "#8B4F6B"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];

function GroupInfoSheet({ group, user, onClose, onUpdate }) {
  const isAdmin = group.admin_emails?.includes(user.email);

  const handleRemoveMember = async (email) => {
    if (!isAdmin || email === user.email) return;
    const updated = {
      member_emails: group.member_emails.filter(e => e !== email),
      member_names: { ...group.member_names },
    };
    delete updated.member_names[email];
    await base44.entities.GroupChat.update(group.id, updated);
    onUpdate({ ...group, ...updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-4" style={{ backgroundColor: "var(--bg-modal)", maxHeight: "75dvh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mb-4" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            {group.name}
          </h3>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>
        </div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>
          {group.member_emails?.length} Members
        </p>
        <div className="space-y-1">
          {(group.member_emails || []).map(email => {
            const name = group.member_names?.[email] || email;
            const isGrpAdmin = group.admin_emails?.includes(email);
            return (
              <div key={email} className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{ backgroundColor: "var(--bg-subtle)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: avatarColor(email), color: "#fff" }}>
                  {name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
                  {isGrpAdmin && (
                    <p className="text-[10px] font-semibold" style={{ color: "var(--accent-primary)" }}>Admin</p>
                  )}
                </div>
                {isAdmin && email !== user.email && (
                  <button onClick={() => handleRemoveMember(email)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(224,92,122,0.1)", color: "#E05C7A" }}>
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!group.member_emails?.includes(user.email) || (
          <button onClick={async () => {
            const updated = { member_emails: group.member_emails.filter(e => e !== user.email) };
            await base44.entities.GroupChat.update(group.id, updated);
            onClose();
          }}
            className="w-full mt-4 py-3 rounded-2xl font-semibold text-sm"
            style={{ backgroundColor: "rgba(224,92,122,0.08)", color: "#E05C7A" }}>
            Leave Group
          </button>
        )}
      </div>
    </div>
  );
}

export default function GroupChatView({ user, group: initialGroup, onBack }) {
  const [group, setGroup] = useState(initialGroup);
  const [replyTo, setReplyTo] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const endRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["groupMsg", group.id],
    queryFn: () => base44.entities.GroupMessage.filter({ group_id: group.id }, "created_date", 150),
    refetchInterval: 3000,
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const unsub = base44.entities.GroupMessage.subscribe((event) => {
      if (event.data?.group_id === group.id) {
        queryClient.invalidateQueries({ queryKey: ["groupMsg", group.id] });
      }
    });
    return unsub;
  }, [group.id, queryClient]);

  const createMsg = async (fields) => {
    const msg = await base44.entities.GroupMessage.create({
      group_id: group.id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      ...(replyTo ? { reply_to_id: replyTo.id, reply_preview: replyTo.text || "Voice message" } : {}),
      ...fields,
    });
    setReplyTo(null);
    // Update group last_message
    await base44.entities.GroupChat.update(group.id, {
      last_message: fields.text || (fields.audio_url ? "🎤 Voice" : fields.gif_url ? "GIF" : "📷 Media"),
      last_message_at: new Date().toISOString(),
      last_sender_name: user.full_name || user.email,
    });
    queryClient.invalidateQueries({ queryKey: ["groupMsg", group.id] });
    queryClient.invalidateQueries({ queryKey: ["myGroups", user.email] });
  };

  const handleReact = async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const reactions = { ...(msg.reactions || {}) };
    const existing = reactions[emoji] || [];
    if (existing.includes(user.email)) {
      reactions[emoji] = existing.filter(e => e !== user.email);
    } else {
      reactions[emoji] = [...existing, user.email];
    }
    await base44.entities.GroupMessage.update(msgId, { reactions });
    queryClient.invalidateQueries({ queryKey: ["groupMsg", group.id] });
  };

  const handleDelete = async (msgId) => {
    await base44.entities.GroupMessage.update(msgId, { is_deleted: true, text: "" });
    queryClient.invalidateQueries({ queryKey: ["groupMsg", group.id] });
  };

  return (
    <div className="flex flex-col" style={{ height: "100dvh", backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)", paddingTop: "max(env(safe-area-inset-top, 0px), 44px)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>
        <button onClick={() => setShowInfo(true)} className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: avatarColor(group.name), color: "#fff" }}>
            {group.photo_url
              ? <img src={group.photo_url} alt="" className="w-full h-full rounded-2xl object-cover" />
              : group.name?.[0]?.toUpperCase() || "G"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-left" style={{ color: "var(--text-primary)" }}>{group.name}</p>
            <p className="text-[11px] truncate text-left" style={{ color: "var(--text-hint)" }}>
              {group.member_emails?.length} members
            </p>
          </div>
        </button>
        <button onClick={() => setShowInfo(true)} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          <Users className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "none" }}>
        {messages.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>
              Start the conversation in {group.name}
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_email === user.email;
          const prevMsg = messages[i - 1];
          const showSender = !isMe && (!prevMsg || prevMsg.sender_email !== msg.sender_email);
          return (
            <div key={msg.id}>
              {showSender && (
                <p className="text-[11px] font-semibold mt-3 mb-0.5 ml-1"
                  style={{ color: avatarColor(msg.sender_email) }}>
                  {msg.sender_name || msg.sender_email}
                </p>
              )}
              <MessageBubble
                message={msg}
                isMe={isMe}
                user={user}
                onReply={setReplyTo}
                onReact={handleReact}
                onDelete={handleDelete}
              />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <ChatInputBar
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSendText={(text) => createMsg({ text, message_type: "text" })}
        onSendVoice={(audio_url) => createMsg({ audio_url, message_type: "voice", text: "" })}
        onSendMedia={(urls) => createMsg({ media_urls: urls, message_type: "image", text: "" })}
        onSendGif={(gif_url) => createMsg({ gif_url, message_type: "gif", text: "" })}
        onSendLocation={(loc) => createMsg({ location_data: loc, message_type: "location", text: "" })}
      />

      {showInfo && (
        <GroupInfoSheet group={group} user={user} onClose={() => setShowInfo(false)} onUpdate={setGroup} />
      )}
    </div>
  );
}