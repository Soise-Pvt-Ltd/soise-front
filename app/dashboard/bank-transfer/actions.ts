'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface BankTransferSettings {
  bankName: string;
  accountNumber: string;
  accountName: string;
  /** All three set: the checkout shows "Pay by bank transfer". */
  enabled: boolean;
  /** 'admin' once saved from here; 'env' while still on the server default. */
  source: 'admin' | 'env';
}

type Result =
  | { success: true; settings: BankTransferSettings }
  | { success: false; error: string };

function fromApi(data: Record<string, unknown> | undefined): BankTransferSettings {
  return {
    bankName: typeof data?.bank_name === 'string' ? data.bank_name : '',
    accountNumber: typeof data?.account_number === 'string' ? data.account_number : '',
    accountName: typeof data?.account_name === 'string' ? data.account_name : '',
    enabled: Boolean(data?.enabled),
    source: data?.source === 'admin' ? 'admin' : 'env',
  };
}

async function authHeader() {
  const accessToken = (await cookies()).get('access_token')?.value;
  return accessToken
    ? { Cookie: `access_token=${accessToken}`, Accept: 'application/json' }
    : null;
}

export async function getBankTransferSettings(): Promise<Result> {
  const h = await authHeader();
  if (!h) return { success: false, error: 'Unauthorized' };
  try {
    const res = await fetch(`${BASE_URL}/admin/settings/bank-transfer`, { headers: h, cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.message || 'Failed to load bank transfer settings' };
    return { success: true, settings: fromApi(json?.data) };
  } catch {
    return { success: false, error: 'Failed to load bank transfer settings' };
  }
}

export async function saveBankTransferSettings(
  bankName: string,
  accountNumber: string,
  accountName: string,
): Promise<Result> {
  const h = await authHeader();
  if (!h) return { success: false, error: 'Unauthorized' };
  try {
    const res = await fetch(`${BASE_URL}/admin/settings/bank-transfer`, {
      method: 'PUT',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
      }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.message || 'Failed to save bank transfer settings' };
    return { success: true, settings: fromApi(json?.data) };
  } catch {
    return { success: false, error: 'Failed to save bank transfer settings' };
  }
}
