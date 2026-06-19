'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

/**
 * Change the creator's own code. Only succeeds within 24h of the active code's
 * creation (enforced by the backend). Pass a `customCode` to request a specific
 * code, or omit it to have the backend randomize a new one.
 */
export async function changeCreatorCode(customCode?: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  const trimmed = customCode?.trim();
  const body: Record<string, string> = {};
  if (trimmed) {
    if (!/^[A-Za-z0-9-]{3,30}$/.test(trimmed)) {
      return {
        success: false,
        error: 'Code must be 3–30 letters, numbers, or dashes.',
      };
    }
    body.custom_code = trimmed;
  }

  try {
    const res = await fetch(`${BASE_URL}/creators/code/change`, {
      method: 'POST',
      headers: {
        Cookie: `access_token=${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: json?.message || 'Failed to change creator code.',
      };
    }

    return { success: true, data: json?.data ?? json };
  } catch (error) {
    console.error('Error changing creator code:', error);
    return { success: false, error: 'Failed to change creator code.' };
  }
}
