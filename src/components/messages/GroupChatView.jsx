import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, MoreVertical, Phone, Video, X, UserMinus, Crown, LogOut } from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChatInputBar from "./ChatInputBar";
import VideoCallModal from "./VideoCallModal";

const COLORS = ["#25D366", "#128C7E", "#075E54", "#9C27B0", "#FF5722", "#3F51B5", "#E91E63"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

function GroupInfoSheet({ group, user, onClose, onUpdate }) {
  const isAdmin = group.admin_emails?.includes(user.email);

  const handleRemove = async (email) => {
    if (!isAdmin || email === user.email) return;
    const updated = {
      member_emails: group.member_emails.filter(e => e !== email),
      member_names: { ...group.member_names },
    };
    delete updated.member_names[email];
    await base44.entities.GroupChat.update(group.id, updated);
    onUpdate({ ...group, ...updated });
  };

  const handleLeave = async () => {
    const updated = { member_emails: group.member_emails.filter(e => e !== user.email) };
    await base44.entities.GroupChat.update(group.id, updated);
    onClose("left");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={() => onClose()}>
      <div className="w-full rounded-t-3xl" style={{ backgroundColor: "#fff", maxHeight: "80dvh", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F0F0F0" }}>
          <div>
            <h3 className="font-bold text-lg" style={{ color: "#111" }}>{group.name}</h3>
            <p className="text-sm" style={{ color: "#999" }}>{group.member_emails?.length} members</p>
          </div>
          <button onClick={() => onClose()} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F5F5F5" }}>
            <X className="w-4 h-4" style={{ color: "#666" }} />
          </button>
        </div>

        {/* Members list */}
        <div style={{ overflowY: "auto", maxHeight: "55dvh" }}>
          {(group.member_emails || []).map((email) => {
            const name = getName(group.member_names?.[email], email);
            const isGrpAdmin = group.admin_emails?.includes(email);
            return (
              <div key={email} className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: "1px solid #F9F9F9" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                  style={{ backgroundColor: avatarColor(email), color: "#fff" }}>
                  {name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[15px]" style={{ color: "#111" }}>{name}</p>
                    {isGrpAdmin && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "#E8F5E9" }}>
                        <Crown className="w-2.5 h-2.5" style={{ color: "#25D366" }} />
                        <span className="text-[10px] font-bold" style={{ color: "#25D366" }}>Admin</span>
                      </div>
                    )}
                  </div>
                </div>
                {isAdmin && email !== user.email && (
                  <button onClick={() => handleRemove(email)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#FFEBEE" }}>
                    <UserMinus className="w-3.5 h-3.5" style={{ color: "#E53935" }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Leave button */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid #F0F0F0", paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}>
          <button onClick={handleLeave}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: "#FFEBEE", color: "#E53935" }}>
            <LogOut className="w-4 h-4" /> Leave Group
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupChatView({ user, group: initialGroup, onBack }) {
  const [group, setGroup] = useState(initialGroup);
  const [replyTo, setReplyTo] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
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
    await base44.entities.GroupMessage.create({
      group_id: group.id,
      sender_email: user.email,
      sender_name: getName(user.full_name, user.email),
      ...(replyTo ? { reply_to_id: replyTo.id, reply_preview: replyTo.text || "Voice message" } : {}),
      ...fields,
    });
    setReplyTo(null);
    await base44.entities.GroupChat.update(group.id, {
      last_message: fields.text || (fields.audio_url ? "🎤 Voice" : fields.gif_url ? "GIF" : "📷 Media"),
      last_message_at: new Date().toISOString(),
      last_sender_name: getName(user.full_name, user.email),
    });
    queryClient.invalidateQueries({ queryKey: ["groupMsg", group.id] });
    queryClient.invalidateQueries({ queryKey: ["myGroups", user.email] });
  };

  const handleReact = async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const reactions = { ...(msg.reactions || {}) };
    const existing = reactions[emoji] || [];
    reactions[emoji] = existing.includes(user.email) ? existing.filter(e => e !== user.email) : [...existing, user.email];
    await base44.entities.GroupMessage.update(msgId, { reactions });
    queryClient.invalidateQueries({ queryKey: ["groupMsg", group.id] });
  };

  const handleDelete = async (msgId) => {
    await base44.entities.GroupMessage.update(msgId, { is_deleted: true, text: "" });
    queryClient.invalidateQueries({ queryKey: ["groupMsg", group.id] });
  };

  const memberCount = group.member_emails?.length || 0;

  return (
    <>
      <div className="flex flex-col" style={{ height: "100dvh", background: "linear-gradient(180deg, #f8f5ff 0%, #eef2ff 45%, #ecfeff 100%)" }}>
        {/* Header */}
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 shrink-0 rounded-[24px]"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--elevation-2)",
            paddingTop: "max(env(safe-area-inset-top, 0px), 16px)",
            paddingBottom: 12,
          }}>
          <button onClick={onBack} className="p-1 mr-1">
            <ArrowLeft className="w-6 h-6" style={{ color: "var(--text-primary)" }} />
          </button>

          <button onClick={() => setShowInfo(true)} className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold shrink-0"
              style={{ background: `linear-gradient(135deg, ${avatarColor(group.name)}, #7C3AED)`, color: "#fff" }}>
              {group.photo_url
                ? <img src={group.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                : group.name?.[0]?.toUpperCase() || "G"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-[16px] truncate" style={{ color: "var(--text-primary)" }}>{group.name}</p>
              <p className="text-[12px]" style={{ color: "var(--text-hint)" }}>
                {memberCount} members
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <button className="w-9 h-9 flex items-center justify-center rounded-full" onClick={() => setShowVideoCall(true)} style={{ backgroundColor: "#f3ecff" }}>
              <Video className="w-5 h-5" style={{ color: "#7C3AED" }} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ backgroundColor: "#ecfeff" }}>
              <Phone className="w-5 h-5" style={{ color: "#0F766E" }} />
            </button>
            <div className="relative">
              <button className="w-9 h-9 flex items-center justify-center rounded-full" onClick={() => setShowMenu(v => !v)} style={{ backgroundColor: "#f8fafc" }}>
                <MoreVertical className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-10 z-50 rounded-xl shadow-xl overflow-hidden"
                    style={{ backgroundColor: "#fff", minWidth: 180 }}>
                    <button onClick={() => { setShowInfo(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-[14px]"
                      style={{ color: "#333", borderBottom: "1px solid #F5F5F5" }}>
                      <Users className="w-4 h-4" /> Group info
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-2 py-3" style={{ scrollbarWidth: "none" }}>
          <div className="flex justify-center mb-4">
            <div className="px-4 py-1.5 rounded-lg text-[12px] text-center"
              style={{ backgroundColor: "rgba(255,248,196,0.9)", color: "#7B6914" }}>
              🔒 Messages are private to this group
            </div>
          </div>

          {messages.length === 0 && (
            <div className="flex justify-center">
              <div className="px-5 py-3 rounded-2xl text-[13px]"
                style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#555" }}>
                👋 Say hello to <strong>{group.name}</strong>!
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMe = msg.sender_email === user.email;
            const prevMsg = messages[idx - 1];
            const showDate = !prevMsg || new Date(msg.created_date).toDateString() !== new Date(prevMsg.created_date).toDateString();
            const showSender = !isMe && (!prevMsg || prevMsg.sender_email !== msg.sender_email || showDate);
            const senderName = getName(msg.sender_name, msg.sender_email);

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-full text-[12px] font-medium"
                      style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#666" }}>
                      {new Date(msg.created_date).toDateString() === new Date().toDateString()
                        ? "Today"
                        : new Date(msg.created_date).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                    </span>
                  </div>
                )}
                {showSender && (
                  <p className="text-[12px] font-semibold mb-0.5 ml-1"
                    style={{ color: avatarColor(msg.sender_email) }}>
                    {senderName}
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
              </React.Fragment>
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
      </div>

      {showInfo && (
        <GroupInfoSheet group={group} user={user}
          onClose={(action) => {
            setShowInfo(false);
            if (action === "left") onBack();
          }}
          onUpdate={setGroup} />
      )}

      {showVideoCall && (
        <VideoCallModal
          roomName={`group-${group.id}`}
          displayName={getName(user.full_name, user.email)}
          onClose={() => setShowVideoCall(false)}
        />
      )}
    </>
  );
}