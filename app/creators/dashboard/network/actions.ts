'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export type Recruit = {
  user_id: string;
  name?: string;
  avatar?: string | null;
  joined_at?: string;
  state: 'applied' | 'onboarding' | 'active' | 'not_approved';
  code?: string | null;
  tier_name?: string | null;
  orders: number;
  sales: number;
  override_orders: number;
  override_earned: number;
};

export type Network = {
  invite_code: string | null;
  invite_link: string | null;
  override_rate: number;
  recruited_by: { name?: string; code?: string | null } | null;
  recruits: Recruit[];
  recruits_count: number;
  active_recruits: number;
  override_earnings: { total: number; this_month: number };
  recent: Array<{
    reward_value: number;
    status: string;
    created_at?: string;
    creator_code?: string;
    recruit_name?: string;
    order_total?: number;
    meta?: { override_rate?: number };
  }>;
};

export async function getNetwork(): Promise<{ success: boolean; data: Network | null }> {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return { success: false, data: null };
  try {
    const res = await fetch(`${BASE_URL}/creators/network`, {
      headers: { Cookie: `access_token=${accessToken}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) return { success: false, data: null };
    return { success: true, data: json.data ?? null };
  } catch {
    return { success: false, data: null };
  }
}
