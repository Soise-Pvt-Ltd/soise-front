'use server';

import { cookies } from 'next/headers';

export async function getUserInfo() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return { success: false, message: 'Not authenticated' };
    }

    const userRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/profiles`,
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

    if (userRes.ok) {
      const userData = await userRes.json();
      return {
        success: true,
        user: userData.data,
      };
    }

    return { success: false, message: 'Failed to fetch user info' };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return { success: false, message: 'Failed to fetch user info' };
  }
}
