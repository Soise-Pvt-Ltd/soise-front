import CreatorDashboardClient from './dashboardClient';
import { cookies } from 'next/headers';

export default async function OnBoardingCreatorPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const googleToken = cookieStore.get('token')?.value;

  const token = accessToken || googleToken;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  let dashboard = null;
  // The active code's created_at drives the 24h "you can still change it" window.
  let codeCreatedAt: string | null = null;

  try {
    const [dashboardRes, codesRes] = await Promise.all([
      fetch(`${baseUrl}/creators/dashboard`, {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/creators/codes`, {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
        cache: 'no-store',
      }),
    ]);

    if (!dashboardRes.ok) {
      console.error('Dashboard error:', await dashboardRes.text());
    } else {
      const res = await dashboardRes.json();
      dashboard = res.data;
    }

    if (codesRes.ok) {
      const res = await codesRes.json();
      const codes = Array.isArray(res?.data) ? res.data : [];
      const activeCode =
        codes.find((c: any) => c?.active) ?? codes[0] ?? null;
      codeCreatedAt = activeCode?.created_at ?? null;
    } else {
      console.error('Codes error:', await codesRes.text());
    }
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
  }

  return (
    <CreatorDashboardClient dashboard={dashboard} codeCreatedAt={codeCreatedAt} />
  );
}
