'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface RestockSettings {
  /** YYYY-MM-DD (Lagos calendar date), or null when only the cycle drives the countdown. */
  nextRestockDate: string | null;
  restockCycleDays: number;
  /** Days the "in exactly N days" notice reads today. */
  countdownDays: number;
  /** 'admin' once saved from here; 'env' while still on the server default. */
  source: 'admin' | 'env';
}

type Result = { success: true; settings: RestockSettings } | { success: false; error: string };

function fromApi(data: Record<string, unknown> | undefined): RestockSettings {
  return {
    nextRestockDate: typeof data?.next_restock_date === 'string' ? data.next_restock_date : null,
    restockCycleDays: Number(data?.restock_cycle_days ?? 14),
    countdownDays: Number(data?.countdown_days ?? 14),
    source: data?.source === 'admin' ? 'admin' : 'env',
  };
}

async function authHeader() {
  const accessToken = (await cookies()).get('access_token')?.value;
  return accessToken
    ? { Cookie: `access_token=${accessToken}`, Accept: 'application/json' }
    : null;
}

export async function getRestockSettings(): Promise<Result> {
  const h = await authHeader();
  if (!h) return { success: false, error: 'Unauthorized' };
  try {
    const res = await fetch(`${BASE_URL}/admin/settings/restock`, { headers: h, cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.message || 'Failed to load restock settings' };
    return { success: true, settings: fromApi(json?.data) };
  } catch {
    return { success: false, error: 'Failed to load restock settings' };
  }
}

export async function saveRestockSettings(
  nextRestockDate: string,
  restockCycleDays: number,
): Promise<Result> {
  const h = await authHeader();
  if (!h) return { success: false, error: 'Unauthorized' };
  try {
    const res = await fetch(`${BASE_URL}/admin/settings/restock`, {
      method: 'PUT',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        next_restock_date: nextRestockDate,
        restock_cycle_days: restockCycleDays,
      }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.message || 'Failed to save restock settings' };
    return { success: true, settings: fromApi(json?.data) };
  } catch {
    return { success: false, error: 'Failed to save restock settings' };
  }
}
