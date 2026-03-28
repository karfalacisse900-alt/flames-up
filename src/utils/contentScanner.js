import { base44 } from "@/api/base44Client";

/**
 * Uploads a file temporarily and scans it for AI generation / manipulation.
 * @param {File} file - The file to scan
 * @param {"image"|"video"|"audio"} contentType
 * @returns {{ verdict: "authentic"|"flagged"|"rejected", confidence: number, reason: string }}
 */
export async function scanContent(file, contentType = "image") {
  // Upload to temp storage for scanning
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  const res = await base44.functions.invoke("scanContentAuthenticity", {
    file_url,
    content_type: contentType,
  });

  return res.data;
}

/**
 * Returns a user-friendly rejection message based on scan result.
 */
export function getScanMessage(result) {
  if (!result) return null;
  if (result.verdict === "rejected") {
    return {
      type: "rejected",
      title: "Content Not Allowed",
      message: `This content appears to be AI-generated and cannot be posted. ${result.reason || ""} Only authentic, real content is allowed on this platform.`,
    };
  }
  if (result.verdict === "flagged") {
    return {
      type: "flagged",
      title: "Content Under Review",
      message: result.reason || "This content has been flagged for review before publishing.",
    };
  }
  return null;
}