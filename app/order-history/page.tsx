export const runtime = 'nodejs';

import OrderHistoryClient from './OrderHistoryCLient';

export default async function OrderHistoryPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/orders`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }

  const data = await res.json();

  return <OrderHistoryClient orders={data.data} />;
}
