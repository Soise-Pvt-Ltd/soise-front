import HomeClient from './home/HomeClient';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    const data = await res.json();

    // return <HomeClient data={data.data} />;
    return <HomeClient data={data.data} />;
  } catch (error) {
    console.error('Failed to fetch dahsboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
}
