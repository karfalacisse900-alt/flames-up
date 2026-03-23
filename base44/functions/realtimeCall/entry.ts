import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const REALTIME_BASE = "https://api.realtime.cloudflare.com/v2";

function getAuthHeader() {
  const orgId = Deno.env.get("CLOUDFLARE_REALTIME_ORG_ID") || "";
  const apiKey = Deno.env.get("CLOUDFLARE_REALTIME_API_KEY") || "";
  // If the stored key is already a full "Basic xxxx" header (copied from dashboard)
  if (apiKey.startsWith("Basic ")) return apiKey;
  // Normalize org ID to UUID format if stored without dashes
  let oid = orgId;
  if (oid.length === 32 && !oid.includes("-")) {
    oid = `${oid.slice(0,8)}-${oid.slice(8,12)}-${oid.slice(12,16)}-${oid.slice(16,20)}-${oid.slice(20)}`;
  }
  return `Basic ${btoa(`${oid}:${apiKey}`)}`;
}

const DEFAULT_PRESET = Deno.env.get("CLOUDFLARE_REALTIME_PRESET") || "group_call_host";

async function createMeeting(title) {
  const res = await fetch(`${REALTIME_BASE}/meetings`, {
    method: "POST",
    headers: { "Authorization": getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  console.log("createMeeting:", JSON.stringify(data));
  if (!data.success) throw new Error(`Create meeting failed: ${JSON.stringify(data.error || data)}`);
  return data.data.id;
}

async function addParticipant(meetingId, name, presetName) {
  const body = {
    name,
    client_specific_id: name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50),
    preset_name: presetName || DEFAULT_PRESET,
  };
  const res = await fetch(`${REALTIME_BASE}/meetings/${meetingId}/participants`, {
    method: "POST",
    headers: { "Authorization": getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log("addParticipant:", JSON.stringify(data));
  if (!data.success) throw new Error(`Add participant failed: ${JSON.stringify(data.error || data)}`);
  return data.data.token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── 1-on-1 call: create meeting + two participant tokens ──
    if (!action || action === "create_call") {
      const { callerName, calleeName, sessionId, presetName } = body;
      const meetingId = await createMeeting(`call-${sessionId || Date.now()}`);
      const [callerToken, calleeToken] = await Promise.all([
        addParticipant(meetingId, callerName || "Caller", presetName),
        addParticipant(meetingId, calleeName || "Callee", presetName),
      ]);
      return Response.json({ meetingId, callerToken, calleeToken });
    }

    // ── Group call: get/create a meeting by room name, add this participant ──
    if (action === "join_group_call") {
      const { room_name, participant_name, preset_name } = body;
      if (!room_name) return Response.json({ error: "room_name is required" }, { status: 400 });

      // Check if an active meeting already exists for this room
      let meetingId = null;
      const existing = await base44.asServiceRole.entities.CallSession.filter({ room_id: room_name, status: "active" });
      if (existing.length > 0 && existing[0].realtime_meeting_id) {
        meetingId = existing[0].realtime_meeting_id;
      } else {
        meetingId = await createMeeting(`group-${room_name}`);
        await base44.asServiceRole.entities.CallSession.create({
          room_id: room_name,
          caller_email: user.email,
          callee_email: user.email,
          status: "active",
          call_type: "video",
          realtime_meeting_id: meetingId,
        });
      }

      const token = await addParticipant(meetingId, participant_name || user.full_name || user.email, preset_name);
      return Response.json({ meetingId, token });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("realtimeCall error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});