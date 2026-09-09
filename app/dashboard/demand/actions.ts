'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface DemandRow {
  variant_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  product_id: string | null;
  product_name: string | null;
  product_slug: string | null;
  image: string | null;
  /** Units on orders that got past payment. */
  sold: number;
  /** Units on created/pending orders — intent, money not in. */
  unpaid: number;
  /** Units checkout could not cover: demand already missed. */
  backordered: number;
  /** Units sitting in live bags right now. */
  in_cart: number;
  demand_score: number;
  restock_suggestion: number;
  last_wanted_at: string | null;
}

export interface DemandRollup {
  size?: string;
  color?: string;
  sold: number;
  unpaid: number;
  backordered: number;
  in_cart: number;
  stock: number;
  demand_score: number;
}

export interface VariantDemand {
  windowDays: number;
  weights: Record<string, number>;
  variants: DemandRow[];
  sizes: DemandRollup[];
  colors: DemandRollup[];
}

type Result =
  | { success: true; demand: VariantDemand }
  | { success: false; error: string };

export async function getVariantDemand(days: number): Promise<Result> {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return { success: false, error: 'Unauthorized' };

  try {
    const res = await fetch(`${BASE_URL}/admin/inventory/demand?days=${days}`, {
      headers: { Cookie: `access_token=${accessToken}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.message || 'Failed to load demand' };
    const data = json?.data ?? {};
    return {
      success: true,
      demand: {
        windowDays: Number(data.window_days ?? days),
        weights: data.weights ?? {},
        variants: Array.isArray(data.variants) ? data.variants : [],
        sizes: Array.isArray(data.sizes) ? data.sizes : [],
        colors: Array.isArray(data.colors) ? data.colors : [],
      },
    };
  } catch {
    return { success: false, error: 'Failed to load demand' };
  }
}
