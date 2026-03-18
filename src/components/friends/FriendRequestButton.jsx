import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, UserCheck, Clock, UserX, Check, X } from "lucide-react";

/**
 * FriendRequestButton
 * Shows the correct state: Add Friend | Pending | Accept/Decline | Friends
 * Props:
 *   targetEmail, targetName, targetAvatar — the user being viewed
 *   currentUser — logged-in user object
 *   compact — smaller pill style
 */
export default function FriendRequestButton({ targetEmail, targetName, targetAvatar, currentUser, compact = false }) {
  const [state, setState] = useState("loading"); // loading | none | pending_sent | pending_received | friends | blocked
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.email || !targetEmail) return;
    checkStatus();
  }, [currentUser?.email, targetEmail]);

  const checkStatus = async () => {
    setState("loading");
    try {
      // Check if they are mutual followers (friends)
      const [myFollows, theirFollows, sentReqs, receivedReqs] = await Promise.all([
        base44.entities.Follow.filter({ follower_email: currentUser.email, following_email: targetEmail }),
        base44.entities.Follow.filter({ follower_email: targetEmail, following_email: currentUser.email }),
        base44.entities.FriendRequest.filter({ sender_email: currentUser.email, receiver_email: targetEmail }),
        base44.entities.FriendRequest.filter({ sender_email: targetEmail, receiver_email: currentUser.email }),
      ]);

      // Friends = mutual follow
      if (myFollows.length > 0 && theirFollows.length > 0) {
        setState("friends");
        return;
      }

      // Check pending requests
      const pendingSent = sentReqs.find(r => r.status === "pending");
      const pendingReceived = receivedReqs.find(r => r.status === "pending");
      const blocked = sentReqs.find(r => r.status === "blocked") || receivedReqs.find(r => r.status === "blocked");

      if (blocked) { setState("blocked"); return; }
      if (pendingSent) { setState("pending_sent"); setRequestId(pendingSent.id); return; }
      if (pendingReceived) { setState("pending_received"); setRequestId(pendingReceived.id); return; }

      setState("none");
    } catch {
      setState("none");
    }
  };

  const sendRequest = async () => {
    if (!currentUser?.email) return;
    setLoading(true);
    try {
      const req = await base44.entities.FriendRequest.create({
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        sender_avatar_url: currentUser.avatar_url || "",
        receiver_email: targetEmail,
        receiver_name: targetName || "",
        status: "pending",
      });
      // Send in-app notification
      await base44.entities.Notification.create({
        recipient_email: targetEmail,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        type: "friend_request",
        ref_id: req.id,
      });
      setRequestId(req.id);
      setState("pending_sent");
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      await base44.entities.FriendRequest.update(requestId, { status: "accepted" });
      // Create mutual follow records
      await Promise.all([
        base44.entities.Follow.create({
          follower_email: currentUser.email,
          follower_name: currentUser.full_name || currentUser.email,
          following_email: targetEmail,
          following_name: targetName || "",
        }),
        base44.entities.Follow.create({
          follower_email: targetEmail,
          follower_name: targetName || "",
          following_email: currentUser.email,
          following_name: currentUser.full_name || currentUser.email,
        }),
      ]);
      // Notify sender
      await base44.entities.Notification.create({
        recipient_email: targetEmail,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        type: "friend_accepted",
      });
      setState("friends");
    } finally {
      setLoading(false);
    }
  };

  const declineRequest = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      await base44.entities.FriendRequest.update(requestId, { status: "declined" });
      setState("none");
      setRequestId(null);
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      await base44.entities.FriendRequest.delete(requestId);
      setState("none");
      setRequestId(null);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser?.email || currentUser.email === targetEmail) return null;
  if (state === "loading") return null;

  const baseStyle = {
    display: "inline-flex", alignItems: "center", gap: 6,
    borderRadius: compact ? 20 : 24,
    fontSize: compact ? 11 : 13,
    fontWeight: 700,
    padding: compact ? "5px 12px" : "8px 16px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.18s ease",
    minHeight: 36,
  };

  if (state === "friends") return (
    <button style={{ ...baseStyle, backgroundColor: "#ECFDF5", color: "#16A34A" }}>
      <UserCheck className="w-3.5 h-3.5" /> Friends
    </button>
  );

  if (state === "pending_sent") return (
    <button onClick={cancelRequest} disabled={loading} style={{ ...baseStyle, backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
      <Clock className="w-3.5 h-3.5" /> Pending
    </button>
  );

  if (state === "pending_received") return (
    <div style={{ display: "inline-flex", gap: 6 }}>
      <button onClick={acceptRequest} disabled={loading} style={{ ...baseStyle, backgroundColor: "#4F46E5", color: "#fff" }}>
        <Check className="w-3.5 h-3.5" /> Accept
      </button>
      <button onClick={declineRequest} disabled={loading} style={{ ...baseStyle, backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
        <X className="w-3.5 h-3.5" /> Decline
      </button>
    </div>
  );

  if (state === "blocked") return null;

  return (
    <button onClick={sendRequest} disabled={loading} style={{ ...baseStyle, backgroundColor: "#4F46E5", color: "#fff" }}>
      <UserPlus className="w-3.5 h-3.5" /> Add Friend
    </button>
  );
}