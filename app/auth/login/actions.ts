'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { migrateGuestCart } from '@/lib/cart-migrate';

export async function login(
  email: string,
  password: string,
  callbackUrl?: string | null,
) {
  const BASE_URL = 'https://api.soise.ng';
  try {
    if (!email || !password) {
      return { success: false, message: 'Email and password are required' };
    }

    // Attempt to log in by calling the external API
    const authResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      const errorMessage =
        authData?.error || authData?.message || 'Signin failed';

      if (
        errorMessage ===
        'Email not verified. Please verify your email before logging in.'
      ) {
        redirect(`/auth/otp?email=${encodeURIComponent(email)}`);
      }
      return { success: false, message: errorMessage };
    }

    // Backend sends tokens as Set-Cookie headers (httpOnly), not in response body.
    // Server actions must manually extract and forward them to the browser.
    const cookieStore = await cookies();
    const isSecure = process.env.NODE_ENV === 'production';

    const setCookieHeaders = authResponse.headers.getSetCookie
      ? authResponse.headers.getSetCookie()
      : (authResponse.headers.get('set-cookie') ?? '').split(/,(?=[^ ])/);

    let accessToken: string | undefined;

    for (const raw of setCookieHeaders) {
      const [nameValue, ...attrs] = raw.split(';').map((s) => s.trim());
      const eqIndex = nameValue.indexOf('=');
      if (eqIndex === -1) continue;
      const name = nameValue.slice(0, eqIndex).trim();
      const value = nameValue.slice(eqIndex + 1).trim();

      const maxAgeAttr = attrs.find((a) =>
        a.toLowerCase().startsWith('max-age='),
      );
      const maxAge = maxAgeAttr ? parseInt(maxAgeAttr.split('=')[1], 10) : undefined;

      if (name === 'access_token') accessToken = value;

      cookieStore.set(name, value, {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        ...(maxAge !== undefined && { maxAge }),
        sameSite: 'lax',
      });
    }

    // No `isAdmin` cookie is written any more, and no profile fetch is needed
    // to build one. Admin-ness is read from the access token's `role` claim in
    // middleware.ts. Caching it in a second cookie with its own 24h lifetime,
    // while the session refreshed for 30 days, is what silently locked admins
    // out of /dashboard from day two onward — and the OTP sign-in path never
    // wrote it at all, so an admin who signed in by email code never got in.
    if (accessToken) {
      // Carry whatever they put in the bag as a guest onto the account —
      // signing in mid-checkout must not look like the cart was emptied.
      await migrateGuestCart(accessToken);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
      throw err; // Re-throw redirect errors
    }
    console.error('Internal Signin Action Error:', err);
    return { success: false, message: 'An internal error occurred' };
  }

  redirect(callbackUrl || '/');
}
