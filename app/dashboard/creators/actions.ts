'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function fetchCreators(
  limit = 50,
  offset = 0,
  search = '',
  period = 'All Time',
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return {
      success: false,
      data: [],
      meta: { pagination: { limit, offset, count: 0 } },
    };
  }

  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (search) queryParams.append('search', search);

  if (period && period !== 'All Time') {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    let startDate;

    switch (period) {
      case 'Last 7 Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'Last 30 Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'Last 90 Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
    }

    if (startDate) {
      queryParams.append('startDate', startDate.toISOString());
    }
  }

  const res = await fetch(
    `${BASE_URL}/admin/creators?${queryParams.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    return {
      success: false,
      data: [],
      meta: { pagination: { limit, offset, count: 0 } },
    };
  }

  const json = await res.json();
  return {
    success: Boolean(json.success),
    data: json.data || [],
    meta: json.meta || { pagination: { limit, offset, count: 0 } },
  };
}

export async function fetchTiers() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return { success: false, data: [] };
  }

  const res = await fetch(`${BASE_URL}/tiers/admin/tiers`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Cookie: `access_token=${accessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    return { success: false, data: [] };
  }

  const json = await res.json();
  return { success: Boolean(json.success), data: json.data || [] };
}

export async function createTier(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  const res = await fetch(`${BASE_URL}/tiers/admin/tiers`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Cookie: `access_token=${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: formData.get('name'),
      description: formData.get('description') || '',
      level: Number(formData.get('level')),
      base_rate: Number(formData.get('base_rate') || '10'),
      max_rate: Number(formData.get('max_rate') || '20'),
    }),
  });

  const json = await res.json();
  if (!res.ok)
    return { success: false, error: json.message || 'Failed to create tier' };
  return { success: true, data: json.data };
}

export async function assignTierToCreator(creatorCodeId: string, tierId: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  const res = await fetch(
    `${BASE_URL}/tiers/${creatorCodeId}/manual-adjustment`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Cookie: `access_token=${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ tier_id: tierId, reason: 'admin_manual_assignment' }),
    },
  );

  const json = await res.json();
  if (!res.ok)
    return { success: false, error: json.message || 'Failed to assign tier' };
  return { success: true, data: json.data };
}

export async function updateTier(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const id = formData.get('id');

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  const payload: Record<string, any> = {
    name: formData.get('name'),
    level: Number(formData.get('level')),
  };
  if (formData.get('description')) payload.description = formData.get('description');
  if (formData.get('base_rate')) payload.base_rate = Number(formData.get('base_rate'));
  if (formData.get('max_rate')) payload.max_rate = Number(formData.get('max_rate'));

  const res = await fetch(`${BASE_URL}/tiers/admin/tiers/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      Cookie: `access_token=${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok)
    return { success: false, error: json.message || 'Failed to update tier' };
  return { success: true, data: json.data };
}
