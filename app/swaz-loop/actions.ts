'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface ReferralHistoryItem {
  reward_value: number;
  status: string;
  created_at: string;
  order_total: number;
}

export interface ReferralLedgerItem {
  direction: 'credit' | 'debit' | string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface ReferralRewardTerms {
  referrer_percent: number;
  referrer_cap: number;
  friend_welcome_credit: number;
  currency: string;
}

export interface MyReferral {
  referral_code: string;
  referral_link: string;
  store_credit_balance: number;
  total_earned: number;
  friends_converted: number;
  history: ReferralHistoryItem[];
  ledger: ReferralLedgerItem[];
  currency: string;
  reward_terms: ReferralRewardTerms;
}

export interface StoreCredit {
  store_credit_balance: number;
  currency: string;
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Fetch the signed-in user's full Swaz Loop referral profile:
 * code, shareable link, store-credit balance, earnings, and history/ledger.
 */
export async function getMyReferral(): Promise<ActionResult<MyReferral>> {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return { success: false, error: 'Unauthorized' };

  try {
    const res = await fetch(`${BASE_URL}/referrals/me`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { success: false, error: json?.message || 'Failed to load referral' };
    }
    return { success: true, data: json.data as MyReferral };
  } catch {
    return { success: false, error: 'Failed to load referral' };
  }
}

/**
 * Lightweight fetch of just the user's store-credit balance + currency.
 * Used by awareness placements (nav badge, checkout toggle) that don't need
 * the full referral payload.
 */
export async function getStoreCredit(): Promise<ActionResult<StoreCredit>> {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return { success: false, error: 'Unauthorized' };

  try {
    const res = await fetch(`${BASE_URL}/referrals/credit`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { success: false, error: json?.message || 'Failed to load store credit' };
    }
    return { success: true, data: json.data as StoreCredit };
  } catch {
    return { success: false, error: 'Failed to load store credit' };
  }
}
