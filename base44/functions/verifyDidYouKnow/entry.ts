import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { content, sourceLink } = await req.json();

    if (!content || content.length < 30) {
      return Response.json({ quality_label: "needs_source", verified: false }, { status: 200 });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a fact-checker. Analyze this claim and determine if it appears to be a substantiated fact or if it needs verification from a reliable source.

Claim: "${content}"
Source Link Provided: ${sourceLink ? 'Yes' : 'No'}
${sourceLink ? `Source: ${sourceLink}` : ''}

Respond with ONLY a JSON object:
{
  "verified": boolean (true if claim appears factually sound based on common knowledge),
  "quality_label": "verified" | "community_tip" | "needs_source" (verified = high confidence, community_tip = interesting but unverifiable, needs_source = questionable/contradictory),
  "reasoning": "brief reason why"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          verified: { type: "boolean" },
          quality_label: { type: "string", enum: ["verified", "community_tip", "needs_source"] },
          reasoning: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    console.error("Verification error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});