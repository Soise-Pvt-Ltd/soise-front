import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected paths outside the function to avoid recreating the array on every request
const USER_PROTECTED_PATHS = [
  '/shop/checkout',
  '/shop/wishlist',
  '/creators',
  '/shop/order-history',
  '/shop/user',
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.soise.ng';

// Small leeway so we refresh slightly before the hard expiry (clock skew tolerance).
const EXPIRY_LEEWAY_MS = 30_000;

/**
 * Read the `exp` claim (ms epoch) from a JWT without verifying its signature.
 * Verification still happens on the backend for every request — here we only
 * need expiry to decide whether to proactively refresh. Returns null if the
 * token can't be parsed, in which case we treat it as "present" (fail open)
 * so a parsing quirk never logs out a valid user.
 */
function getTokenExpiryMs(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    let b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(b64));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
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

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const accessToken = req.cookies.get('access_token')?.value;
  const refreshToken = req.cookies.get('refresh_token')?.value;
  const isAdmin = req.cookies.get('isAdmin')?.value === 'true';

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

  // Rule 1: Protect admin routes
  if (path.startsWith('/dashboard')) {
    if (!hasSession) {
      return redirectToLogin(req, new URL('/', req.url));
    }
    // Check admin status from cookie (backend re-verifies role on every call)
    if (isAdmin) {
      return proceed();
    }
    return NextResponse.redirect(new URL('/', req.url));
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
    '/shop/checkout/:path*',
    '/shop/wishlist/:path*',
    '/shop/order-history/:path*',
    '/shop/user/:path*',
  ],
};
