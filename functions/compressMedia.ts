import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'image' or 'video'

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (type === 'image') {
      // Use browser-compatible image compression via ImageMagick API
      const compressedBlob = await compressImage(uint8Array, file.type);
      const compressedFile = new File([compressedBlob], file.name, { type: file.type });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
      return Response.json({ file_url, compressed: true });
    } else if (type === 'video') {
      // For videos, upload original and return URL
      // (Server-side video compression requires FFmpeg which isn't available in Deno Deploy)
      // Consider using a dedicated video processing service like Cloudinary or Mux
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return Response.json({ file_url, compressed: false, note: 'Video compression requires external service' });
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Media compression error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function compressImage(uint8Array, mimeType) {
  // Use canvas-based compression
  const blob = new Blob([uint8Array], { type: mimeType });
  const bitmap = await createImageBitmap(blob);
  
  // Calculate new dimensions (max 1920px width/height)
  const maxSize = 1920;
  let width = bitmap.width;
  let height = bitmap.height;
  
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  // Create canvas and compress
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  
  // Convert to blob with quality compression
  const compressedBlob = await canvas.convertToBlob({
    type: mimeType,
    quality: 0.85
  });
  
  return compressedBlob;
}