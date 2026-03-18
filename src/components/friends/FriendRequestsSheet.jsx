import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Check, UserX, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

function getInitials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function FriendRequestsSheet({ currentUser, onClose }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState({});

  const { data: requests = [] } = useQuery({
    queryKey: ["friendRequests", currentUser?.email],
    queryFn: () => base44.entities.FriendRequest.filter({ receiver_email: currentUser.email, status: "pending" }, "-created_date"),
    enabled: !!currentUser?.email,
    refetchInterval: 10000,
  });

  const accept = async (req) => {
    setProcessing(p => ({ ...p, [req.id]: "accepting" }));
    try {
      // Delete old request and recreate as accepted to avoid update issues
      await base44.entities.FriendRequest.delete(req.id);
      await base44.entities.FriendRequest.create({ ...req, status: "accepted" });
      // Create mutual follows (ignore errors if already exists)
      await Promise.allSettled([
        base44.entities.Follow.create({
          follower_email: currentUser.email,
          follower_name: currentUser.full_name || currentUser.email,
          following_email: req.sender_email,
          following_name: req.sender_name || "",
        }),
        base44.entities.Follow.create({
          follower_email: req.sender_email,
          follower_name: req.sender_name || "",
          following_email: currentUser.email,
          following_name: currentUser.full_name || currentUser.email,
        }),
      ]);
      await base44.entities.Notification.create({
        recipient_email: req.sender_email,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        type: "friend_accepted",
      }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
    } finally {
      setProcessing(p => ({ ...p, [req.id]: null }));
    }
  };

  const decline = async (req) => {
    setProcessing(p => ({ ...p, [req.id]: "declining" }));
    try {
      await base44.entities.FriendRequest.delete(req.id);
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
    } finally {
      setProcessing(p => ({ ...p, [req.id]: null }));
    }
  };

  const block = async (req) => {
    setProcessing(p => ({ ...p, [req.id]: "blocking" }));
    try {
      await base44.entities.FriendRequest.delete(req.id);
      await base44.entities.FriendRequest.create({ ...req, status: "blocked" });
      qc.invalidateQueries({ queryKey: ["friendRequests"] });
    } finally {
      setProcessing(p => ({ ...p, [req.id]: null }));
    }
  };

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col"
        style={{ backgroundColor: "var(--bg-app)", maxHeight: "80vh", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              Friend Requests
            </h2>
            {requests.length > 0 && (
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>{requests.length} pending</p>
            )}
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="w-10 h-10" style={{ color: "var(--text-hint)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>No pending requests</p>
            </div>
          ) : requests.map(req => (
            <div key={req.id}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              {/* Avatar */}
              <button onClick={() => { navigate(`/user/${req.sender_email}`); onClose(); }}
                className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", minWidth: 48 }}>
                {req.sender_avatar_url ? (
                  <img src={req.sender_avatar_url} alt="" className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = "none"; }} />
                ) : getInitials(req.sender_name)}
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                  {req.sender_name || req.sender_email}
                </p>
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>wants to be friends</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => accept(req)} disabled={!!processing[req.id]}
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: "#4F46E5", color: "#fff" }}>
                  {processing[req.id] === "accepting" ? "…" : <><Check className="w-3 h-3 inline mr-1" />Accept</>}
                </button>
                <button onClick={() => decline(req)} disabled={!!processing[req.id]}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <X className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
                </button>
                <button onClick={() => block(req)} disabled={!!processing[req.id]}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#FEF2F2" }}>
                  <UserX className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}