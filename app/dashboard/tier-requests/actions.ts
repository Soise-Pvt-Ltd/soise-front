'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function authHeader() {
  const accessToken = (await cookies()).get('access_token')?.value;
  return accessToken ? { Cookie: `access_token=${accessToken}`, Accept: 'application/json' } : null;
}

export async function fetchTierRequests(status: string = 'pending') {
  const h = await authHeader();
  if (!h) return { success: false, data: [], error: 'Unauthorized' };
  const qs = new URLSearchParams();
  if (status && status !== 'all') qs.set('status', status);
  try {
    const res = await fetch(`${BASE_URL}/admin/tier-upgrade-requests?${qs}`, { headers: h, cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) return { success: false, data: [], error: json.message };
    return { success: true, data: json.data || [] };
  } catch {
    return { success: false, data: [], error: 'Failed to load requests' };
  }
}

export async function fetchTiers() {
  const h = await authHeader();
  if (!h) return { success: false, data: [] };
  try {
    const res = await fetch(`${BASE_URL}/tiers/admin/tiers`, { headers: h, cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) return { success: false, data: [] };
    return { success: true, data: json.data || [] };
  } catch {
    return { success: false, data: [] };
  }
}

export async function reviewTierRequest(
  requestId: string,
  action: 'approve' | 'reject',
  tierId?: string,
  reviewNote?: string,
) {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return { success: false, error: 'Unauthorized' };
  try {
    const res = await fetch(`${BASE_URL}/admin/tier-upgrade-requests/${requestId}/review`, {
      method: 'POST',
      headers: {
        Cookie: `access_token=${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ action, tier_id: tierId || undefined, review_note: reviewNote }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.message || 'Review failed' };
    return { success: true, data: json.data };
  } catch {
    return { success: false, error: 'Review failed' };
  }
}
