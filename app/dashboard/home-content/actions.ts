'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export type HomepageSlot =
  | 'hero'
  | 'mens_top'
  | 'explore_collection'
  | 'gallery_1'
  | 'gallery_2'
  | 'gallery_3';

export type HomepageTextSlot =
  | 'hero_headline'
  | 'hero_subheadline'
  | 'mens_tops_title'
  | 'mens_tops_cta';

export type HomepageImages = Partial<Record<HomepageSlot, string | null>>;
export type HomepageTexts = Partial<Record<HomepageTextSlot, string | null>>;

async function authHeader() {
  const accessToken = (await cookies()).get('access_token')?.value;
  return accessToken
    ? { Cookie: `access_token=${accessToken}`, Accept: 'application/json' }
    : null;
}

export async function getHomepageContent(): Promise<{
  success: boolean;
  images: HomepageImages;
  texts: HomepageTexts;
  error?: string;
}> {
  const h = await authHeader();
  if (!h) return { success: false, images: {}, texts: {}, error: 'Unauthorized' };
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
        texts: {},
        error: json?.message || 'Failed to load homepage content',
      };
    }
    return {
      success: true,
      images: json?.data?.images || {},
      texts: json?.data?.texts || {},
    };
  } catch {
    return {
      success: false,
      images: {},
      texts: {},
      error: 'Failed to load homepage content',
    };
  }
}

export async function saveHomepageContent(
  images: HomepageImages,
  texts: HomepageTexts,
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
      body: JSON.stringify({ images, texts }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json?.message || 'Failed to save' };
    }
    // Purge the homepage cache so the new content shows immediately on reload.
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to save changes' };
  }
}
