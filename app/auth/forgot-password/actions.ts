'use server';

import { cookies } from 'next/headers';

// The backend has no password-reset endpoint, but it supports passwordless
// email-OTP login. We use that as the account-recovery path: email a one-time
// code, then exchange it for a session — exactly like the login flow.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.soise.ng';

export async function requestRecoveryOtp(email: string) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/send-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        message:
          data?.message || data?.error || 'Could not send a recovery code.',
      };
    }

    return {
      success: true,
      message: data?.message || 'Recovery code sent to your email.',
    };
  } catch (err) {
    console.error('requestRecoveryOtp error:', err);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}

export async function verifyRecoveryOtp(email: string, code: string) {
  if (!email || !code) {
    return { success: false, message: 'Email and code are required.' };
  }

  try {
    const authResponse = await fetch(`${BASE_URL}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const authData = await authResponse.json().catch(() => null);

    if (!authResponse.ok) {
      return {
        success: false,
        message:
          authData?.message || authData?.error || 'Invalid or expired code.',
      };
    }

    // Backend issues tokens as httpOnly Set-Cookie headers; forward them.
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
      const maxAge = maxAgeAttr
        ? parseInt(maxAgeAttr.split('=')[1], 10)
        : undefined;

      if (name === 'access_token') accessToken = value;

      cookieStore.set(name, value, {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        ...(maxAge !== undefined && { maxAge }),
        sameSite: 'lax',
      });
    }

    if (accessToken) {
    // No `isAdmin` cookie is written any more, and no profile fetch is needed
    // to build one. Admin-ness is read from the access token's `role` claim in
    // middleware.ts. Caching it in a second cookie with its own 24h lifetime,
    // while the session refreshed for 30 days, is what silently locked admins
    // out of /dashboard from day two onward — and the OTP sign-in path never
    // wrote it at all, so an admin who signed in by email code never got in.
    }

    return { success: true };
  } catch (err) {
    console.error('verifyRecoveryOtp error:', err);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}
