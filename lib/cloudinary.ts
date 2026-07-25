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
 * Trim the transparent padding out of a mockup-tool product cutout and
 * reframe it to fill a card.
 *
 * These PNGs export as a small subject centered in a mostly-empty canvas
 * (subject ~35-40% of frame width). Left as-is, object-cover crops blindly
 * into that empty space and either clips the subject or shows the section
 * background bleeding through the transparency — reads as a cut/bordered
 * image. object-contain avoids the crop but leaves a big dead backdrop
 * around a tiny subject instead.
 *
 * e_trim crops server-side to the actual non-transparent content's bounding
 * box (full standing figure, ~1:3). c_fill,g_auto then reframes that to
 * ar_3:4 using content-aware gravity instead of a blind center-crop.
 *
 * IMPORTANT: 3:4 is not arbitrary — it must match the gallery card's own
 * aspect ratio exactly (see aspect-[3/4] in image-gallery-section.tsx). If
 * the card's CSS box is a different aspect, object-cover performs a SECOND,
 * independent crop on top of this one, and the two compound into a much
 * tighter crop than either alone (this shipped once already: a near-square
 * card cropping an already-3:4 image down to a torso close-up). Change
 * this ratio and the component's ratio together, never one alone.
 */
export function cloudinaryGalleryFill(url: string): string {
  return withCloudinaryTransform(
    url,
    'e_trim,c_fill,g_auto,ar_3:4,w_900,q_80',
  );
}
