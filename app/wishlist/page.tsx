export const runtime = 'nodejs';

import { redirect } from 'next/navigation';
//import WishlistClient from './WishlistClient';
export default async function WishlistPage() {
  redirect('/');
  // const res = await fetch('https://dummyjson.com/products', {
  //   next: { revalidate: 3600 },
  // });

  // if (!res.ok) {
  //   return <h1>Failed to load wishlist.</h1>;
  // }

  // const data = await res.json();

  // return <WishlistClient products={data.products} />;
}
