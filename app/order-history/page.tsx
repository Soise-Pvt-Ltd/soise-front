import OrderHistoryClient from './OrderHistoryCLient';

export default async function OrderHistoryPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/orders`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }

  const data = await res.json();
  console.log(data);

  return <OrderHistoryClient orders={data.data} />;
}
