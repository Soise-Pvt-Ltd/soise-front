import ProfileClient from './profileClient';
import { cookies } from 'next/headers';

export default async function OnBoardingCreatorPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const googleToken = cookieStore.get('token')?.value;

  const token = accessToken || googleToken;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  let dashboard = null;

  try {
    const dashboardRes = await fetch(`${baseUrl}/creators/dashboard`, {
      method: 'GET',
      headers: {
        Cookie: `access_token=${token}`,
      },
      cache: 'no-store',
    });

    if (!dashboardRes.ok) {
      console.error('Dashboard error:', await dashboardRes.text());
    } else {
      const res = await dashboardRes.json();
      dashboard = res.data;
    }
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
  }

  //console.log(dashboard);
  return <ProfileClient dashboard={dashboard} />;
}
