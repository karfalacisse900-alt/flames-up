import { base44 } from "@/api/base44Client";

export async function checkContent(text, imageUrl = null) {
  if (!text) return { safe: true, flags: [] };

  let prompt = `You are a content moderation AI. Analyze the following text for policy violations:
- NSFW: Sexually explicit or adult content
- Hate Speech: Discriminatory, hateful, or dehumanizing language
- Spam: Repetitive, promotional, or low-quality content

Text to analyze:
"${text}"

Respond with JSON: {"flags": ["nsfw"|"hate_speech"|"spam"], "confidence": 0.0-1.0}`;

  if (imageUrl) {
    prompt += `\n\nAlso analyze this image for NSFW or hate content.`;
  }

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          flags: { type: "array", items: { type: "string" } },
          confidence: { type: "number" }
        }
      },
      file_urls: imageUrl ? [imageUrl] : undefined
    });

    const flags = result.flags || [];
    const confidence = result.confidence || 0;

    if (flags.length > 0 && confidence > 0.6) {
      return { safe: false, flags, confidence };
    }
    return { safe: true, flags: [], confidence };
  } catch (err) {
    console.error("Moderation check failed:", err);
    return { safe: true, flags: [], confidence: 0 };
  }
}

export async function createModerationReport(contentType, contentId, authorEmail, authorName, flags, confidence) {
  await base44.entities.ModerationReport.create({
    content_type: contentType,
    content_id: contentId,
    author_email: authorEmail,
    author_name: authorName,
    flags,
    ai_confidence: confidence,
    status: confidence > 0.8 ? "rejected" : "flagged"
  });
}

export async function generateUniqueUsername(baseName) {
  let username = baseName.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) || "user";
  let counter = 1;
  let attempt = username;

  while (true) {
    const existing = await base44.entities.User.filter({ username: attempt }, null, 1);
    if (existing.length === 0) return attempt;
    attempt = `${username}${counter++}`;
    if (counter > 100) throw new Error("Could not generate unique username");
  }
}

export function generateReferralCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}