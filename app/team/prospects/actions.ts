'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function authHeaders(json = false) {
  const token = (await cookies()).get('access_token')?.value;
  if (!token) return null;
  const h: Record<string, string> = {
    Cookie: `access_token=${token}`,
    Accept: 'application/json',
  };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

export interface ProspectPayload {
  handle: string;
  platform?: string;
  display_name?: string;
  profile_url?: string;
  contact?: string;
  niche?: string;
  location?: string;
  follower_count?: number | string;
  engagement_rate?: number | string;
  source?: string;
  notes?: string;
  stage?: string;
  invite_token?: string;
  score_aesthetic?: number;
  score_engagement?: number;
  score_audience?: number;
  score_cadence?: number;
  score_fit?: number;
}

export async function fetchProspects(
  search = '',
  stage = 'all',
  tier = 'all',
) {
  const h = await authHeaders();
  if (!h) return { success: false, data: [] as any[], error: 'Unauthorized' };
  const qs = new URLSearchParams();
  if (search && search.trim()) qs.set('search', search.trim());
  if (stage && stage !== 'all') qs.set('stage', stage);
  if (tier && tier !== 'all') qs.set('tier', tier);
  try {
    const res = await fetch(`${BASE_URL}/team/prospects?${qs}`, {
      headers: h,
      cache: 'no-store',
    });
    if (!res.ok) return { success: false, data: [], error: `HTTP ${res.status}` };
    const json = await res.json();
    return { success: true, data: Array.isArray(json.data) ? json.data : [] };
  } catch {
    return { success: false, data: [], error: 'Failed to load prospects' };
  }
}

export async function fetchProspectStats() {
  const h = await authHeaders();
  if (!h) return { total: 0, by_stage: {}, by_tier: {} };
  try {
    const res = await fetch(`${BASE_URL}/team/prospects/stats`, {
      headers: h,
      cache: 'no-store',
    });
    if (!res.ok) return { total: 0, by_stage: {}, by_tier: {} };
    const json = await res.json();
    return json?.data || { total: 0, by_stage: {}, by_tier: {} };
  } catch {
    return { total: 0, by_stage: {}, by_tier: {} };
  }
}

export async function createProspect(payload: ProspectPayload) {
  const h = await authHeaders(true);
  if (!h) return { success: false, error: 'Unauthorized' };
  try {
    const res = await fetch(`${BASE_URL}/team/prospects`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok)
      return { success: false, error: json.message || 'Could not log prospect' };
    revalidatePath('/team/prospects');
    revalidatePath('/team');
    return { success: true, data: json.data };
  } catch {
    return { success: false, error: 'Could not log prospect' };
  }
}

export async function updateProspect(
  id: string,
  payload: Partial<ProspectPayload>,
) {
  const h = await authHeaders(true);
  if (!h) return { success: false, error: 'Unauthorized' };
  try {
    const res = await fetch(`${BASE_URL}/team/prospects/${id}`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok)
      return { success: false, error: json.message || 'Could not update prospect' };
    revalidatePath('/team/prospects');
    revalidatePath('/team');
    return { success: true, data: json.data };
  } catch {
    return { success: false, error: 'Could not update prospect' };
  }
}

export async function deleteProspect(id: string) {
  const h = await authHeaders();
  if (!h) return { success: false, error: 'Unauthorized' };
  try {
    const res = await fetch(`${BASE_URL}/team/prospects/${id}`, {
      method: 'DELETE',
      headers: h,
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { success: false, error: json.message || 'Could not remove prospect' };
    }
    revalidatePath('/team/prospects');
    revalidatePath('/team');
    return { success: true };
  } catch {
    return { success: false, error: 'Could not remove prospect' };
  }
}
