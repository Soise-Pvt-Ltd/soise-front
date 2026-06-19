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
      // Degrade to an empty dashboard rather than crashing the whole admin.
      return <HomeClient data={null} />;
    }

    const data = await res.json();

    // data.data is an object on success, or (on a backend query error) a string.
    // HomeClient normalizes any non-object to safe zeros, so never throw here.
    return <HomeClient data={data?.data} />;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return <HomeClient data={null} />;
  }
}
