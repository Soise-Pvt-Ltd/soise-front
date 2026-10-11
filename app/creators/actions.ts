'use server';

import { cookies } from 'next/headers';
import { CREATOR_INVITE_COOKIE } from '@/lib/creator-invite';

export async function submitCreatorApplication(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const portfolioUrl = formData.get('portfolioUrl');
  const bio = formData.get('bio');
  const niche = formData.get('niche');
  // Creator-to-creator invite: the form carries what the page resolved; the
  // cookie is the fallback for a form rendered before the invite was known.
  const inviteCode =
    (formData.get('inviteCode') as string | null) ||
    cookieStore.get(CREATOR_INVITE_COOKIE)?.value ||
    null;

  const payload: Record<string, unknown> = {
    portfolio_url: portfolioUrl,
    bio: bio,
    niche: niche,
  };
  if (inviteCode) payload.invite_code = decodeURIComponent(inviteCode).toUpperCase();

  try {
    const checkResponse = await fetch(`${baseUrl}/creators/application`, {
      method: 'GET',
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
    });

    if (checkResponse.ok) {
      return { success: false, error: 'already applied' };
    }

    const response = await fetch(`${baseUrl}/creators/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // The backend's message is the useful one here ("That invite link is no
      // longer valid", "You can't use your own invite link").
      let message = '';
      try {
        message = (await response.json())?.message || '';
      } catch {
        /* non-JSON body */
      }
      return { success: false, error: message || 'Could not submit your application' };
    }

    // The invite did its job; a stale cookie must not ride on a future
    // application from this browser.
    if (inviteCode) {
      try {
        cookieStore.delete(CREATOR_INVITE_COOKIE);
      } catch {
        /* best-effort */
      }
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error submitting creator application:', error);
    return { success: false, error: 'Failed to submit creator application' };
  }
}
