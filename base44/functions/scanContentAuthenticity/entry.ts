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
      prompt = `You are an AI content authenticity detector for a social platform that requires only real, authentic user-generated content.

Analyze this image carefully and determine if it is:
1. AI-GENERATED: Created by AI tools like Midjourney, DALL-E, Stable Diffusion, etc.
2. HEAVILY MANIPULATED: Edited far beyond normal photo editing (face swaps, deepfakes, synthetic elements)
3. AUTHENTIC: A real photograph taken by a human

Look for these AI-generation signals:
- Unnatural skin texture (too smooth, waxy, plastic-like)
- Impossible or surreal lighting that defies physics
- Anatomical errors (extra fingers, distorted hands, malformed ears)
- Background inconsistencies (blurring, artifacts, repeated patterns)
- Text that is garbled or illegible
- Unnaturally perfect symmetry in faces
- Dreamlike or hyper-stylized aesthetic typical of AI art
- Metadata signals embedded in the visual style

Respond ONLY with this JSON:
{
  "verdict": "authentic" | "flagged" | "rejected",
  "confidence": 0.0-1.0,
  "reason": "brief explanation (max 2 sentences)"
}

Rules:
- verdict "rejected" = clearly AI-generated (confidence > 0.75)
- verdict "flagged" = uncertain, possibly AI or heavily edited (confidence 0.45-0.75)
- verdict "authentic" = real photograph (confidence > 0.6 for authenticity)`;
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