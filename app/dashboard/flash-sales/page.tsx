export const dynamic = 'force-dynamic';

import FlashSalesClient from './flashSalesClient';
import { fetchFlashSalesPage } from './actions';

export default async function FlashSalesPage() {
  const { sales, products } = await fetchFlashSalesPage();
  return <FlashSalesClient initialSales={sales} products={products} />;
}
