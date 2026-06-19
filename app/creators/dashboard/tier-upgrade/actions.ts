'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function submitTierUpgrade(
  followerCount: number,
  socialHandle?: string,
  note?: string,
) {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return { success: false, error: 'Unauthorized' };

  try {
    const res = await fetch(`${BASE_URL}/creators/tier-upgrade-request`, {
      method: 'POST',
      headers: {
        Cookie: `access_token=${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        follower_count: followerCount,
        social_handle: socialHandle,
        note,
      }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.message || 'Failed to submit' };
    return { success: true, data: json.data };
  } catch {
    return { success: false, error: 'Failed to submit request' };
  }
}

export async function getMyTierRequests() {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return { success: false, data: [] };

  try {
    const res = await fetch(`${BASE_URL}/creators/tier-upgrade-request`, {
      headers: { Cookie: `access_token=${accessToken}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) return { success: false, data: [] };
    return { success: true, data: json.data || [] };
  } catch {
    return { success: false, data: [] };
  }
}
