'use server';

import { getBackendToken } from '@/lib/server-auth';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  avatar?: string;
  phone?: string;
  socials?: Record<string, unknown>;
}

/**
 * Update the signed-in creator's profile. Forwards the `access_token` cookie to
 * the backend `PUT /profiles/` endpoint, which accepts any subset of
 * { first_name, last_name, avatar, phone, socials } and returns the updated
 * profile as `{ success, data }`.
 */
export async function updateProfile(payload: UpdateProfilePayload) {
  const accessToken = await getBackendToken();

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  // Only forward fields that were actually provided.
  const body: Record<string, unknown> = {};
  if (payload.first_name !== undefined) body.first_name = payload.first_name;
  if (payload.last_name !== undefined) body.last_name = payload.last_name;
  if (payload.avatar !== undefined) body.avatar = payload.avatar;
  if (payload.phone !== undefined) body.phone = payload.phone;
  if (payload.socials !== undefined) body.socials = payload.socials;

  if (Object.keys(body).length === 0) {
    return { success: false, error: 'Nothing to update' };
  }

  try {
    const res = await fetch(`${BASE_URL}/profiles/`, {
      method: 'PUT',
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
        error: json?.message || 'Failed to update profile.',
      };
    }

    return { success: true, data: json?.data ?? json };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile.' };
  }
}
