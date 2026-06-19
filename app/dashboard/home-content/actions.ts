'use server';

import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export type HomepageSlot =
  | 'hero'
  | 'mens_top'
  | 'explore_collection'
  | 'gallery_1'
  | 'gallery_2'
  | 'gallery_3';

export type HomepageImages = Partial<Record<HomepageSlot, string | null>>;

async function authHeader() {
  const accessToken = (await cookies()).get('access_token')?.value;
  return accessToken
    ? { Cookie: `access_token=${accessToken}`, Accept: 'application/json' }
    : null;
}

export async function getHomepageContent(): Promise<{
  success: boolean;
  images: HomepageImages;
  error?: string;
}> {
  const h = await authHeader();
  if (!h) return { success: false, images: {}, error: 'Unauthorized' };
  try {
    const res = await fetch(`${BASE_URL}/admin/content/homepage`, {
      headers: h,
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        images: {},
        error: json?.message || 'Failed to load homepage content',
      };
    }
    return { success: true, images: json?.data?.images || {} };
  } catch {
    return {
      success: false,
      images: {},
      error: 'Failed to load homepage content',
    };
  }
}

export async function saveHomepageContent(
  images: HomepageImages,
): Promise<{ success: boolean; error?: string }> {
  const accessToken = (await cookies()).get('access_token')?.value;
  if (!accessToken) return { success: false, error: 'Unauthorized' };
  try {
    const res = await fetch(`${BASE_URL}/admin/content/homepage`, {
      method: 'PUT',
      headers: {
        Cookie: `access_token=${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ images }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json?.message || 'Failed to save' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to save changes' };
  }
}
