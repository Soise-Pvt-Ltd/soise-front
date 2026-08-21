import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected paths outside the function to avoid recreating the array on every request
const USER_PROTECTED_PATHS = [
  // NB: checkout itself is deliberately absent. It lives at
  // /shop/order-summary and must stay reachable for guests — gating it behind
  // a login is the single most expensive thing you can do to conversion.
  // (There was a '/shop/checkout' entry here guarding a route that has never
  // existed.)
  '/shop/wishlist',
  '/creators',
  '/shop/order-history',
  '/shop/user',
  // /team requires a session here; the /team layout further restricts to
  // admin + outreach via requireRole (the authoritative server-side role check).
  '/team',
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.soise.ng';

// Small leeway so we refresh slightly before the hard expiry (clock skew tolerance).
const EXPIRY_LEEWAY_MS = 30_000;

/**
 * Decode a JWT payload WITHOUT verifying its signature.
 *
 * Safe here because nothing security-critical rests on it: the backend
 * verifies the signature on every API call, and the authoritative role check
 * lives in the route-segment layouts (lib/require-role.ts), which ask the
 * backend. Middleware only needs enough to decide "refresh now?" and "is it
 * worth rendering the admin shell?".
 */
function readTokenClaims(token: string | undefined): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    let b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(b64));
    return typeof payload === 'object' && payload !== null ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Read the `exp` claim (ms epoch) from a JWT. Returns null if the token can't
 * be parsed, in which case we treat it as "present" (fail open) so a parsing
 * quirk never logs out a valid user.
 */
function getTokenExpiryMs(token: string): number | null {
  const exp = readTokenClaims(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

/** Pull one cookie's value out of raw Set-Cookie header strings. */
function valueFromSetCookies(rawCookies: string[] | null, name: string): string | undefined {
  if (!rawCookies) return undefined;
  for (const raw of rawCookies) {
    const nameValue = raw.split(';', 1)[0].trim();
    const eq = nameValue.indexOf('=');
    if (eq !== -1 && nameValue.slice(0, eq).trim() === name) {
      return nameValue.slice(eq + 1).trim();
    }
  }
  return undefined;
}

function isAccessTokenUsable(token: string | undefined): boolean {
  if (!token) return false;
  const expMs = getTokenExpiryMs(token);
  // If we couldn't read an expiry, fail open (assume usable) — the backend
  // remains the source of truth and will 401 if it's actually invalid.
  if (expMs === null) return true;
  return Date.now() + EXPIRY_LEEWAY_MS < expMs;
}

/**
 * Exchange a refresh token for a fresh access/refresh pair via the backend.
 * Returns the backend's raw Set-Cookie strings on success, or null on any
 * failure (so callers can fall back to redirecting to login).
 */
async function refreshSession(refreshToken: string): Promise<string[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refresh_token=${refreshToken}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const setCookies = res.headers.getSetCookie?.() ?? [];
    return setCookies.length ? setCookies : null;
  } catch {
    return null;
  }
}

/** Mirror backend Set-Cookie headers onto a Next response for the frontend domain. */
function applySetCookies(res: NextResponse, rawCookies: string[]): void {
  const isSecure = process.env.NODE_ENV === 'production';
  for (const raw of rawCookies) {
    const [nameValue, ...attrs] = raw.split(';').map((s) => s.trim());
    const eqIndex = nameValue.indexOf('=');
    if (eqIndex === -1) continue;
    const name = nameValue.slice(0, eqIndex).trim();
    const value = nameValue.slice(eqIndex + 1).trim();

    const maxAgeAttr = attrs.find((a) => a.toLowerCase().startsWith('max-age='));
    const maxAge = maxAgeAttr ? parseInt(maxAgeAttr.split('=')[1], 10) : undefined;

    res.cookies.set(name, value, {
      httpOnly: true,
      secure: isSecure,
      path: '/',
      sameSite: 'lax',
      ...(maxAge !== undefined && { maxAge }),
    });
  }
}

function redirectToLogin(req: NextRequest, fallback: URL): NextResponse {
  const res = NextResponse.redirect(fallback);
  // Clear stale cookies so the next request doesn't keep retrying a dead session.
  res.cookies.delete('access_token');
  res.cookies.delete('refresh_token');
  res.cookies.delete('isAdmin');
  return res;
}

// Public pages that live under an otherwise-protected prefix (e.g. the Swaz
// Loop explainer/FAQ under /creators). These must remain viewable logged-out,
// so they bypass the auth gate while everything else under /creators stays
// protected.
const PUBLIC_PATHS = ['/creators/swaz-loop', '/team/playbook'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow explicitly-public pages straight through (no session work needed).
  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get('access_token')?.value;
  const refreshToken = req.cookies.get('refresh_token')?.value;

  // Determine whether the session is currently valid; if the access token is
  // expired but a refresh token exists, transparently refresh it so the user
  // isn't bounced to login (or shown a broken page) mid-session.
  let hasSession = isAccessTokenUsable(accessToken);
  let refreshedCookies: string[] | null = null;
  if (!hasSession && refreshToken) {
    refreshedCookies = await refreshSession(refreshToken);
    hasSession = refreshedCookies !== null;
  }

  const proceed = () => {
    const res = NextResponse.next();
    if (refreshedCookies) applySetCookies(res, refreshedCookies);
    return res;
  };

  // Rule 1: Protect admin routes.
  //
  // The role is read from the access token, which CARRIES it as a claim. It
  // used to be read from a separate `isAdmin` cookie, and that cookie was the
  // bug: it was written only at login with a 24h lifetime and never re-issued,
  // while the session itself refreshes for 30 days. From day two onward an
  // admin had a perfectly valid session, a dead cookie, and /dashboard
  // silently bounced them to the home page. The OTP sign-in path never set it
  // at all, so an admin who signed in by email code could never get in.
  //
  // Deriving it from the token removes the staleness by construction: the
  // claim travels with the credential and is re-minted on every refresh (the
  // backend re-reads the role from the database when it does, so a demotion
  // propagates within one access-token lifetime).
  if (path.startsWith('/dashboard')) {
    if (!hasSession) {
      // Send them somewhere they can actually fix it. This used to redirect to
      // `/`, so a logged-out visitor was bounced to the home page with no
      // explanation and no way to continue to where they were going.
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
      return redirectToLogin(req, loginUrl);
    }

    // After a refresh the fresh token is in the Set-Cookie headers we're about
    // to apply, not in req.cookies — read the newer one when it exists, or the
    // role would be one refresh out of date at exactly the wrong moment.
    const activeToken =
      valueFromSetCookies(refreshedCookies, 'access_token') ?? accessToken;
    const role = readTokenClaims(activeToken)?.role;

    if (role === 'admin') {
      return proceed();
    }
    if (typeof role === 'string' && role.length > 0) {
      // A known, non-admin role: refuse here rather than rendering the shell.
      return NextResponse.redirect(new URL('/?reason=admin-only', req.url));
    }
    // Role unreadable (an old token shape, a parsing quirk). Fail open TO THE
    // AUTHORITATIVE CHECK rather than closed: app/dashboard/layout.tsx calls
    // requireRole(['admin']), which asks the backend and redirects with the
    // same ?reason=admin-only. Treating "unknown" as "deny" is precisely how
    // the cookie version locked admins out in silence.
    return proceed();
  }

  // Rule 2: Protect user-specific routes like checkout.
  if (USER_PROTECTED_PATHS.some((p) => path.startsWith(p))) {
    if (!hasSession) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set(
        'callbackUrl',
        req.nextUrl.pathname + req.nextUrl.search,
      );
      return redirectToLogin(req, loginUrl);
    }
  }

  // If none of the above rules caused a redirect, allow the request to proceed
  // (carrying any refreshed cookies forward).
  return proceed();
}

export const config = {
  // The middleware will only run on these paths.
  // Public pages like '/' or '/products' will not be affected.
  matcher: [
    '/dashboard/:path*',
    '/creators/:path*',
    '/team/:path*',
    '/shop/checkout/:path*',
    '/shop/wishlist/:path*',
    '/shop/order-history/:path*',
    '/shop/user/:path*',
  ],
};
