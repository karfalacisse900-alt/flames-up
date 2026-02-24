import { base44 } from "@/api/base44Client";

let cachedRules = null;
let cacheTime = 0;

async function getActiveRules() {
  const now = Date.now();
  if (cachedRules && now - cacheTime < 60000) return cachedRules;
  try {
    const rules = await base44.entities.ModerationRule.filter({ is_active: true }, null, 50);
    cachedRules = rules;
    cacheTime = now;
    return rules;
  } catch {
    return [];
  }
}

function checkKeywordRules(text, rules) {
  const lower = text.toLowerCase();
  const matched = [];
  const actions = new Set();

  for (const rule of rules) {
    if (rule.rule_type !== "keyword") continue;
    const hits = (rule.keywords || []).filter(kw => lower.includes(kw.toLowerCase()));
    if (hits.length > 0) {
      matched.push(...hits);
      actions.add(rule.action || "flag");
    }
  }

  return { matched, actions };
}

export async function checkContent(text, imageUrl = null) {
  if (!text) return { safe: true, flags: [], matched_keywords: [] };

  // 1. Keyword rules check first (fast, no API call)
  const rules = await getActiveRules();
  const { matched, actions } = checkKeywordRules(text, rules);

  if (matched.length > 0 && actions.has("auto_remove")) {
    return {
      safe: false,
      flags: ["keyword_violation"],
      matched_keywords: matched,
      confidence: 1.0,
      action: "auto_remove"
    };
  }

  if (matched.length > 0 && actions.has("flag")) {
    return {
      safe: false,
      flags: ["keyword_violation"],
      matched_keywords: matched,
      confidence: 0.95,
      action: "flag"
    };
  }

  // 2. AI moderation check
  const prompt = `You are a strict content moderation AI. Analyze the following user-generated text for policy violations.

Categories to check:
- nsfw: Sexually explicit, adult, or graphic content
- hate_speech: Discriminatory, dehumanizing, or hateful content targeting groups
- spam: Repetitive, promotional, irrelevant, or low-quality content
- violence: Threats, incitement to violence, or graphic violent content
- misinformation: Clearly false or dangerous misinformation

Text to analyze:
"${text}"

Respond with JSON only. If no violations found, return empty flags array.`;

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
      return { safe: false, flags, matched_keywords: [], confidence, action: confidence > 0.88 ? "auto_remove" : "flag" };
    }
    return { safe: true, flags: [], matched_keywords: [], confidence };
  } catch (err) {
    console.error("Moderation check failed:", err);
    return { safe: true, flags: [], matched_keywords: [], confidence: 0 };
  }
}

export async function createModerationReport(contentType, contentId, authorEmail, authorName, flags, confidence, options = {}) {
  const shouldAutoRemove = options.action === "auto_remove" || confidence > 0.88;
  await base44.entities.ModerationReport.create({
    content_type: contentType,
    content_id: contentId,
    author_email: authorEmail,
    author_name: authorName,
    flags,
    matched_keywords: options.matched_keywords || [],
    ai_confidence: confidence,
    status: shouldAutoRemove ? "auto_removed" : "flagged",
    content_preview: options.preview || "",
  });
}

export async function checkUserReportThreshold(contentType, contentId) {
  try {
    const rules = await getActiveRules();
    const reportRules = rules.filter(r => r.rule_type === "user_reports");
    if (reportRules.length === 0) return;

    const threshold = Math.min(...reportRules.map(r => r.report_threshold || 3));
    const reports = await base44.entities.Report.filter({ content_type: contentType, content_id: contentId, status: "pending" }, null, 20);

    if (reports.length >= threshold) {
      const existing = await base44.entities.ModerationReport.filter({ content_id: contentId, content_type: contentType, status: "flagged" }, null, 1);
      if (existing.length === 0) {
        await base44.entities.ModerationReport.create({
          content_type: contentType,
          content_id: contentId,
          flags: ["user_reports"],
          ai_confidence: 0.75,
          status: "flagged",
          content_preview: `Auto-flagged: ${reports.length} user reports`,
        });
      }
    }
  } catch (err) {
    console.error("Report threshold check failed:", err);
  }
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