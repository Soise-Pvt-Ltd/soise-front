export const runtime = 'nodejs';

import Nav from '@/components/home/nav/Nav';
import OrderHistoryClient from './OrderHistoryCLient';
import { cookies } from 'next/headers';

export default async function OrderHistoryPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/orders`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Cookie: `access_token=${accessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }

  const data = await res.json();
  console.log(data.data);

  return (
    <>
      <Nav />
      <OrderHistoryClient orders={data.data} />
    </>
  );
}
