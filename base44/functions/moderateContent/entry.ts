import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Rate limit: max 15 calls per user per minute
const rateLimitMap = {};

function checkRateLimit(email) {
  const now = Date.now();
  if (!rateLimitMap[email]) rateLimitMap[email] = [];
  rateLimitMap[email] = rateLimitMap[email].filter(t => now - t < 60000);
  if (rateLimitMap[email].length >= 15) return false;
  rateLimitMap[email].push(now);
  return true;
}

// Basic pre-filter (fast, no API call)
function preFilter(text) {
  const lower = text.toLowerCase();
  const hardBlockWords = ["nigger", "faggot", "kys", "kill yourself", "cp ", "child porn"];
  if (hardBlockWords.some(w => lower.includes(w))) return { verdict: "block", reason: "hate_speech_or_harm" };
  if (text.trim().length < 2) return { verdict: "block", reason: "too_short" };
  if (text.length > 10000) return { verdict: "review", reason: "too_long" };
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (!checkRateLimit(user.email)) {
      console.warn(`[MODERATION] Rate limit exceeded for ${user.email}`);
      return Response.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429 });
    }

    const { text, content_type = "general", admin_override } = await req.json();
    if (!text) return Response.json({ error: "text required" }, { status: 400 });

    // Admin override: skip moderation
    if (admin_override && user.role === "admin") {
      console.log(JSON.stringify({ ts: new Date().toISOString(), user: user.email, content_type, verdict: "safe", reason: "admin_override" }));
      return Response.json({ verdict: "safe", flags: [], can_publish: true, admin_override: true });
    }

    // Fast pre-filter
    const preResult = preFilter(text);
    if (preResult) {
      console.log(JSON.stringify({ ts: new Date().toISOString(), user: user.email, content_type, verdict: preResult.verdict, reason: preResult.reason, stage: "pre_filter" }));
      return Response.json({ verdict: preResult.verdict, flags: [preResult.reason], can_publish: false });
    }

    // AI moderation via LLM
    let verdict = "safe";
    let flags = [];
    let aiReason = "";

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a content moderation AI for a social community app. Analyze the following user-submitted content and classify it.

Content type: ${content_type}
Content: """${text.slice(0, 2000)}"""

Respond with JSON only:
{
  "verdict": "safe" | "review" | "block",
  "flags": ["spam", "hate_speech", "harassment", "misinformation", "adult_content", "violence", "off_topic"],
  "reason": "brief explanation"
}

Rules:
- "safe": appropriate for all users
- "review": borderline, needs human review (mild profanity, debatable content, suspicious links)
- "block": clearly harmful (hate speech, explicit threats, spam attacks, illegal content)
- Only include relevant flags, can be empty array for safe content`,
      response_json_schema: {
        type: "object",
        properties: {
          verdict: { type: "string" },
          flags: { type: "array", items: { type: "string" } },
          reason: { type: "string" }
        }
      }
    });

    verdict = aiResult?.verdict || "review";
    flags = aiResult?.flags || [];
    aiReason = aiResult?.reason || "";

    // Validate verdict
    if (!["safe", "review", "block"].includes(verdict)) verdict = "review";

    // Log
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      user: user.email,
      content_type,
      length: text.length,
      verdict,
      flags,
      reason: aiReason,
      stage: "ai_moderation"
    }));

    return Response.json({
      verdict,
      flags,
      reason: aiReason,
      can_publish: verdict !== "block",
    });

  } catch (error) {
    console.error("[MODERATION] Error:", error.message);
    // Fail open for system errors (don't block users due to our errors)
    return Response.json({ verdict: "safe", flags: [], can_publish: true, error_fallback: true });
  }
});