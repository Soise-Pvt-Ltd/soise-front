'use server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface SubscribeResult {
  success: boolean;
  message: string;
}

/**
 * Add an email to the SOISE mailing list. Talks to the backend
 * `POST /newsletter/subscribe`, which stores the subscriber and syncs them
 * into the Resend audience. Never throws — always returns a result the footer
 * can turn into a toast.
 */
export async function subscribeNewsletter(
  email: string,
  consent: boolean,
): Promise<SubscribeResult> {
  const trimmed = (email || '').trim();
  if (!trimmed || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  try {
    const res = await fetch(`${BASE_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: trimmed, consent, source: 'footer' }),
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok && json?.status !== false) {
      return {
        success: true,
        message: json?.message || "You're on the list! Enjoy 10% off your first order.",
      };
    }
    return {
      success: false,
      message: json?.message || 'Could not subscribe right now. Please try again.',
    };
  } catch {
    return {
      success: false,
      message: 'Could not subscribe right now. Please try again.',
    };
  }
}
