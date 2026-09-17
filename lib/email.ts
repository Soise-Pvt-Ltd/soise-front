/**
 * The one test for "does this look like an email we can send to".
 *
 * Three surfaces capture a guest's email for cart recovery (bag panel, order
 * summary, pay form) and each had grown its own check — `includes('@')`,
 * `includes('@') && includes('.')`, a regex. Three definitions of the same
 * fact drift; one function cannot.
 */
export function looksLikeEmail(value: string): boolean {
  const clean = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
}
