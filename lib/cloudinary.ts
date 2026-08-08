const UPLOAD_MARKER = '/image/upload/';

/**
 * Insert a Cloudinary transformation string right after `/image/upload/`.
 * URLs that aren't Cloudinary (bundled /public fallbacks, other CDNs) pass
 * through untouched.
 */
export function withCloudinaryTransform(url: string, transform: string): string {
  const i = url.indexOf(UPLOAD_MARKER);
  if (i === -1) return url;
  return `${url.slice(0, i + UPLOAD_MARKER.length)}${transform}/${url.slice(i + UPLOAD_MARKER.length)}`;
}

interface MediaLike {
  url?: string | null;
  variants?: Record<string, string | undefined> | null;
}

/**
 * A thumbnail-sized URL for a media record — never the raw original.
 *
 * Uploads land at full resolution: the product PNGs run 1-2.5MB. Cards, cart
 * rows and nav previews paint them between 60px and 200px, so reaching for
 * `media.url` shipped a 941KB PNG to fill a 29KB box. That mismatch was the
 * entire Cloudinary bandwidth bill — 111GB in 30 days against a measured
 * 947KB average per delivered image, which is the raw original almost exactly.
 *
 * Prefers the stored variant and derives the same transform from the raw URL
 * when a record predates `variants`, so it needs no backfill and degrades to
 * pass-through on non-Cloudinary URLs.
 */
export function mediaThumb(
  media: MediaLike | null | undefined,
  width = 400,
): string | undefined {
  if (!media) return undefined;
  const stored = width <= 400 ? media.variants?.small : media.variants?.medium;
  if (stored) return stored;
  const url = media.url;
  if (!url) return undefined;
  return withCloudinaryTransform(url, `c_scale,f_auto,q_auto,w_${width}`);
}

/**
 * Trim the dead transparent margin off a mockup-tool product cutout.
 *
 * These PNGs export as a small subject (~35-40% of frame width) centered
 * in a mostly-empty canvas. That's not a crop problem, it's a canvas-size
 * problem: e_trim removes only the actually-empty transparent pixels
 * around the subject and keeps 100% of the subject itself, so it's safe
 * to combine with object-contain (still zero content loss) without
 * reintroducing the leg/head cropping that c_fill,ar_3:4 caused last time.
 *
 * Deliberately does NOT set c_fill/ar/w — those force the output to a
 * fixed target box, which means cropping INTO the subject once its
 * aspect ratio doesn't match the target. That's a real crop, not a trim,
 * and it's not what was asked for here.
 */
export function cloudinaryGalleryTrim(url: string): string {
  // f_auto is doing the heavy lifting here, not q_80. These are photographic
  // PNG cutouts, and q_80 on a PNG is close to a no-op — the three gallery
  // renders were shipping at 837KB, 553KB and 789KB. Serving WebP/AVIF instead
  // takes each to roughly a quarter of that, and both formats keep the alpha
  // channel the cutouts depend on.
  return withCloudinaryTransform(url, 'e_trim,f_auto,q_auto');
}

/**
 * Optimise any CMS-managed image that isn't the hero or a gallery cutout.
 *
 * Same reasoning: uploads arrive as full-resolution PNGs — one of the homepage
 * images was 2.1MB — and are served untransformed. c_limit caps the long edge
 * without upscaling or cropping, so framing is untouched.
 */
export function cloudinaryContent(url: string, width = 1400): string {
  return withCloudinaryTransform(url, `f_auto,q_auto,c_limit,w_${width}`);
}

/**
 * Optimise a full-bleed hero for delivery.
 *
 * The homepage hero is the LCP element and was served as the raw Cloudinary
 * original — 309KB of JPEG. `f_auto` alone gets that to 160KB of WebP (AVIF
 * where supported); capping the width at what a hero actually needs takes it
 * to ~107KB. On a Nigerian mobile connection that difference is seconds.
 *
 * `c_limit` never upscales and never crops — it only caps the long edge — so
 * the framing the CMS chose is preserved exactly.
 */
export function cloudinaryHero(url: string, width = 1600): string {
  return withCloudinaryTransform(url, `f_auto,q_auto,c_limit,w_${width}`);
}
