import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Basic profanity list (extend as needed)
const PROFANITY = ["spam","scam","fuck","shit","bitch","ass","nigger","faggot","retard"];

// Rate limit: max 10 moderation calls per user per minute
const rateLimitMap = {};

function checkRateLimit(email) {
  const now = Date.now();
  if (!rateLimitMap[email]) rateLimitMap[email] = [];
  rateLimitMap[email] = rateLimitMap[email].filter(t => now - t < 60000);
  if (rateLimitMap[email].length >= 10) return false;
  rateLimitMap[email].push(now);
  return true;
}

function basicModerate(text) {
  const lower = text.toLowerCase();
  const flags = [];

  // Profanity check
  const foundProfanity = PROFANITY.filter(w => lower.includes(w));
  if (foundProfanity.length > 0) {
    flags.push({ type: "profanity", detail: foundProfanity });
  }

  // Spam patterns
  const spamPatterns = [
    /https?:\/\/[^\s]+/gi,         // URLs
    /(.)\1{5,}/gi,                  // Repeated chars
    /buy now|click here|free money|make money|earn \$|limited offer/gi,
  ];
  const spamMatches = spamPatterns.flatMap(p => text.match(p) || []);
  if (spamMatches.length > 2) {
    flags.push({ type: "spam", detail: spamMatches.slice(0, 3) });
  }

  // Too short / too long
  if (text.trim().length < 3) flags.push({ type: "too_short" });
  if (text.length > 5000) flags.push({ type: "too_long" });

  // Determine verdict
  let verdict = "safe";
  if (flags.some(f => f.type === "profanity" || f.type === "spam")) verdict = "review";
  if (flags.some(f => f.type === "profanity" && f.detail?.length > 2)) verdict = "block";

  return { verdict, flags };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (!checkRateLimit(user.email)) {
      console.warn(`Rate limit exceeded for ${user.email}`);
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { text, content_type = "general" } = await req.json();
    if (!text) return Response.json({ error: "text required" }, { status: 400 });

    const result = basicModerate(text);

    // Log moderation decision
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      user: user.email,
      content_type,
      length: text.length,
      verdict: result.verdict,
      flags: result.flags.map(f => f.type),
    }));

    return Response.json({
      verdict: result.verdict,   // "safe" | "review" | "block"
      flags: result.flags,
      can_publish: result.verdict !== "block",
    });
  } catch (error) {
    console.error("moderateContent error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});