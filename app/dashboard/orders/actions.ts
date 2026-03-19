'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function fetchOrders(
  limit = 50,
  offset = 0,
  search = '',
  status = 'All',
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
  if (status && status !== 'All') queryParams.append('status', status);

  if (period && period !== 'All Time') {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    let startDate;

    switch (period) {
      case 'Daily':
        startDate = today;
        break;
      case 'Weekly':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'Monthly':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
    }

    if (startDate) {
      queryParams.append('startDate', startDate.toISOString());
    }
  }

  const res = await fetch(
    `${BASE_URL}/admin/orders?${queryParams.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  );

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

export async function updateOrderStatus(orderId: string, status: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  try {
    const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${accessToken}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.message ||
          `Failed to update order status: ${response.statusText}`,
      };
    }

    const data = await response.json();

    revalidatePath('/dashboard/orders'); // Adjust path as needed

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
