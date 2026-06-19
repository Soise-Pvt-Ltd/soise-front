export const runtime = 'nodejs';

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Nav from '@/components/home/nav/Nav';
import WishlistClient, { WishlistItem } from './WishlistClient';

export const metadata: Metadata = {
  title: 'Your Wishlist',
  description: 'Products you’ve saved for later on SOISE.',
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.soise.ng';

  let items: WishlistItem[] = [];

  // The middleware already redirects unauthenticated users to login, but we
  // still guard here and degrade gracefully on any fetch failure.
  if (accessToken) {
    try {
      const res = await fetch(`${baseUrl}/wishlist/`, {
        headers: {
          Cookie: `access_token=${accessToken}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data?.data?.items) ? data.data.items : [];
        items = raw.map((it: any): WishlistItem => {
          const variant = Array.isArray(it.sample_variant)
            ? it.sample_variant[0]
            : it.sample_variant;
          const image =
            variant?.media?.[0]?.variants?.medium ||
            variant?.media?.[0]?.url ||
            (Array.isArray(it.product_images) ? it.product_images[0] : '') ||
            '';
          return {
            id: String(it.id ?? ''),
            productId: String(it.product ?? ''),
            slug: String(it.product_slug ?? ''),
            name: String(it.product_name ?? 'Product'),
            price: Number(it.product_price ?? variant?.price ?? 0),
            image,
            status: String(it.product_status ?? 'active'),
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    }
  }

  return (
    <>
      <Nav />
      <WishlistClient items={items} />
    </>
  );
}
