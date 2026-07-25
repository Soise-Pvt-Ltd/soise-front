export const runtime = 'nodejs';

import Nav from '@/components/home/nav/Nav';
import OrderHistoryClient from './OrderHistoryCLient';
import { cookies } from 'next/headers';

import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
// Personalised / transactional page — no search value, and indexing it would
// expose order-flow URLs. Explicit noindex (robots.txt alone can't prevent
// URL-only indexing of a linked page).
export const metadata: Metadata = NOINDEX;

export default async function OrderHistoryPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  let orders: any[] = [];

  if (accessToken) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/orders`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Cookie: `access_token=${accessToken}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        orders = Array.isArray(data?.data) ? data.data : [];
      }
    } catch (error) {
      // Degrade gracefully to an empty order history rather than crashing.
      console.error('Failed to fetch orders:', error);
    }
  }

  return (
    <>
      <Nav />
      <OrderHistoryClient orders={orders} />
    </>
  );
}
