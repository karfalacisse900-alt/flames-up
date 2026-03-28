import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Scans uploaded content to detect if it's AI-generated or manipulated.
 * Accepts: { file_url, content_type } where content_type = "image" | "video" | "audio"
 * Returns: { verdict: "authentic" | "flagged" | "rejected", confidence: number, reason: string }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { file_url, content_type = "image" } = await req.json();

    if (!file_url) {
      return Response.json({ error: "file_url is required" }, { status: 400 });
    }

    let prompt = "";

    if (content_type === "image") {
      prompt = `You are reviewing an image uploaded by a user to a social platform. Your job is to determine if this is a real photo taken by a human, or clearly AI-generated.

IMPORTANT BIAS: You MUST strongly favor "authentic". Real phone photos often look imperfect, grainy, blurry, have harsh lighting, or look like casual snapshots. These are NOT signs of AI generation.

Only mark as "rejected" if the image is UNMISTAKABLY AI-generated with extreme certainty — for example: perfectly rendered fantasy scenes, obvious Midjourney/DALL-E art style with surreal lighting and impossible anatomy, text that is completely garbled gibberish throughout.

Do NOT reject:
- Normal phone photos, even if they look slightly edited or filtered
- Photos with Instagram-style color grading
- Portrait mode / bokeh photos
- Group selfies or blurry candid shots
- Fashion photos, outfit shots, food photos
- Photos with some noise or compression artifacts
- Anything that could plausibly be a real person's camera roll

Only reject if ALL of the following are true:
- Clearly synthetic, not a real photo
- Obvious AI art aesthetic (Midjourney/DALL-E style)
- Confidence of AI generation is above 0.92

Otherwise return "authentic".

Respond ONLY with this JSON:
{
  "verdict": "authentic" | "flagged" | "rejected",
  "confidence": 0.0-1.0,
  "reason": "brief explanation (max 1 sentence)"
}

Thresholds:
- "rejected" = unmistakably AI-generated art, confidence > 0.92
- "flagged" = very likely AI-generated but uncertain, confidence 0.85-0.92
- "authentic" = everything else including normal photos, edited photos, filtered photos`;
    } else if (content_type === "video") {
      prompt = `You are an AI content authenticity detector for a social platform. 
      
A video file has been uploaded at: ${file_url}

For video content, analyze based on common deepfake and AI-video signals:
- Synthetic video generation (Sora, Runway, etc.) tends to have inconsistent motion physics
- Deepfake faces show unnatural blinking, mismatched lighting on face vs background
- AI videos often have artifacts at edges of moving objects

Since you cannot play the video, assess based on the URL pattern and any detectable metadata signals. When uncertain, default to "flagged" for human review.

Respond ONLY with this JSON:
{
  "verdict": "flagged",
  "confidence": 0.5,
  "reason": "Video content flagged for manual review to verify authenticity."
}`;
    } else if (content_type === "audio") {
      prompt = `A user has uploaded an audio file to a social platform that requires authentic, real content.

Audio URL: ${file_url}

AI-generated voice/audio signals to consider:
- AI voice cloning (ElevenLabs, Murf, etc.) produces unnaturally clean, artifact-free audio
- Synthetic speech has unnatural cadence and prosody
- AI music generators create content without natural recording imperfections

Since direct audio analysis isn't possible via URL, flag audio uploads for lightweight human review.

Respond ONLY with this JSON:
{
  "verdict": "flagged",
  "confidence": 0.45,
  "reason": "Audio flagged for authenticity review. Real recordings are encouraged."
}`;
    }

    // Use LLM with vision for images, text reasoning for video/audio
    const invokeOptions = {
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          verdict: { type: "string" },
          confidence: { type: "number" },
          reason: { type: "string" },
        },
        required: ["verdict", "confidence", "reason"],
      },
    };

    if (content_type === "image") {
      invokeOptions.file_urls = [file_url];
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM(invokeOptions);

    // Validate verdict
    const validVerdicts = ["authentic", "flagged", "rejected"];
    if (!validVerdicts.includes(result?.verdict)) {
      result.verdict = "flagged";
    }

    console.log(`Content scan [${content_type}]: verdict=${result.verdict}, confidence=${result.confidence}`);

    return Response.json(result);
  } catch (error) {
    console.error("Content scan error:", error);
    // On error, allow upload but flag for review
    return Response.json({
      verdict: "flagged",
      confidence: 0.3,
      reason: "Could not verify content. Flagged for manual review.",
    });
  }
});