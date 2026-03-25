import React, { useState } from "react";
import { Radio, Users, Play } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import VideoCallModal from "@/components/messages/VideoCallModal";

export default function GroupLiveTab({ group, user, isAdmin, isMember }) {
  const [showCall, setShowCall] = useState(false);
  const [joiningStream, setJoiningStream] = useState(null);
  const qc = useQueryClient();

  const { data: streams = [] } = useQuery({
    queryKey: ["groupLiveStreams", group.id],
    queryFn: () => base44.entities.LiveStream.filter({ group_id: group.id, is_active: true }, "-created_date", 10),
    refetchInterval: 10000,
  });

  const myStream = streams.find(s => s.host_email === user?.email);
  const activeStreams = streams.filter(s => s.host_email !== user?.email);

  const handleGoLive = async () => {
    if (myStream) {
      // Already live — just rejoin
      setShowCall(true);
      return;
    }
    await base44.entities.LiveStream.create({
      group_id: group.id,
      group_name: group.name,
      host_email: user.email,
      host_name: user.full_name || user.email,
      title: `${user.full_name || "Live"} is live in ${group.name}`,
      is_active: true,
      viewer_count: 0,
    });
    qc.invalidateQueries({ queryKey: ["groupLiveStreams", group.id] });
    qc.invalidateQueries({ queryKey: ["groupActiveLive"] });
    setShowCall(true);
  };

  const handleEndLive = async () => {
    if (myStream) {
      await base44.entities.LiveStream.update(myStream.id, { is_active: false });
      qc.invalidateQueries({ queryKey: ["groupLiveStreams", group.id] });
      qc.invalidateQueries({ queryKey: ["groupActiveLive"] });
    }
    setShowCall(false);
  };

  const handleJoin = (stream) => {
    setJoiningStream(stream);
    setShowCall(true);
  };

  const roomName = joiningStream
    ? `group-live-${joiningStream.host_email.replace(/[@.]/g, "-")}`
    : `group-live-${user?.email?.replace(/[@.]/g, "-")}`;

  return (
    <div style={{ padding: "20px 16px", paddingBottom: 100 }}>
      {/* Admin Go Live button */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ borderRadius: 20, overflow: "hidden", marginBottom: 24,
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Radio style={{ width: 24, height: 24, color: "#fff" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "var(--font-serif)" }}>
                {myStream ? "You are live" : "Start a live session"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>
                {myStream ? "Members can join your stream" : "Host audio/video for your group"}
              </p>
            </div>
          </div>
          <button onClick={handleGoLive}
            style={{ marginTop: 14, width: "100%", padding: "13px 0", borderRadius: 14,
              backgroundColor: myStream ? "rgba(255,255,255,0.25)" : "#fff",
              color: myStream ? "#fff" : "#4F46E5", fontWeight: 700, fontSize: 15,
              border: "none", cursor: "pointer" }}>
            {myStream ? "Rejoin your stream" : "Go Live"}
          </button>
          {myStream && (
            <button onClick={handleEndLive}
              style={{ marginTop: 8, width: "100%", padding: "11px 0", borderRadius: 14,
                backgroundColor: "rgba(220,38,38,0.3)", color: "#fca5a5", fontWeight: 700,
                fontSize: 14, border: "none", cursor: "pointer" }}>
              End stream
            </button>
          )}
        </motion.div>
      )}

      {/* Active streams */}
      {streams.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-serif)", marginBottom: 6 }}>
            No live sessions yet
          </p>
          <p style={{ fontSize: 14, color: "var(--text-hint)" }}>
            {isAdmin ? "Start a session above to go live." : "Check back when an admin goes live."}
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Live now · {streams.length}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {streams.map(stream => {
              const isOwn = stream.host_email === user?.email;
              return (
                <motion.div key={stream.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ borderRadius: 18, backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-light)", padding: 16,
                    display: "flex", alignItems: "center", gap: 14,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  {/* Live indicator */}
                  <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#FEE2E2",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                    <Radio style={{ width: 22, height: 22, color: "#EF4444" }} />
                    <span style={{ position: "absolute", top: -3, right: -3, width: 10, height: 10,
                      borderRadius: "50%", backgroundColor: "#EF4444", border: "2px solid #fff",
                      animation: "pulse 1.5s infinite" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 2, truncate: true }}>
                      {stream.title || `${stream.host_name} is live`}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-hint)" }}>
                      Hosted by {isOwn ? "You" : stream.host_name}
                    </p>
                  </div>
                  {isMember && !isOwn && (
                    <button onClick={() => handleJoin(stream)}
                      style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 12, backgroundColor: "#EF4444",
                        color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                      <Play style={{ width: 12, height: 12, fill: "#fff" }} /> Join
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Live call modal */}
      {showCall && (
        <VideoCallModal
          roomName={roomName}
          displayName={user?.full_name || user?.email?.split("@")[0] || "User"}
          onClose={handleEndLive}
        />
      )}
    </div>
  );
}