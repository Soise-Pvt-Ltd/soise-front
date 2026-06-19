import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Authoritative role check: reads the signed-in user's role from the backend
 * profile (the source of truth — never trust a client cookie for authorization).
 * Returns null when not authenticated or the profile can't be read.
 */
export async function getCurrentRole(): Promise<string | null> {
  const token = (await cookies()).get('access_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/profiles`, {
      headers: { Cookie: `access_token=${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.role ?? null;
  } catch {
    return null;
  }
}

/**
 * Server-side guard for role-protected route segments. Place in a `layout.tsx`
 * so it gates every page under that segment.
 *
 * - Not authenticated  -> redirect to login (with a callbackUrl).
 * - Authenticated, wrong role -> redirect to `deniedTo` (carries `?reason=` so
 *   the destination can explain why access was denied).
 *
 * NOTE: redirect() throws NEXT_REDIRECT, so it's called OUTSIDE the try/catch
 * in getCurrentRole (a catch would otherwise swallow the redirect).
 */
export async function requireRole(
  allowed: string[],
  opts: { deniedTo: string; reason: string; loginCallback: string },
): Promise<string> {
  const role = await getCurrentRole();
  if (!role) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(opts.loginCallback)}`);
  }
  if (!allowed.includes(role as string)) {
    const sep = opts.deniedTo.includes('?') ? '&' : '?';
    redirect(`${opts.deniedTo}${sep}reason=${encodeURIComponent(opts.reason)}`);
  }
  return role as string;
}
