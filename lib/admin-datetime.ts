/**
 * Date/time formatting for the admin suite.
 *
 * Every admin screen is server-rendered and then hydrated, so any formatter
 * that reads the *ambient* locale or timezone produces different text on the
 * two passes: Vercel renders in UTC, the browser renders in whatever the admin
 * is sitting in. React sees two different text nodes and throws hydration
 * error #418 — which is exactly what /dashboard was doing, on the first screen
 * anyone sees after logging in.
 *
 * Pinning both sides fixes it, and pinning them to Lagos is also the correct
 * answer for the business: the store sells in naira from Abuja, so "06:04" on
 * an order should mean 06:04 to the person packing it, not UTC.
 */
const TZ = 'Africa/Lagos';
const LOCALE = 'en-NG';

function safeDate(input: string | number | Date): Date | null {
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "06:04 AM" — stable across server and client. */
export function formatTime(input: string | number | Date, fallback = '—'): string {
  const d = safeDate(input);
  if (!d) return fallback;
  return d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  });
}

/** "29 Jul 2026" — stable across server and client. */
export function formatDate(input: string | number | Date, fallback = '—'): string {
  const d = safeDate(input);
  if (!d) return fallback;
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  });
}

/** Today in Lagos as YYYY-MM-DD, for date inputs. */
export function todayIso(): string {
  // en-CA gives ISO ordering (YYYY-MM-DD) directly.
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

/** The current month index (0-11) in Lagos, for highlighting "this month". */
export function currentMonthIndex(): number {
  const month = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    timeZone: TZ,
  });
  return Number(month) - 1;
}
