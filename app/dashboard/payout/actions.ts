'use server';

import { cookies } from 'next/headers';

export async function fetchPayouts(
  limit = 50,
  offset = 0,
  search = '',
  status = 'All',
  period = 'All Time',
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

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

  // Backend supports 'pending' param: true = only requested, false = all
  if (status === 'requested') {
    queryParams.append('pending', 'true');
  } else {
    queryParams.append('pending', 'false');
  }

  const res = await fetch(
    `${baseUrl}/admin/payouts?${queryParams.toString()}`,
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
    const text = await res.text();
    console.error(`Upstream error: ${res.status} ${text}`);
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

export async function getPayoutBreakdown(id: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!accessToken) return { success: false, data: null as any };

  try {
    const res = await fetch(`${baseUrl}/admin/payouts/${id}/breakdown`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return { success: false, data: null as any };
    const json = await res.json();
    return { success: Boolean(json.success), data: json.data || null };
  } catch {
    return { success: false, data: null as any };
  }
}

export async function getPaystackBalance() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!accessToken) {
    return { success: false, balance: null as number | null };
  }

  try {
    const res = await fetch(`${baseUrl}/admin/payouts/balance`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return { success: false, balance: null as number | null };
    const json = await res.json();
    return {
      success: Boolean(json.success),
      balance: typeof json.data?.balance === 'number' ? json.data.balance : null,
      currency: json.data?.currency || 'NGN',
    };
  } catch {
    return { success: false, balance: null as number | null };
  }
}

export async function initiatePayout(id: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!accessToken) {
    return { success: false, message: 'Unauthorized' };
  }

  const res = await fetch(`${baseUrl}/admin/payouts/${id}/initiate`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Cookie: `access_token=${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Upstream error: ${res.status} ${text}`);
    try {
      const errorJson = JSON.parse(text);
      return {
        success: false,
        message: errorJson.message || 'Failed to initiate transfer',
      };
    } catch {
      return { success: false, message: 'Failed to initiate transfer' };
    }
  }

  const json = await res.json();
  return { success: Boolean(json.success), data: json.data, message: json.message };
}

export async function confirmPayout(id: string, otp: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!accessToken) {
    return { success: false, message: 'Unauthorized' };
  }

  if (!otp) {
    return { success: false, message: 'OTP is required' };
  }

  const res = await fetch(`${baseUrl}/admin/payouts/${id}/confirm`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Cookie: `access_token=${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ otp }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Upstream error: ${res.status} ${text}`);
    try {
      const errorJson = JSON.parse(text);
      return { success: false, message: errorJson.message || 'Failed to confirm payout' };
    } catch {
      return { success: false, message: 'Failed to confirm payout' };
    }
  }

  const json = await res.json();
  return { success: Boolean(json.success), data: json.data };
}
