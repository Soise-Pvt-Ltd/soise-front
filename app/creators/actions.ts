'use server';

import { cookies } from 'next/headers';

export async function submitCreatorApplication(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const portfolioUrl = formData.get('portfolioUrl');
  const bio = formData.get('bio');
  const niche = formData.get('niche');

  const payload = {
    portfolio_url: portfolioUrl,
    bio: bio,
    niche: niche,
  };

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
      return { success: false, error: await response.text() };
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error submitting creator application:', error);
    return { success: false, error: 'Failed to submit creator application' };
  }
}
