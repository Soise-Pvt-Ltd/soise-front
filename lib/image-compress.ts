// Downscale + re-encode large images client-side before upload.
//
// Uploads travel browser → /api/media/upload (a Vercel route handler) → the
// backend, and Vercel hard-caps serverless request bodies at 4.5MB: anything
// bigger dies with 413 FUNCTION_PAYLOAD_TOO_LARGE *before our handler runs*,
// leaving no trace in any log. Full-width hero shots and phone photos are
// routinely >4.5MB, so shrinking them client-side is the only reliable path.
// Alpha-capable sources re-encode to WebP, never JPEG — see the note in
// compressImage for why that distinction matters.
const MAX_UPLOAD_DIMENSION = 2560;
const COMPRESS_THRESHOLD_BYTES = 1_500_000; // ~1.5MB — below this, not worth it

/** Vercel's serverless request-body cap; requests above it 413 before our code runs. */
export const MAX_UPLOAD_BYTES = 4_500_000;

/** Source formats that can carry an alpha channel. JPEG cannot. */
const ALPHA_CAPABLE = /^image\/(png|webp|gif|avif)$/;

export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/svg+xml' || file.size <= COMPRESS_THRESHOLD_BYTES) {
    return file;
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file; // Unsupported/corrupt — let the server validate it.
  }
  const scale = Math.min(
    1,
    MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // This used to always encode JPEG, which silently destroyed transparency:
  // JPEG has no alpha channel, and a canvas composites transparent pixels to
  // BLACK on export. Every homepage cutout came out with a black background,
  // and because it happened in the browser the server only ever saw the
  // already-flattened file — nothing downstream could detect or undo it.
  //
  // WebP is the fix: it keeps alpha AND compresses better than JPEG, so
  // alpha-capable sources lose nothing. JPEG sources have no alpha to protect,
  // so they keep using JPEG.
  const keepsAlpha = ALPHA_CAPABLE.test(file.type);
  const mime = keepsAlpha ? 'image/webp' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, 0.85),
  );

  // A browser without WebP encoding returns null. Never fall back to JPEG for
  // an alpha-capable source — that's the exact bug this replaced. Ship the
  // original instead and let the server-side pipeline size it down.
  if (!blob || blob.type !== mime || blob.size >= file.size) return file;

  const ext = keepsAlpha ? '.webp' : '.jpg';
  const name = file.name.replace(/\.[^.]+$/, '') + ext;
  return new File([blob], name, { type: mime });
}
