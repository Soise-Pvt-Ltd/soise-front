'use server';

import { cookies } from 'next/headers';
import { buildCreatorCode, creatorSuffixError } from '@/lib/creator-code';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

/**
 * Change the creator's own code. Only succeeds within 24h of the active code's
 * creation (enforced by the backend). Pass a `customCode` to request a specific
 * code, or omit it to have the backend randomize a new one.
 *
 * A creator only chooses the suffix — whatever arrives here is normalised back
 * under the `SWAZ-` prefix, so a caller that skips the dashboard still can't
 * mint an off-brand code. The backend does the same on its side.
 */
export async function changeCreatorCode(customCode?: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  const trimmed = customCode?.trim();
  const body: Record<string, string> = {};
  if (trimmed) {
    const error = creatorSuffixError(trimmed);
    if (error) return { success: false, error };
    body.custom_code = buildCreatorCode(trimmed);
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
