import { base44 } from "@/api/base44Client";

/**
 * Upload a File object to Cloudflare R2 via the uploadToR2 backend function.
 * Returns { file_url: string }
 */
export async function uploadToR2(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await base44.functions.invoke("uploadToR2", formData);
  const data = response?.data;

  if (!data?.file_url) {
    throw new Error(data?.error || "R2 upload failed");
  }

  return data; // { file_url }
}