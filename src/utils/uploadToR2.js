import { appParams } from "@/lib/app-params";

/**
 * Upload a File object to Cloudflare R2 via the uploadToR2 backend function.
 * Returns { file_url: string }
 */
export async function uploadToR2(file) {
  const formData = new FormData();
  formData.append("file", file);

  const baseUrl = appParams.appBaseUrl || "";
  const appId = appParams.appId;
  const token = appParams.token;

  const url = `${baseUrl}/api/apps/${appId}/functions/uploadToR2`;

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "R2 upload failed");
  }

  return response.json(); // { file_url }
}