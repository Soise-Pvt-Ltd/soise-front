export const dynamic = 'force-dynamic';

import OrdersPage from './ordersClient';
import { fetchOrders } from './actions';

export default async function UsersDashboardPage() {
  // fetch first page server-side
  const { success, data, meta } = await fetchOrders();

  return (
    <OrdersPage
      initialData={data}
      initialMeta={meta}
      fetchServerData={fetchOrders}
    />
  );
}
