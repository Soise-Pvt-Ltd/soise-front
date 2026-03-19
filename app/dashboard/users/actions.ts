'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function fetchUsers(
  limit = 50,
  offset = 0,
  search = '',
  period = 'All Time',
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

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

  if (search) queryParams.append('search', search);

  if (period && period !== 'All Time') {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    let startDate;

    switch (period) {
      case 'Last 7 Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'Last 30 Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'Last 90 Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
    }

    if (startDate) {
      queryParams.append('startDate', startDate.toISOString());
    }
  }

  const res = await fetch(`${BASE_URL}/admin/users?${queryParams.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Cookie: `access_token=${accessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
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

export async function updateUserRole(userId: string, role: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/users/${userId}/role`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${accessToken}`,
        },
        body: JSON.stringify({ role }),
      },
    );
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.message || 'Failed to update role' };
    }

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}
