import { base44 } from "@/api/base44Client";

/**
 * Upload a File object to Cloudflare R2 via backend function.
 * Returns { file_url: string }
 */
export async function uploadToR2(file) {
  const formData = new FormData();
  formData.append("file", file);

  // base44.functions.invoke doesn't support FormData, so call fetch directly
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || ""}/api/functions/uploadToR2`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "R2 upload failed");
  }

  return response.json(); // { file_url }
}