import HomeClient from './home/HomeClient';
import { cookies } from 'next/headers';

/** Best-effort: the funnel must never take the whole dashboard down with it. */
async function fetchFunnel(baseUrl: string | undefined, accessToken?: string) {
  if (!baseUrl || !accessToken) return null;
  try {
    const res = await fetch(`${baseUrl}/admin/funnel?days=30`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

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
      // Degrade rather than crash — but say so. Rendering the empty dashboard
      // silently showed an admin "Total Revenue 0.00 / No recent orders",
      // which is indistinguishable from a brand-new store.
      return <HomeClient data={null} loadFailed />;
    }

    const data = await res.json();
    const funnel = await fetchFunnel(baseUrl, accessToken);

    // data.data is an object on success, or (on a backend query error) a string.
    // HomeClient normalizes any non-object to safe zeros, so never throw here.
    return <HomeClient data={data?.data} funnel={funnel} />;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return <HomeClient data={null} loadFailed />;
  }
}
