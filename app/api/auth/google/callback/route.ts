import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { migrateGuestCart } from '@/lib/cart-migrate';

const BASE_URL = 'https://api.soise.ng';

/**
 * Mirror the backend's Set-Cookie headers onto this domain.
 *
 * api.soise.ng and soise.ng are separate origins, so cookies the API sets are
 * invisible here and have to be re-issued. Lifetimes are read from the
 * backend's own Max-Age rather than hardcoded: the previous version pinned
 * everything to 24h, which quietly capped a 30-day refresh token at one day.
 */
function mirrorCookies(
  store: Awaited<ReturnType<typeof cookies>>,
  rawCookies: string[],
): string[] {
  const isSecure = process.env.NODE_ENV === 'production';
  const names: string[] = [];
  for (const raw of rawCookies) {
    const [nameValue, ...attrs] = raw.split(';').map((s) => s.trim());
    const eq = nameValue.indexOf('=');
    if (eq === -1) continue;
    const name = nameValue.slice(0, eq).trim();
    const value = nameValue.slice(eq + 1).trim();
    const maxAgeAttr = attrs.find((a) => a.toLowerCase().startsWith('max-age='));
    const maxAge = maxAgeAttr ? parseInt(maxAgeAttr.split('=')[1], 10) : undefined;

    store.set(name, value, {
      httpOnly: true,
      secure: isSecure,
      path: '/',
      sameSite: 'lax',
      ...(maxAge !== undefined && !Number.isNaN(maxAge) && { maxAge }),
    });
    names.push(name);
  }
  return names;
}

/**
 * Complete a Google sign-in.
 *
 * Preferred path: the backend stashed the access/refresh pair under a
 * single-use `code` and put only that code in the redirect URL. We trade it
 * server-to-server for both cookies.
 *
 * Why it matters: this route previously received the raw access token in a
 * query parameter and set ONLY that, hardcoded to 24 hours, with no refresh
 * token at all. The middleware refreshes a session for 30 days — but it needs
 * a refresh token to do it, and Google users never had one. They were hard
 * logged out after a day while password users lasted a month, and the
 * credential itself sat in browser history and Referer headers.
 *
 * The legacy `accessToken` path is kept because the storefront and the API
 * deploy independently (Vercel vs the VPS), so there is always a window where
 * the frontend is newer than the backend. It can be deleted once a backend
 * carrying /auth/exchange is live everywhere.
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken, userId, code } = await request.json();

    if (code) {
      const res = await axios.post(
        `${BASE_URL}/auth/exchange`,
        { code },
        { headers: { Accept: 'application/json' }, validateStatus: () => true },
      );

      const setCookies: string[] = res.headers['set-cookie'] ?? [];
      if (res.status === 200 && setCookies.length) {
        const store = await cookies();
        const names = mirrorCookies(store, setCookies);

        // A session without a refresh token expires in a day instead of
        // thirty. Better to fail the sign-in loudly than to hand back a
        // session that quietly dies — that is the exact bug being fixed.
        if (!names.includes('access_token')) {
          return NextResponse.json(
            { success: false, message: 'Sign-in did not return a session' },
            { status: 502 },
          );
        }
        if (!names.includes('refresh_token')) {
          console.warn('google callback: exchange returned no refresh_token');
        }

        await migrateGuestCart(store.get('access_token')?.value);
        return NextResponse.json({ success: true });
      }

      // A code is single-use and lives 60 seconds; a stale or replayed one is
      // an expired link, not a server fault.
      if (res.status === 401) {
        return NextResponse.json(
          { success: false, message: 'Sign-in link has expired. Please try again.' },
          { status: 401 },
        );
      }
      // Anything else: fall through to the legacy path if we were also given a
      // token, rather than failing a sign-in that could still succeed.
      console.error('google callback: exchange failed', res.status);
    }

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'No access token provided' },
        { status: 400 },
      );
    }

    // ---- legacy path: token straight off the URL -------------------------
    // Prove the token is real before minting a cookie from it; without this
    // anyone could POST an arbitrary string and have it stored. axios throws
    // on a non-2xx, which the catch below turns into a 500.
    await axios.get(`${BASE_URL}/profiles`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });

    const cookieStore = await cookies();
    const isSecure = process.env.NODE_ENV === 'production';

    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: isSecure,
      path: '/',
      maxAge: 60 * 60 * 24, // matches the backend's access-token lifetime
      sameSite: 'lax',
    });

    // No `isAdmin` cookie: middleware reads the role from the token claim.

    if (userId) {
      cookieStore.set('userId', userId, {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        maxAge: 60 * 60 * 24,
        sameSite: 'lax',
      });
    }

    await migrateGuestCart(accessToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete authentication' },
      { status: 500 },
    );
  }
}
