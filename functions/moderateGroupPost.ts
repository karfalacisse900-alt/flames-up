import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // This can be called by user action OR automation — accept both
    const { post_id, post_body, group_id, author_email, report_id } = await req.json();

    if (!post_id || !post_body) {
      return Response.json({ error: "post_id and post_body required" }, { status: 400 });
    }

    // AI analysis
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a content moderation AI. Analyze this group chat message for policy violations.

Message: "${post_body}"

Check for:
1. Hate speech (racism, sexism, homophobia, religious hatred)
2. Spam (repetitive, promotional, scam links)
3. Adult/sexual content
4. Extreme violence or threats
5. Harassment/bullying

Respond with a JSON object with these fields:
- is_safe: boolean (true if content is acceptable)
- flag_reason: string or null (short reason if flagged, e.g. "hate speech", "spam", "adult content")
- confidence: number 0-1 (how confident you are)
- action: "approve" | "flag" | "auto_reject" (approve=safe, flag=needs human review, auto_reject=clearly violating)
- summary: string (1 sentence explanation)`,
      response_json_schema: {
        type: "object",
        properties: {
          is_safe: { type: "boolean" },
          flag_reason: { type: "string" },
          confidence: { type: "number" },
          action: { type: "string" },
          summary: { type: "string" }
        }
      }
    });

    const action = analysis.action || "approve";

    // Update post moderation status
    let newStatus = "approved";
    if (action === "auto_reject") newStatus = "rejected";
    else if (action === "flag") newStatus = "pending";

    await base44.asServiceRole.entities.CommunityPost.update(post_id, {
      moderation_status: newStatus,
      is_reported: action !== "approve"
    });

    // If flagged, create/update a GroupPostReport with AI analysis
    if (action !== "approve" || report_id) {
      const reportData = {
        group_id,
        post_id,
        reporter_email: report_id ? undefined : "ai_moderator",
        reporter_name: report_id ? undefined : "AI Moderator",
        reason: analysis.flag_reason || analysis.summary || "AI flagged content",
        status: "pending",
        moderator_note: `AI Analysis: ${analysis.summary} (confidence: ${Math.round((analysis.confidence || 0) * 100)}%)`,
      };

      if (report_id) {
        // Update existing user report with AI analysis
        await base44.asServiceRole.entities.GroupPostReport.update(report_id, {
          moderator_note: `AI Analysis: ${analysis.summary} (confidence: ${Math.round((analysis.confidence || 0) * 100)}%)`,
        });
      } else {
        await base44.asServiceRole.entities.GroupPostReport.create(reportData);
      }
    }

    console.log(`Moderated post ${post_id}: action=${action}, flag_reason=${analysis.flag_reason}`);
    return Response.json({ action, analysis, newStatus });

  } catch (error) {
    console.error("moderateGroupPost error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});