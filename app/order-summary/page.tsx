export const runtime = 'nodejs';

import OrderSummaryClient from './OtherSummaryClient';

export default async function OrderSummaryPage() {
  // const res = await fetch('https://dummyjson.com/products', {
  //   // next: { revalidate: 3600 },
  // });

  // if (!res.ok) {
  //   return <h1>Failed to load order summary.</h1>;
  // }

  // const data = await res.json();

  // return <OrderSummaryClient products={data.products} />;
  return <OrderSummaryClient />;
}
