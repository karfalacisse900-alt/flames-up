import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const REALTIME_BASE = "https://api.realtime.cloudflare.com/v2";

function getAuthHeader() {
  const orgId = Deno.env.get("CLOUDFLARE_REALTIME_ORG_ID");
  const apiKey = Deno.env.get("CLOUDFLARE_REALTIME_API_KEY");
  // If apiKey is already a full 'Basic ...' header value, use as-is
  if (apiKey && apiKey.startsWith("Basic ")) return apiKey;
  // If orgId is provided, encode as Basic base64(orgId:apiKey)
  if (orgId && apiKey) return `Basic ${btoa(`${orgId}:${apiKey}`)}`;
  // Fallback: try Bearer
  return `Bearer ${apiKey}`;
}

async function createMeeting(title) {
  const res = await fetch(`${REALTIME_BASE}/meetings`, {
    method: "POST",
    headers: {
      "Authorization": getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  console.log("Create meeting response:", JSON.stringify(data));
  if (!data.success) throw new Error(`Failed to create meeting: ${JSON.stringify(data)}`);
  return data.data.id;
}

async function addParticipant(meetingId, name, presetName) {
  const res = await fetch(`${REALTIME_BASE}/meetings/${meetingId}/participants`, {
    method: "POST",
    headers: {
      "Authorization": getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      preset_name: presetName,
      custom_participant_id: name,
    }),
  });
  const data = await res.json();
  console.log("Add participant response:", JSON.stringify(data));
  if (!data.success) throw new Error(`Failed to add participant: ${JSON.stringify(data)}`);
  return data.data.token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { callerName, calleeName, sessionId } = await req.json();

    // Create a meeting
    const meetingId = await createMeeting(`call-${sessionId}`);

    // Add both participants
    const [callerToken, calleeToken] = await Promise.all([
      addParticipant(meetingId, callerName || "Caller"),
      addParticipant(meetingId, calleeName || "Callee"),
    ]);

    return Response.json({ meetingId, callerToken, calleeToken });
  } catch (error) {
    console.error("realtimeCall error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});