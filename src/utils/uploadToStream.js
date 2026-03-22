import { base44 } from "@/api/base44Client";

/**
 * Upload a video file directly from the browser to Cloudflare Stream.
 * 
 * Flow:
 * 1. Ask backend for a one-time direct upload URL (video_id reserved)
 * 2. Browser uploads the file directly to Cloudflare (no server relay)
 * 3. Return { video_id, stream_url, thumbnail_url }
 * 
 * @param {File} file - The video file to upload
 * @param {function} [onProgress] - Optional progress callback (0-100)
 * @returns {{ video_id: string, stream_url: string, thumbnail_url: string }}
 */
export async function uploadToStream(file, onProgress) {
  // Step 1: get a one-time upload URL from our backend
  const res = await base44.functions.invoke("getStreamUploadUrl", {
    file_size: file.size,
  });

  if (res.data?.error) throw new Error(res.data.error);

  const { video_id, upload_url } = res.data;
  if (!video_id || !upload_url) throw new Error("Invalid upload URL response from server");

  // Step 2: upload the file directly from the browser to Cloudflare
  await uploadWithProgress(upload_url, file, onProgress);

  const thumbnail_url = `https://customer-y552ojl6mo04xwk9.cloudflarestream.com/${video_id}/thumbnails/thumbnail.jpg`;

  return {
    video_id,
    stream_url: video_id,
    thumbnail_url,
  };
}

/**
 * Upload file directly to the Cloudflare Stream one-time upload URL.
 * Uses XMLHttpRequest for progress tracking.
 */
function uploadWithProgress(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", uploadUrl);
    xhr.send(formData);
  });
}