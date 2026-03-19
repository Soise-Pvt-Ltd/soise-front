'use server';
import { cookies } from 'next/headers';

interface VerifyOtpPayload {
  code: string;
  email: string;
}

interface ResendOtpPayload {
  email: string;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const { code, email } = payload;

  if (!code || !email) {
    return { success: false, message: 'Code and email are required' };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, email }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data?.message || data?.error || 'OTP verification failed.';
      return { success: false, message: errorMessage };
    }

    // Backend sends tokens as Set-Cookie headers — forward them to the browser.
    const cookieStore = await cookies();
    const isSecure = process.env.NODE_ENV === 'production';

    const setCookieHeaders = response.headers.getSetCookie
      ? response.headers.getSetCookie()
      : (response.headers.get('set-cookie') ?? '').split(/,(?=[^ ])/);

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

      cookieStore.set(name, value, {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        ...(maxAge !== undefined && { maxAge }),
        sameSite: 'lax',
      });
    }

    return { success: true, data };
  } catch (err) {
    console.error('OTP verification error:', err);
    return { success: false, message: 'An internal error occurred' };
  }
}

export async function resendOtp(payload: ResendOtpPayload) {
  const { email } = payload;

  if (!email) {
    return { success: false, message: 'Email is required' };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/resend-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.message || 'Failed to resend code.';
      return { success: false, message: errorMessage };
    }

    return {
      success: true,
      message: 'A new code has been sent to your email.',
    };
  } catch (err) {
    console.error('Resend OTP error:', err);
    return { success: false, message: 'An internal error occurred' };
  }
}
