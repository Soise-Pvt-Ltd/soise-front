/**
 * Creator codes are always issued under a fixed house prefix. The creator only
 * picks the tail: the dashboard renders `SWAZ-` as static text next to the
 * input and posts the suffix, so codes stay recognisably ours instead of
 * whatever string someone typed. The backend re-applies the prefix itself —
 * these helpers exist so the UI and the server action agree on what a valid
 * suffix looks like before a round trip.
 */
export const CREATOR_CODE_PREFIX = 'SWAZ-';

export const CREATOR_SUFFIX_MIN = 2;
export const CREATOR_SUFFIX_MAX = 24;

/**
 * Clean a raw keystroke/paste into an acceptable suffix: uppercase, letters,
 * numbers and dashes only, no leading dash (the prefix already ends in one),
 * and with the prefix stripped if the creator pasted a whole code.
 */
export function sanitizeCreatorSuffix(raw: string): string {
  let tail = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  while (tail.startsWith(CREATOR_CODE_PREFIX)) {
    tail = tail.slice(CREATOR_CODE_PREFIX.length);
  }
  // Also handle a partially-typed prefix ("SWAZ", "SWA") pasted with the rest.
  tail = tail.replace(/^-+/, '');
  return tail.slice(0, CREATOR_SUFFIX_MAX);
}

/** The full code a given suffix will become, e.g. `SWAZ-JANE10`. */
export function buildCreatorCode(suffix: string): string {
  return `${CREATOR_CODE_PREFIX}${sanitizeCreatorSuffix(suffix)}`;
}

/** null when the suffix is acceptable, otherwise the message to show. */
export function creatorSuffixError(suffix: string): string | null {
  const tail = sanitizeCreatorSuffix(suffix);
  if (tail.length < CREATOR_SUFFIX_MIN) {
    return `Add at least ${CREATOR_SUFFIX_MIN} characters after ${CREATOR_CODE_PREFIX}`;
  }
  if (!/^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$/.test(tail)) {
    return 'Use letters, numbers or dashes — and don’t end with a dash.';
  }
  return null;
}
