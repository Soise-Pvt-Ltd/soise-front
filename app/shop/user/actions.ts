'use server';

import { getBackendToken } from '@/lib/server-auth';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

type Result<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function authed(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<{ ok: boolean; status: number; body: any }> {
  const token = await getBackendToken();
  if (!token) return { ok: false, status: 401, body: { message: 'Unauthorized' } };

  const { json, headers, ...rest } = init;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      Cookie: `access_token=${token}`,
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: 'no-store',
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

/** Load the signed-in user's profile + addresses (for prefilling the page). */
export async function getAccount(): Promise<Result> {
  const r = await authed('/profiles/', { method: 'GET' });
  if (!r.ok) return { success: false, error: r.body?.message || 'Failed to load account.' };
  return { success: true, data: r.body?.data ?? null };
}

export async function updateShopProfile(payload: {
  first_name?: string;
  last_name?: string;
  phone?: string;
}): Promise<Result> {
  const body: Record<string, unknown> = {};
  if (payload.first_name !== undefined) body.first_name = payload.first_name;
  if (payload.last_name !== undefined) body.last_name = payload.last_name;
  if (payload.phone !== undefined) body.phone = payload.phone;
  if (Object.keys(body).length === 0)
    return { success: false, error: 'Nothing to update.' };

  const r = await authed('/profiles/', { method: 'PUT', json: body });
  if (!r.ok) return { success: false, error: r.body?.message || 'Could not save your details.' };
  return { success: true, data: r.body?.data ?? null };
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<Result> {
  if (!oldPassword || !newPassword)
    return { success: false, error: 'Both passwords are required.' };
  if (newPassword.length < 8)
    return { success: false, error: 'New password must be at least 8 characters.' };

  const r = await authed('/auth/change-password', {
    method: 'POST',
    json: { old_password: oldPassword, new_password: newPassword },
  });
  if (!r.ok) return { success: false, error: r.body?.message || 'Could not change password.' };
  return { success: true };
}

export async function addAddress(payload: {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}): Promise<Result> {
  if (!payload.line1 || !payload.city || !payload.state || !payload.postal_code)
    return { success: false, error: 'Address, city, state and ZIP are required.' };

  const r = await authed('/profiles/addresses', {
    method: 'POST',
    json: {
      label: payload.label || 'Home',
      line1: payload.line1,
      line2: payload.line2 || null,
      city: payload.city,
      state: payload.state,
      country: payload.country || 'Nigeria',
      postal_code: payload.postal_code,
    },
  });
  if (!r.ok) return { success: false, error: r.body?.message || 'Could not add address.' };
  return { success: true, data: r.body?.data ?? null };
}

export async function setDefaultAddress(addressId: string): Promise<Result> {
  const r = await authed(`/profiles/addresses/${encodeURIComponent(addressId)}/default`, {
    method: 'PUT',
  });
  if (!r.ok) return { success: false, error: r.body?.message || 'Could not set default.' };
  return { success: true, data: r.body?.data ?? null };
}

export async function deleteAddress(addressId: string): Promise<Result> {
  const r = await authed(`/profiles/addresses/${encodeURIComponent(addressId)}`, {
    method: 'DELETE',
  });
  if (!r.ok) return { success: false, error: r.body?.message || 'Could not delete address.' };
  return { success: true, data: r.body?.data ?? null };
}
