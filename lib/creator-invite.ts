import { cookies } from 'next/headers';

export const CREATOR_INVITE_COOKIE = 'creator_invite';

export type InviteInfo = { code: string; recruiterName: string };

/**
 * Resolve a creator invite code to the recruiting creator's name, via the
 * public lookup. Returns null for a code that can't recruit (unknown,
 * deactivated, or the house code) so the page simply shows no banner —
 * attribution is best-effort at this stage; the backend re-validates on apply.
 */
export async function lookupInvite(code?: string | null): Promise<InviteInfo | null> {
  const clean = (code || '').trim().toUpperCase();
  if (!clean) return null;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/creators/invite/${encodeURIComponent(clean)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!data?.code) return null;
    return { code: data.code, recruiterName: data.recruiter_name || 'A Soise creator' };
  } catch {
    return null;
  }
}

/** The invite code to use: the URL wins over the cookie, both normalised. */
export async function pendingInviteCode(fromUrl?: string | null): Promise<string | null> {
  const url = (fromUrl || '').trim();
  if (url) return url.toUpperCase();
  const cookie = (await cookies()).get(CREATOR_INVITE_COOKIE)?.value;
  return cookie ? decodeURIComponent(cookie).toUpperCase() : null;
}
