import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const REALTIME_BASE = "https://api.realtime.cloudflare.com/v2";

function getAuthHeader() {
  const orgId = Deno.env.get("CLOUDFLARE_REALTIME_ORG_ID");
  const apiKey = Deno.env.get("CLOUDFLARE_REALTIME_API_KEY");
  // If API key is already a full Authorization header value (e.g. copied from dashboard)
  if (apiKey && apiKey.startsWith("Basic ")) return apiKey;
  // Org ID might be stored without dashes — normalize to UUID format if 32 chars
  let oid = orgId || "";
  if (oid.length === 32 && !oid.includes("-")) {
    oid = `${oid.slice(0,8)}-${oid.slice(8,12)}-${oid.slice(12,16)}-${oid.slice(16,20)}-${oid.slice(20)}`;
  }
  return `Basic ${btoa(`${oid}:${apiKey || ""}`)}`;

async function createMeeting(title) {
  const res = await fetch(`${REALTIME_BASE}/meetings`, {
    method: "POST",
    headers: { "Authorization": getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Failed to create meeting: ${JSON.stringify(data)}`);
  return data.data.id;
}

async function addParticipant(meetingId, name, presetName) {
  const body = { name, custom_participant_id: name };
  if (presetName) body.preset_name = presetName;
  const res = await fetch(`${REALTIME_BASE}/meetings/${meetingId}/participants`, {
    method: "POST",
    headers: { "Authorization": getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Failed to add participant: ${JSON.stringify(data)}`);
  return data.data.token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { callerName, calleeName, sessionId, presetName } = await req.json();

    const meetingId = await createMeeting(`call-${sessionId}`);
    const [callerToken, calleeToken] = await Promise.all([
      addParticipant(meetingId, callerName || "Caller", presetName),
      addParticipant(meetingId, calleeName || "Callee", presetName),
    ]);

    return Response.json({ meetingId, callerToken, calleeToken });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});