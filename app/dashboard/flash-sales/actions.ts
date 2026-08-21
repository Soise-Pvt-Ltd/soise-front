'use server';

import { cookies } from 'next/headers';

const BASE = process.env.NEXT_PUBLIC_BASE_URL;

async function authHeaders() {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return null;
  return {
    Cookie: `access_token=${accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export interface AdminVariant {
  id: string;
  sku?: string;
  color?: string | null;
  size?: string | null;
  price?: number | null;
  stock?: number;
  sale_price?: number | null;
}

export interface AdminProduct {
  id: string;
  name: string;
  status?: string;
  base_price?: number;
  sample_variants?: AdminVariant[];
}

export interface FlashSale {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  discount_pct: number;
  status: string;
  is_live?: boolean;
  variants?: Array<{ id?: string; sku?: string; size?: string | null; color?: string | null; product?: { id?: string; name?: string } | string }>;
}

/** Sales list + the product/variant catalogue the picker needs, in one round trip. */
export async function fetchFlashSalesPage() {
  const headers = await authHeaders();
  const empty = { success: false, sales: [] as FlashSale[], products: [] as AdminProduct[] };
  if (!headers) return empty;

  try {
    const [salesRes, productsRes] = await Promise.all([
      fetch(`${BASE}/flash-sales/admin?limit=100`, { headers, cache: 'no-store' }),
      // status=all so drafts are pickable: scheduling a sale on a product
      // that goes live the same morning is a normal drop workflow.
      fetch(`${BASE}/admin/products?limit=200&status=all`, { headers, cache: 'no-store' }),
    ]);

    const sales = salesRes.ok ? ((await salesRes.json())?.data ?? []) : [];
    const products = productsRes.ok ? ((await productsRes.json())?.data ?? []) : [];
    return { success: true, sales, products };
  } catch {
    return empty;
  }
}

export async function createFlashSale(input: {
  name: string;
  starts_at: string;
  ends_at: string;
  discount_pct: number;
  variant_ids: string[];
}) {
  const headers = await authHeaders();
  if (!headers) return { success: false, message: 'Not signed in' };

  try {
    const res = await fetch(`${BASE}/flash-sales/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    // The backend's ValueErrors are the useful part here ("Discount must be
    // between 1% and 90%"), so surface its message rather than a generic one.
    return {
      success: res.ok,
      message: json?.message || (res.ok ? 'Flash sale created' : 'Could not create the sale'),
      data: json?.data,
    };
  } catch {
    return { success: false, message: 'Could not reach the server' };
  }
}

export async function updateFlashSale(
  saleId: string,
  patch: Record<string, unknown>,
) {
  const headers = await authHeaders();
  if (!headers) return { success: false, message: 'Not signed in' };

  try {
    const res = await fetch(`${BASE}/flash-sales/${saleId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(patch),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      message: json?.message || (res.ok ? 'Flash sale updated' : 'Could not update the sale'),
      data: json?.data,
    };
  } catch {
    return { success: false, message: 'Could not reach the server' };
  }
}

/** Cancel takes effect immediately, mid-window. */
export async function cancelFlashSale(saleId: string) {
  const headers = await authHeaders();
  if (!headers) return { success: false, message: 'Not signed in' };

  try {
    const res = await fetch(`${BASE}/flash-sales/${saleId}`, {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      message: json?.message || (res.ok ? 'Flash sale cancelled' : 'Could not cancel the sale'),
    };
  } catch {
    return { success: false, message: 'Could not reach the server' };
  }
}
