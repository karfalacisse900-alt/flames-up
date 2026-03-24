import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MoreVertical, Phone, Video, Ban, VolumeX, AlertTriangle, UserX, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import RichMessageBubble from "./RichMessageBubble";
import ChatInputBar from "./ChatInputBar";
import CreatorBadge from "@/components/creators/CreatorBadge.jsx";

const COLORS = ["#C026D3", "#9333EA", "#2563EB", "#059669", "#D97706"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

export default function DMChatView({ user, conversation, onBack }) {
  const [replyTo, setReplyTo] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const searchInputRef = useRef(null);
  const matchRefs = useRef({});

  const [partnerCreator, setPartnerCreator] = useState(null);
  const endRef = useRef(null);
  const queryClient = useQueryClient();
  const convId = [user.email, conversation.email].sort().join("_");
  const displayName = getName(conversation.name, conversation.email);

  useEffect(() => {
    base44.entities.Creator.filter({ user_email: conversation.email, approval_status: "approved" })
      .then(rows => setPartnerCreator(rows[0] || null))
      .catch(() => {});
  }, [conversation.email]);

  useEffect(() => {
    const blockedList = JSON.parse(localStorage.getItem("blocked_users") || "[]");
    setBlocked(blockedList.includes(conversation.email));
    const mutedList = JSON.parse(localStorage.getItem("muted_users") || "[]");
    setMuted(mutedList.includes(conversation.email));
  }, [conversation.email]);

  const { data: messages = [] } = useQuery({
    queryKey: ["dm", convId],
    queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: convId }, "created_date", 150),
    refetchInterval: 3000,
  });

  const blockedList = JSON.parse(localStorage.getItem("blocked_users") || "[]");
  const visibleMessages = messages.filter(m =>
    !blockedList.includes(m.sender_email) || m.sender_email === user.email
  );

  useEffect(() => {
    messages.filter(m => m.receiver_email === user.email && !m.is_read)
      .forEach(m => base44.entities.DirectMessage.update(m.id, { is_read: true }));
  }, [messages, user.email]);

  useEffect(() => {
    if (!showSearch) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showSearch]);

  useEffect(() => {
    const unsub = base44.entities.DirectMessage.subscribe((event) => {
      if (event.data?.conversation_id === convId) {
        queryClient.invalidateQueries({ queryKey: ["dm", convId] });
      }
    });
    return unsub;
  }, [convId, queryClient]);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return visibleMessages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => {
        if (msg.is_deleted) return false;
        if (msg.text?.toLowerCase().includes(q)) return true;
        const dateStr = new Date(msg.created_date).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
        if (dateStr.toLowerCase().includes(q)) return true;
        return false;
      });
  }, [searchQuery, visibleMessages]);

  useEffect(() => { setSearchMatchIndex(0); }, [searchQuery]);

  useEffect(() => {
    if (searchMatches.length > 0) {
      const match = searchMatches[searchMatchIndex];
      if (match) {
        const el = matchRefs.current[match.msg.id];
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [searchMatchIndex, searchMatches]);

  const openSearch = () => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 100); };
  const closeSearch = () => { setShowSearch(false); setSearchQuery(""); setSearchMatchIndex(0); };

  const createMsg = async (fields) => {
    await base44.entities.DirectMessage.create({
      conversation_id: convId,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      receiver_email: conversation.email,
      is_read: false,
      ...(replyTo ? { reply_to_id: replyTo.id, reply_preview: replyTo.text || "Voice message" } : {}),
      ...fields,
    });

    const mutedList = JSON.parse(localStorage.getItem("muted_users") || "[]");
    if (!mutedList.includes(conversation.email)) {
      base44.entities.Notification.create({
        recipient_email: conversation.email,
        actor_email: user.email,
        actor_name: user.full_name || user.email?.split("@")[0] || "Someone",
        type: "direct_message",
        post_text: fields.text ? fields.text.slice(0, 80) : fields.message_type === "voice" ? "🎤 Voice message" : fields.message_type === "gif" ? "🎭 GIF" : "📷 Media",
        ref_id: convId,
        is_read: false,
      }).catch(() => {});
    }

    setReplyTo(null);
    queryClient.invalidateQueries({ queryKey: ["dm", convId] });
    queryClient.invalidateQueries({ queryKey: ["dmSent", user.email] });
    queryClient.invalidateQueries({ queryKey: ["dmReceived", user.email] });
  };

  const handleReact = async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const reactions = { ...(msg.reactions || {}) };
    const existing = reactions[emoji] || [];
    reactions[emoji] = existing.includes(user.email)
      ? existing.filter(e => e !== user.email)
      : [...existing, user.email];
    await base44.entities.DirectMessage.update(msgId, { reactions });
    queryClient.invalidateQueries({ queryKey: ["dm", convId] });
  };

  const handleDelete = async (msgId) => {
    await base44.entities.DirectMessage.update(msgId, { is_deleted: true, text: "" });
    queryClient.invalidateQueries({ queryKey: ["dm", convId] });
  };

  const handleBlock = () => {
    const list = JSON.parse(localStorage.getItem("blocked_users") || "[]");
    if (blocked) {
      localStorage.setItem("blocked_users", JSON.stringify(list.filter(e => e !== conversation.email)));
      setBlocked(false);
    } else {
      list.push(conversation.email);
      localStorage.setItem("blocked_users", JSON.stringify(list));
      setBlocked(true);
    }
    setShowMenu(false);
  };

  const handleMute = () => {
    const list = JSON.parse(localStorage.getItem("muted_users") || "[]");
    if (muted) {
      localStorage.setItem("muted_users", JSON.stringify(list.filter(e => e !== conversation.email)));
      setMuted(false);
    } else {
      list.push(conversation.email);
      localStorage.setItem("muted_users", JSON.stringify(list));
      setMuted(true);
    }
    setShowMenu(false);
  };

  const matchIds = new Set(searchMatches.map(m => m.msg.id));
  const currentMatchId = searchMatches[searchMatchIndex]?.msg.id;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", backgroundColor: "#F8F8FF" }}>

      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 16px)", paddingBottom: 14, backgroundColor: "#fff", borderBottom: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full shrink-0"
          style={{ backgroundColor: "#f8f8ff", border: "1px solid #ede9fe" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "#1e293b" }} />
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-base font-bold text-white"
            style={{ background: conversation.avatar_url ? "transparent" : `linear-gradient(135deg, ${avatarColor(conversation.email)}, #9333EA)` }}>
            {conversation.avatar_url
              ? <img src={conversation.avatar_url} alt="" className="w-full h-full object-cover" />
              : displayName[0]?.toUpperCase() || "?"}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: "#22C55E" }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-[16px] truncate" style={{ color: "#1e293b" }}>{displayName}</p>
            {partnerCreator && <CreatorBadge category={partnerCreator.category} size="xs" />}
          </div>
          <p className="text-[12px] font-medium" style={{ color: "#C026D3" }}>
            {muted ? "🔇 Muted" : "Typing..."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="w-10 h-10 flex items-center justify-center rounded-full"
            onClick={openSearch}
            style={{ backgroundColor: "#f8f8ff", border: "1px solid #ede9fe" }}>
            <Search className="w-4 h-4" style={{ color: showSearch ? "#C026D3" : "#64748b" }} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full"
            onClick={() => window.__callManager?.startCall({ calleeEmail: conversation.email, calleeName: displayName, callType: "audio" })}
            style={{ backgroundColor: "#f8f8ff", border: "1px solid #ede9fe" }}>
            <Phone className="w-5 h-5" style={{ color: "#1e293b" }} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full"
            onClick={() => window.__callManager?.startCall({ calleeEmail: conversation.email, calleeName: displayName, callType: "video" })}
            style={{ backgroundColor: "#f8f8ff", border: "1px solid #ede9fe" }}>
            <Video className="w-5 h-5" style={{ color: "#1e293b" }} />
          </button>
          <div className="relative">
            <button className="w-10 h-10 flex items-center justify-center rounded-full"
              onClick={() => setShowMenu(v => !v)}
              style={{ backgroundColor: "#f8f8ff", border: "1px solid #ede9fe" }}>
              <MoreVertical className="w-5 h-5" style={{ color: "#1e293b" }} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-12 z-50 rounded-2xl shadow-xl overflow-hidden"
                  style={{ backgroundColor: "#fff", minWidth: 200, border: "1px solid #f1f5f9" }}>
                  {[
                    { icon: VolumeX, label: muted ? "Unmute" : "Mute notifications", action: handleMute },
                    { icon: Ban, label: blocked ? "Unblock" : "Block", action: handleBlock, danger: !blocked },
                    { icon: AlertTriangle, label: "Report", action: () => setShowMenu(false), danger: true },
                  ].map(({ icon: Icon, label, action, danger }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-[14px]"
                      style={{ color: danger ? "#E53935" : "#333", borderBottom: "1px solid #F5F5F5" }}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: "#fff", borderBottom: "1px solid #f1f5f9" }}>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{ backgroundColor: "#f8f8ff", border: "1.5px solid #C026D3" }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: "#C026D3" }} />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#1e293b" }}
            />
            {searchQuery && (
              <span className="text-[12px] font-medium shrink-0" style={{ color: "#94A3B8" }}>
                {searchMatches.length > 0 ? `${searchMatchIndex + 1}/${searchMatches.length}` : "0"}
              </span>
            )}
          </div>
          {searchMatches.length > 1 && (
            <div className="flex flex-col gap-0.5">
              <button onClick={() => setSearchMatchIndex(i => Math.max(0, i - 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f8f8ff" }}>
                <ChevronUp className="w-4 h-4" style={{ color: "#64748b" }} />
              </button>
              <button onClick={() => setSearchMatchIndex(i => Math.min(searchMatches.length - 1, i + 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f8f8ff" }}>
                <ChevronDown className="w-4 h-4" style={{ color: "#64748b" }} />
              </button>
            </div>
          )}
          <button onClick={closeSearch} className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "#f8f8ff" }}>
            <X className="w-4 h-4" style={{ color: "#64748b" }} />
          </button>
        </div>
      )}

      {/* Blocked banner */}
      {blocked && (
        <div className="mx-4 mt-2 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm shrink-0"
          style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}>
          <UserX className="w-4 h-4 shrink-0" />
          You have blocked this user. Unblock to send messages.
        </div>
      )}

      {/* No results banner */}
      {showSearch && searchQuery && searchMatches.length === 0 && (
        <div className="mx-4 mt-2 px-4 py-2.5 rounded-xl text-center text-sm shrink-0"
          style={{ backgroundColor: "#fdf4ff", color: "#9333EA" }}>
          No messages found for "{searchQuery}"
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: "none" }}>
        <div className="flex justify-center mb-4">
          <div className="px-4 py-1.5 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: "rgba(192,38,211,0.08)", color: "#9333EA" }}>
            🔒 Messages are private
          </div>
        </div>

        {visibleMessages.length === 0 && !blocked && (
          <div className="flex justify-center">
            <div className="px-5 py-3 rounded-2xl text-[13px]"
              style={{ backgroundColor: "#fff", color: "#555", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              👋 Say hello to <strong>{displayName}</strong>!
            </div>
          </div>
        )}

        {visibleMessages.map((msg, idx) => {
          const prevMsg = visibleMessages[idx - 1];
          const showDate = !prevMsg || new Date(msg.created_date).toDateString() !== new Date(prevMsg.created_date).toDateString();
          const isMatch = matchIds.has(msg.id);
          const isCurrent = msg.id === currentMatchId;

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ backgroundColor: "#f1e8ff" }} />
                  <span className="px-4 py-1.5 rounded-full text-[12px] font-semibold"
                    style={{ backgroundColor: "#fff", color: "#C026D3", border: "1px solid #fdf4ff", boxShadow: "0 2px 8px rgba(192,38,211,0.1)" }}>
                    {new Date(msg.created_date).toDateString() === new Date().toDateString()
                      ? "Today"
                      : new Date(msg.created_date).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "#f1e8ff" }} />
                </div>
              )}
              <div
                ref={el => { if (el) matchRefs.current[msg.id] = el; }}
                style={isMatch ? {
                  borderRadius: 16,
                  outline: `2px solid ${isCurrent ? "#C026D3" : "rgba(192,38,211,0.25)"}`,
                  backgroundColor: isCurrent ? "rgba(192,38,211,0.05)" : "transparent",
                  transition: "background 0.2s",
                } : {}}
              >
                <RichMessageBubble
                  message={msg}
                  isMe={msg.sender_email === user.email}
                  user={user}
                  onReply={setReplyTo}
                  onReact={handleReact}
                  onDelete={handleDelete}
                  partnerAvatar={conversation.avatar_url}
                  partnerName={displayName}
                />
              </div>
            </React.Fragment>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {!showSearch && (
        <div style={{ backgroundColor: "#fff", borderTop: "1px solid #f1f5f9", boxShadow: "0 -2px 12px rgba(0,0,0,0.04)" }}>
          <ChatInputBar
            disabled={blocked}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onSendText={(text) => createMsg({ text, message_type: "text" })}
            onSendVoice={(audio_url) => createMsg({ audio_url, message_type: "voice", text: "" })}
            onSendMedia={(urls) => createMsg({ media_urls: urls, message_type: urls[0]?.match(/video/) ? "video" : "image", text: "" })}
            onSendGif={(gif_url) => createMsg({ gif_url, message_type: "gif", text: "" })}
            onSendLocation={(loc) => createMsg({ location_data: loc, message_type: "location", text: "" })}
          />
        </div>
      )}
    </div>
  );
}