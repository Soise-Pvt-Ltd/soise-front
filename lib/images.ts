/**
 * Cloudflare R2 + Image Transformations delivery helpers.
 *
 * Replaces lib/cloudinary.ts. Cloudinary was disabled on 2026-08-08 and took
 * both delivery and the Admin API with it, so every asset is being re-uploaded.
 *
 * Storage is an R2 bucket published at a custom domain on the Soise zone;
 * resizing is Cloudflare's `/cdn-cgi/image/` endpoint, which is free for the
 * first 5,000 unique transforms a month on a Free plan. There is no paid Images
 * subscription involved.
 *
 *   Cloudinary   https://res.cloudinary.com/<cloud>/image/upload/w_800,f_auto/<id>
 *   Cloudflare   https://img.soise.ng/cdn-cgi/image/width=800,format=auto/<key>
 *
 * The transform is its own path segment sitting in FRONT of the object key, so
 * rewriting a URL means swapping that one segment — not splicing into the middle
 * of the path the way the Cloudinary helper had to.
 *
 * Every distinct transform string counts once against the monthly free quota
 * (per unique image+options pair, not per request), so new widths are cheap but
 * not free. Prefer reusing the widths already in use over inventing new ones.
 */

/** Hostname the R2 bucket is published on. Must be on the Cloudflare zone. */
const DELIVERY_HOST = (process.env.NEXT_PUBLIC_IMAGE_HOST ?? 'img.soise.ng')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '');

const MARKER = '/cdn-cgi/image/';

function isDeliveryUrl(url: string): boolean {
  try {
    return new URL(url).hostname === DELIVERY_HOST;
  } catch {
    // Relative paths (bundled /public fallbacks) — never ours to transform.
    return false;
  }
}

/**
 * Apply (or replace) the transform segment on a delivery URL.
 *
 * Handles both shapes the backend can hand us: a bare object URL, where the
 * transform gets inserted ahead of the key, and an already-transformed URL,
 * where only the options segment is swapped. Anything that isn't a delivery URL
 * — bundled /public fallbacks, other CDNs, leftover Cloudinary links — passes
 * through untouched, the same contract the Cloudinary helper had.
 */
export function withImageTransform(url: string, transform: string): string {
  if (!url || !isDeliveryUrl(url)) return url;

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }

  const at = u.pathname.indexOf(MARKER);
  if (at === -1) {
    // Bare object: /soise/<id>.png -> /cdn-cgi/image/<t>/soise/<id>.png
    u.pathname = `${MARKER}${transform}${u.pathname}`;
  } else {
    // Already transformed: swap only the options, keep the key.
    const rest = u.pathname.slice(at + MARKER.length);
    const slash = rest.indexOf('/');
    const key = slash === -1 ? '' : rest.slice(slash);
    u.pathname = `${u.pathname.slice(0, at)}${MARKER}${transform}${key}`;
  }
  return u.toString();
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
 * pass-through on unrecognised URLs.
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
  return withImageTransform(
    url,
    `width=${width},fit=scale-down,format=auto,quality=85`,
  );
}

/**
 * Product cutouts, already trimmed at upload.
 *
 * Cloudinary did this at delivery time with `e_trim`. Cloudflare only offers an
 * explicit numeric trim, not "crop to the non-transparent bounding box", so the
 * trim moved into the upload path (`trim_transparent_margin` in
 * app/domain/media.py) and happens exactly once per asset instead of on every
 * request. That means there is nothing to trim here — this only asks for format
 * and quality negotiation.
 *
 * Kept as a named function rather than inlined so the gallery call sites keep
 * documenting *why* these images are special.
 */
export function galleryImage(url: string): string {
  return withImageTransform(url, 'format=auto,quality=85');
}

/**
 * Optimise any CMS-managed image that isn't the hero or a gallery cutout.
 *
 * Uploads arrive as full-resolution PNGs — one of the homepage images was 2.1MB
 * — and were previously served untransformed. `fit=scale-down` caps the long
 * edge without upscaling or cropping, so framing is untouched.
 */
export function contentImage(url: string, width = 1400): string {
  return withImageTransform(
    url,
    `width=${width},fit=scale-down,format=auto,quality=85`,
  );
}

/**
 * Optimise a full-bleed hero for delivery.
 *
 * The homepage hero is the LCP element. Serving it untransformed cost 309KB;
 * format negotiation plus a width cap takes it to roughly a third of that. On a
 * Nigerian mobile connection that difference is seconds.
 *
 * `fit=scale-down` never upscales and never crops — it only caps the long edge
 * — so the framing the CMS chose is preserved exactly.
 *
 * quality=70 rather than the 85 used everywhere else, and only here. The hero
 * sits under a `from-black/60 via-black/10` gradient and carries no fine detail
 * a customer inspects — it is atmosphere, not merchandise. That hides the
 * artefacts 70 introduces while cutting roughly a third off the single largest
 * image on the site. Product imagery stays at 85 deliberately: on a
 * quiet-luxury storefront the garment is the thing being judged, and shaving
 * bytes off it is a false economy.
 */
export function heroImage(url: string, width = 1600): string {
  return withImageTransform(
    url,
    `width=${width},fit=scale-down,format=auto,quality=70`,
  );
}

/**
 * A landscape share card for OpenGraph/Twitter.
 *
 * Product photography is portrait or square and can be several megabytes.
 * Handed to a scraper as-is it renders as a small cropped thumbnail (and
 * WhatsApp simply drops anything oversized). This returns a 1200×630,
 * subject-aware, ~100KB JPEG.
 *
 * `format=jpeg` is deliberate and must NOT become `format=auto`: social
 * scrapers are not browsers, they send no meaningful Accept header, and several
 * (WhatsApp especially) refuse WebP/AVIF outright — an auto-negotiated card is
 * a silently blank link preview. The Cloudinary original forced `f_jpg` for the
 * same reason.
 *
 * `fit=cover` + `gravity=auto` is the equivalent of the old `c_fill,g_auto`:
 * fill the frame, and let saliency detection decide what survives the crop
 * rather than blindly taking the centre.
 */
export function shareCard(url: string): string {
  return withImageTransform(
    url,
    'width=1200,height=630,fit=cover,gravity=auto,format=jpeg,quality=80',
  );
}

/** True when a URL is a delivery URL we can transform. */
export function isTransformable(url: string | null | undefined): boolean {
  return Boolean(url && isDeliveryUrl(url));
}
