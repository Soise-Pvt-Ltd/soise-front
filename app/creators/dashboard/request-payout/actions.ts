'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function getWallet() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  try {
    const res = await fetch(`${BASE_URL}/wallet/`, {
      method: 'GET',
      headers: {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, error: 'Failed to fetch wallet' };
    }

    const json = await res.json();
    return { success: true, data: json.data };
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return { success: false, error: 'Failed to fetch wallet' };
  }
}

export async function requestPayout(amount: number) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  if (!amount || amount <= 0) {
    return { success: false, error: 'Valid amount is required' };
  }

  try {
    const res = await fetch(`${BASE_URL}/wallet/payout`, {
      method: 'POST',
      headers: {
        Cookie: `access_token=${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        const errorJson = JSON.parse(text);
        return { success: false, error: errorJson.message || 'Payout request failed' };
      } catch {
        return { success: false, error: 'Payout request failed' };
      }
    }

    const json = await res.json();
    return { success: true, data: json.data };
  } catch (error) {
    console.error('Error requesting payout:', error);
    return { success: false, error: 'Failed to request payout' };
  }
}

export async function getUserPayouts(limit = 50, offset = 0) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  try {
    const res = await fetch(
      `${BASE_URL}/wallet/payouts?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          Cookie: `access_token=${accessToken}`,
          Accept: 'application/json',
        },
      },
    );

    if (!res.ok) {
      return { success: false, error: 'Failed to fetch payouts' };
    }

    const json = await res.json();
    return { success: true, data: json.data, meta: json.meta };
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return { success: false, error: 'Failed to fetch payouts' };
  }
}
