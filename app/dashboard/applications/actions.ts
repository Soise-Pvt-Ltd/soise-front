'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function fetchApplications(
  status: string = 'submitted',
  limit: number = 50,
  offset: number = 0,
) {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return { success: false, data: [], error: 'Unauthorized' };

  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (status && status !== 'all') qs.set('status', status);

  try {
    const res = await fetch(`${BASE_URL}/admin/creator-applications?${qs}`, {
      headers: { Cookie: `access_token=${accessToken}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) return { success: false, data: [], error: json.message || 'Failed to load' };
    return { success: true, data: json.data || [], meta: json.meta };
  } catch {
    return { success: false, data: [], error: 'Failed to load applications' };
  }
}

export async function reviewApplication(
  applicationId: string,
  action: 'approve' | 'reject',
  reason?: string,
) {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return { success: false, error: 'Unauthorized' };

  try {
    const res = await fetch(
      `${BASE_URL}/admin/creator-applications/${applicationId}/review`,
      {
        method: 'POST',
        headers: {
          Cookie: `access_token=${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      },
    );
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.message || 'Review failed' };
    return { success: true, data: json.data };
  } catch {
    return { success: false, error: 'Review failed' };
  }
}
