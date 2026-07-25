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
  return withCloudinaryTransform(url, 'e_trim,q_80');
}
