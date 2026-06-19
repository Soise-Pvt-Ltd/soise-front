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

export async function getBanks() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  try {
    const res = await fetch(`${BASE_URL}/payments/banks`, {
      method: 'GET',
      headers: {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { success: false, error: 'Failed to fetch banks' };
    }

    const json = await res.json();
    return { success: true, data: json.data };
  } catch (error) {
    console.error('Error fetching banks:', error);
    return { success: false, error: 'Failed to fetch banks' };
  }
}

export async function savePayoutAccount(payload: {
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return { success: false, error: 'Unauthorized' };

  const { bank_name, bank_code, account_number, account_name } = payload;

  if (!bank_name || !bank_code || !account_number || !account_name) {
    return { success: false, error: 'Please fill in all fields' };
  }

  if (!/^\d{10}$/.test(account_number)) {
    return { success: false, error: 'Account number must be 10 digits' };
  }

  try {
    const res = await fetch(`${BASE_URL}/creators/onboard`, {
      method: 'POST',
      headers: {
        Cookie: `access_token=${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        bank_name,
        bank_code,
        account_number,
        account_name,
      }),
    });

    if (!res.ok) {
      // Avoid surfacing raw upstream error detail to the UI.
      console.error(
        'Save payout account failed:',
        res.status,
        await res.text(),
      );
      return {
        success: false,
        error: 'Failed to save payout account. Please try again.',
      };
    }

    const json = await res.json();
    return { success: true, data: json.data ?? json };
  } catch (error) {
    console.error('Error saving payout account:', error);
    return { success: false, error: 'Failed to save payout account' };
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
