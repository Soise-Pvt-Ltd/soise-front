import axios from 'axios';
import OrdersPage from './ordersClient';

export default async function UsersDashboardPage() {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/users`, {
      headers: {
        'Cache-Control': 'no-store',
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    });

    return <OrdersPage orders={res.data.data} />;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw new Error('Failed to fetch orers');
  }
}
