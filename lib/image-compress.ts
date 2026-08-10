import imageCompression from 'browser-image-compression';

// Downscale + re-encode large images client-side before upload.
//
// Uploads travel browser → /api/media/upload (a Vercel route handler) → the
// backend, and Vercel hard-caps serverless request bodies at 4.5MB: anything
// bigger dies with 413 FUNCTION_PAYLOAD_TOO_LARGE *before our handler runs*,
// leaving no trace in any log. Full-width hero shots and phone photos are
// routinely >4.5MB, so shrinking them client-side is the only reliable path.
//
// browser-image-compression does the work in a web worker (no main-thread
// freeze on 10MB photos) and iterates quality until the result actually fits
// under the target size — unlike a single-pass canvas encode, which guesses.
const MAX_UPLOAD_DIMENSION = 2560;
const COMPRESS_THRESHOLD_BYTES = 1_500_000; // ~1.5MB — below this, not worth it
const TARGET_SIZE_MB = 3.5; // comfortably under Vercel's cap, with headroom

/** Vercel's serverless request-body cap; requests above it 413 before our code runs. */
export const MAX_UPLOAD_BYTES = 4_500_000;

/** Source formats that can carry an alpha channel. JPEG cannot. */
const ALPHA_CAPABLE = /^image\/(png|webp|gif|avif)$/;

export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/svg+xml' || file.size <= COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

  // An earlier version of this flow always encoded JPEG, which silently
  // destroyed transparency: JPEG has no alpha channel, and a canvas
  // composites transparent pixels to BLACK on export. Every homepage cutout
  // came out with a black background, and because it happened in the browser
  // the server only ever saw the already-flattened file. Alpha-capable
  // sources therefore re-encode to WebP (keeps alpha, compresses better),
  // and only JPEG sources — which have no alpha to protect — stay JPEG.
  const keepsAlpha = ALPHA_CAPABLE.test(file.type);

  try {
    const out = await imageCompression(file, {
      maxSizeMB: TARGET_SIZE_MB,
      maxWidthOrHeight: MAX_UPLOAD_DIMENSION,
      useWebWorker: true,
      fileType: keepsAlpha ? 'image/webp' : 'image/jpeg',
      initialQuality: 0.85,
      preserveExif: false,
    });

    // A browser without WebP encoding falls back per the canvas spec. PNG
    // output is acceptable (alpha survives); JPEG output for an
    // alpha-capable source is the exact flattening bug this flow replaced —
    // ship the original instead.
    if (keepsAlpha && out.type === 'image/jpeg') return file;
    if (out.size >= file.size) return file;

    const ext =
      out.type === 'image/webp' ? '.webp'
      : out.type === 'image/png' ? '.png'
      : '.jpg';
    const name = file.name.replace(/\.[^.]+$/, '') + ext;
    return new File([out], name, { type: out.type });
  } catch {
    return file; // Unsupported/corrupt/worker failure — let the server validate it.
  }
}
