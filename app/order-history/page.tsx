import OrderHistoryClient from './OrderHistoryCLient';
import { cookies } from 'next/headers';

export default async function OrderHistoryPage() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get('accessToken')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/orders`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${isLoggedIn || ''}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }

  const data = await res.json();

  return <OrderHistoryClient orders={data.data} />;
}
