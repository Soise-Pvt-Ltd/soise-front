'use server';

import { cookies } from 'next/headers';

export async function fetchCreatorCodes(limit = 50, offset = 0, search = '') {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const empty = {
    success: false,
    data: [] as any[],
    meta: { pagination: { limit, offset, count: 0, total: 0 } },
  };
  if (!accessToken) return empty;

  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (search) queryParams.append('search', search);

  try {
    const res = await fetch(
      `${baseUrl}/admin/creator-codes?${queryParams.toString()}`,
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
    if (!res.ok) return empty;
    const json = await res.json();
    return {
      success: Boolean(json.success),
      data: json.data || [],
      meta: json.meta || { pagination: { limit, offset, count: 0, total: 0 } },
    };
  } catch {
    return empty;
  }
}
